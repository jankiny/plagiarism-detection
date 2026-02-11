import math
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models import Document
from app.models.library_document import LibraryDocument
from app.models.document_library import DocumentLibrary
from app.models.batch_library import BatchLibrary
from app.services.embedding import EmbeddingService


class PlagiarismService:
    def __init__(self, db_session: AsyncSession = None):
        self.db_session = db_session
        self.embedding_service = EmbeddingService()

    @staticmethod
    def calculate_similarity(embedding_a, embedding_b) -> float:
        """计算两个向量的余弦相似度（纯 Python 实现，无需 numpy）"""
        if not embedding_a or not embedding_b:
            return 0.0

        dot = sum(a * b for a, b in zip(embedding_a, embedding_b))
        norm_a = math.sqrt(sum(a * a for a in embedding_a))
        norm_b = math.sqrt(sum(b * b for b in embedding_b))

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot / (norm_a * norm_b)

    async def compare_documents(self, doc_a_text: str, doc_b_text: str) -> Dict[str, Any]:
        """
        使用分块分析比较两个文档。
        返回总体相似度和具体匹配段落。
        """
        chunks_a, embeddings_a = self.embedding_service.encode_chunks(doc_a_text)
        chunks_b, embeddings_b = self.embedding_service.encode_chunks(doc_b_text)

        if not embeddings_a or not embeddings_b:
            return {"score": 0.0, "matches": []}

        matches = []
        total_similarity = 0.0

        for i, emb_a in enumerate(embeddings_a):
            best_match_score = 0.0
            best_match_idx = -1

            for j, emb_b in enumerate(embeddings_b):
                score = self.calculate_similarity(emb_a, emb_b)
                if score > best_match_score:
                    best_match_score = score
                    best_match_idx = j

            if best_match_score > 0.75:
                matches.append({
                    "source_chunk": chunks_a[i],
                    "target_chunk": chunks_b[best_match_idx],
                    "score": round(best_match_score, 4),
                    "source_index": i,
                    "target_index": best_match_idx,
                })
                total_similarity += best_match_score

        overall_score = total_similarity / len(chunks_a) if chunks_a else 0.0

        return {
            "score": round(overall_score, 4),
            "matches": matches,
            "details": {
                "chunks_a": len(chunks_a),
                "chunks_b": len(chunks_b),
            },
        }

    async def find_similar_in_batch(self, document: Document, batch_id: str) -> List[Dict[str, Any]]:
        """在同一批次中查找相似文档"""
        if not self.db_session:
            raise ValueError("需要数据库会话才能进行批次搜索")

        query = select(Document).where(
            Document.batch_id == batch_id,
            Document.id != document.id,
        )
        result = await self.db_session.execute(query)
        other_docs = result.scalars().all()

        results = []
        for other_doc in other_docs:
            comparison = await self.compare_documents(document.text_content, other_doc.text_content)
            if comparison["score"] > 0.1:
                results.append({
                    "document_id": str(other_doc.id),
                    "filename": other_doc.filename,
                    "similarity": comparison["score"],
                    "matches": comparison["matches"],
                    "source_type": "internal",
                })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results

    async def find_similar_in_libraries(
        self, document: Document, library_ids: List[str], top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """在指定文档库中查找与给定文档相似的历史文档（两阶段检索）"""
        if not self.db_session:
            raise ValueError("需要数据库会话才能进行文档库搜索")

        if not document.embedding or not library_ids:
            return []

        results = []

        # 阶段1: 使用 pgvector 的 cosine_distance 做向量粗筛
        try:
            embedding_str = "[" + ",".join(str(x) for x in document.embedding) + "]"
            query = text("""
                SELECT ld.id, ld.library_id, ld.filename, ld.text_content,
                       dl.name as library_name,
                       (ld.embedding <=> :embedding::vector) as distance
                FROM library_documents ld
                JOIN document_libraries dl ON dl.id = ld.library_id
                WHERE ld.library_id = ANY(:library_ids)
                  AND ld.status = 'ready'
                  AND ld.embedding IS NOT NULL
                ORDER BY distance ASC
                LIMIT :top_k
            """)

            import uuid as uuid_mod
            lib_id_list = [uuid_mod.UUID(lid) if isinstance(lid, str) else lid for lid in library_ids]

            result = await self.db_session.execute(
                query,
                {
                    "embedding": embedding_str,
                    "library_ids": lib_id_list,
                    "top_k": top_k,
                }
            )
            candidates = result.fetchall()
        except Exception as e:
            print(f"向量粗筛失败: {e}")
            # Fallback: 直接查询所有文档库文档
            query = select(LibraryDocument).where(
                LibraryDocument.library_id.in_(library_ids),
                LibraryDocument.status == "ready",
            )
            result = await self.db_session.execute(query)
            all_lib_docs = result.scalars().all()

            candidates = []
            for lib_doc in all_lib_docs:
                if lib_doc.embedding:
                    dist = 1.0 - self.calculate_similarity(
                        list(document.embedding), list(lib_doc.embedding)
                    )
                    # 获取库名
                    lib = await self.db_session.get(DocumentLibrary, lib_doc.library_id)
                    lib_name = lib.name if lib else "未知文档库"
                    candidates.append((
                        lib_doc.id, lib_doc.library_id, lib_doc.filename,
                        lib_doc.text_content, lib_name, dist
                    ))
            candidates.sort(key=lambda x: x[5])
            candidates = candidates[:top_k]

        # 阶段2: 对命中文档做分块级精确比较
        for candidate in candidates:
            lib_doc_id, library_id, filename, lib_text, library_name, distance = candidate

            similarity = 1.0 - distance
            if similarity < 0.1:
                continue

            # 精确分块比较
            if document.text_content and lib_text:
                detailed = await self.compare_documents(document.text_content, lib_text)
                final_similarity = detailed["score"] if detailed["score"] > 0 else similarity
                matches = detailed["matches"]
            else:
                final_similarity = similarity
                matches = []

            results.append({
                "library_document_id": str(lib_doc_id),
                "library_id": str(library_id),
                "library_name": library_name,
                "filename": filename,
                "similarity": final_similarity,
                "matches": matches,
                "source_type": "library",
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results
