import math
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Document
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
                })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results
