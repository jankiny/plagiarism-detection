import math
import re
from collections import Counter
from typing import List, Dict, Any, Tuple
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

    # ==================== 纯文本相似度算法（不依赖 API）====================

    @staticmethod
    def tokenize(text: str) -> List[str]:
        """将文本分词：中文按字符切分，英文按单词切分"""
        if not text:
            return []
        tokens = []
        # 分割中英文混合文本
        for segment in re.findall(r'[\u4e00-\u9fff]|[a-zA-Z0-9]+', text.lower()):
            tokens.append(segment)
        return tokens

    @staticmethod
    def ngrams(tokens: List[str], n: int = 3) -> List[str]:
        """生成 n-gram"""
        if len(tokens) < n:
            return [''.join(tokens)] if tokens else []
        return [''.join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]

    @classmethod
    def text_similarity(cls, text_a: str, text_b: str) -> float:
        """基于 n-gram 的文本相似度计算（Jaccard + 余弦混合）"""
        if not text_a or not text_b:
            return 0.0

        tokens_a = cls.tokenize(text_a)
        tokens_b = cls.tokenize(text_b)

        if not tokens_a or not tokens_b:
            return 0.0

        # 使用 2-gram 和 3-gram 混合
        grams_a_2 = cls.ngrams(tokens_a, 2)
        grams_b_2 = cls.ngrams(tokens_b, 2)
        grams_a_3 = cls.ngrams(tokens_a, 3)
        grams_b_3 = cls.ngrams(tokens_b, 3)

        # Jaccard 相似度 (2-gram)
        set_a = set(grams_a_2)
        set_b = set(grams_b_2)
        intersection = set_a & set_b
        union = set_a | set_b
        jaccard = len(intersection) / len(union) if union else 0.0

        # 余弦相似度 (3-gram)
        counter_a = Counter(grams_a_3)
        counter_b = Counter(grams_b_3)
        all_grams = set(counter_a.keys()) | set(counter_b.keys())
        dot = sum(counter_a.get(g, 0) * counter_b.get(g, 0) for g in all_grams)
        norm_a = math.sqrt(sum(v * v for v in counter_a.values()))
        norm_b = math.sqrt(sum(v * v for v in counter_b.values()))
        cosine = dot / (norm_a * norm_b) if (norm_a > 0 and norm_b > 0) else 0.0

        # 混合得分（余弦权重更高）
        return round(0.4 * jaccard + 0.6 * cosine, 4)

    @classmethod
    def text_chunk_compare(cls, text_a: str, text_b: str, chunk_size: int = 500, overlap: int = 50) -> Dict[str, Any]:
        """纯文本分块对比，返回总体相似度和匹配段落"""
        if not text_a or not text_b:
            return {"score": 0.0, "matches": []}

        # 分块
        def chunk_text(t):
            chunks = []
            for i in range(0, len(t), chunk_size - overlap):
                chunk = t[i:i + chunk_size]
                if chunk.strip():
                    chunks.append(chunk)
                if i + chunk_size >= len(t):
                    break
            return chunks if chunks else [t]

        chunks_a = chunk_text(text_a)
        chunks_b = chunk_text(text_b)

        matches = []
        total_similarity = 0.0

        for i, chunk_a in enumerate(chunks_a):
            best_score = 0.0
            best_idx = -1

            for j, chunk_b in enumerate(chunks_b):
                score = cls.text_similarity(chunk_a, chunk_b)
                if score > best_score:
                    best_score = score
                    best_idx = j

            if best_score > 0.3:  # 文本相似度阈值低于向量阈值
                matches.append({
                    "source_chunk": chunk_a[:200],  # 截断避免过长
                    "target_chunk": chunks_b[best_idx][:200],
                    "score": round(best_score, 4),
                    "source_index": i,
                    "target_index": best_idx,
                })
                total_similarity += best_score

        overall_score = total_similarity / len(chunks_a) if chunks_a else 0.0

        return {
            "score": round(overall_score, 4),
            "matches": matches,
        }

    # ==================== 向量相似度算法 ====================

    @staticmethod
    def calculate_similarity(embedding_a, embedding_b) -> float:
        """计算两个向量的余弦相似度"""
        if not embedding_a or not embedding_b:
            return 0.0

        dot = sum(a * b for a, b in zip(embedding_a, embedding_b))
        norm_a = math.sqrt(sum(a * a for a in embedding_a))
        norm_b = math.sqrt(sum(b * b for b in embedding_b))

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot / (norm_a * norm_b)

    # ==================== 文档对比（自动选择策略）====================

    async def compare_documents(self, doc_a_text: str, doc_b_text: str) -> Dict[str, Any]:
        """
        比较两个文档的相似度。
        优先使用向量对比（API 可用时），否则回退到纯文本对比。
        """
        if not doc_a_text or not doc_b_text:
            return {"score": 0.0, "matches": []}

        # 策略1：如果 Embedding API 可用，使用向量对比
        if self.embedding_service.is_available:
            chunks_a, embeddings_a = self.embedding_service.encode_chunks(doc_a_text)
            chunks_b, embeddings_b = self.embedding_service.encode_chunks(doc_b_text)

            if embeddings_a and embeddings_b:
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
                            "source_chunk": chunks_a[i][:200],
                            "target_chunk": chunks_b[best_match_idx][:200],
                            "score": round(best_match_score, 4),
                            "source_index": i,
                            "target_index": best_match_idx,
                        })
                        total_similarity += best_match_score

                overall_score = total_similarity / len(chunks_a) if chunks_a else 0.0
                return {"score": round(overall_score, 4), "matches": matches}

        # 策略2：回退到纯文本对比
        return self.text_chunk_compare(doc_a_text, doc_b_text)

    # ==================== 批次内查重 ====================

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
            if not other_doc.text_content:
                continue
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

    # ==================== 文档库查重 ====================

    async def find_similar_in_libraries(
        self, document: Document, library_ids: List[str], top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """在指定文档库中查找相似文档。支持向量检索和纯文本对比两种模式。"""
        if not self.db_session:
            raise ValueError("需要数据库会话才能进行文档库搜索")

        if not library_ids:
            return []

        results = []
        use_vector = (
            document.embedding
            and self.embedding_service.is_available
        )

        if use_vector:
            # 向量模式：使用 pgvector 做粗筛
            candidates = await self._vector_search(document, library_ids, top_k)
        else:
            # 纯文本模式：直接查询所有文档库文档
            candidates = await self._text_search(document, library_ids)

        # 对候选文档做精确对比
        for candidate in candidates:
            lib_doc_id, library_id, filename, lib_text, library_name, coarse_score = candidate

            if coarse_score < 0.05:
                continue

            # 精确分块比较
            if document.text_content and lib_text:
                detailed = await self.compare_documents(document.text_content, lib_text)
                final_similarity = detailed["score"] if detailed["score"] > 0 else coarse_score
                matches = detailed["matches"]
            else:
                final_similarity = coarse_score
                matches = []

            if final_similarity > 0.05:
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
        return results[:top_k]

    async def _vector_search(
        self, document: Document, library_ids: List[str], top_k: int
    ) -> List[Tuple]:
        """使用 pgvector 进行向量相似度搜索"""
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
            rows = result.fetchall()
            # 转换 distance 为 similarity
            return [(r[0], r[1], r[2], r[3], r[4], 1.0 - r[5]) for r in rows]
        except Exception as e:
            print(f"向量检索失败，回退到文本检索: {e}")
            return await self._text_search(document, library_ids)

    async def _text_search(
        self, document: Document, library_ids: List[str]
    ) -> List[Tuple]:
        """纯文本相似度搜索（不依赖向量/API）"""
        import uuid as uuid_mod
        lib_id_list = [uuid_mod.UUID(lid) if isinstance(lid, str) else lid for lid in library_ids]

        query = select(LibraryDocument).where(
            LibraryDocument.library_id.in_(lib_id_list),
            LibraryDocument.status == "ready",
        )
        result = await self.db_session.execute(query)
        all_lib_docs = result.scalars().all()

        candidates = []
        for lib_doc in all_lib_docs:
            if not lib_doc.text_content or not document.text_content:
                continue

            # 快速粗筛：用整体文本相似度排序
            coarse_score = self.text_similarity(
                document.text_content[:2000],  # 取前2000字做快速对比
                lib_doc.text_content[:2000]
            )

            # 获取库名
            lib = await self.db_session.get(DocumentLibrary, lib_doc.library_id)
            lib_name = lib.name if lib else "未知文档库"

            candidates.append((
                lib_doc.id, lib_doc.library_id, lib_doc.filename,
                lib_doc.text_content, lib_name, coarse_score
            ))

        candidates.sort(key=lambda x: x[5], reverse=True)
        return candidates[:10]
