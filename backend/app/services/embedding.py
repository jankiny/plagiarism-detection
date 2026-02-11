import hashlib
import logging
from typing import List, Tuple

from app.core.provider_router import ProviderRouter

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        self.router = ProviderRouter()

    @property
    def is_available(self) -> bool:
        return self.router.is_available

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """将文本切分为带重叠的块"""
        if not text:
            return []
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunks.append(text[i : i + chunk_size])
            if i + chunk_size >= len(text):
                break
        return chunks

    def encode_chunks(self, text: str) -> Tuple[List[str], List[List[float]]]:
        """通过 API 为文本的每个分块生成向量"""
        if not self.is_available:
            return [], []

        chunks = self.chunk_text(text)
        if not chunks:
            return [], []

        try:
            client = self.router.get_openai_client()
            model = self.router.embedding_model

            # OpenAI embedding API 支持批量输入
            response = client.embeddings.create(model=model, input=chunks)
            embeddings = [item.embedding for item in response.data]
            return chunks, embeddings
        except Exception as e:
            logger.error(f"Embedding API 调用失败: {e}")
            return [], []

    def generate_text_embedding(self, text: str) -> List[float]:
        """生成整篇文本的平均向量"""
        if not self.is_available:
            return []

        chunks, embeddings = self.encode_chunks(text)
        if not embeddings:
            return []

        # 计算所有分块向量的平均值
        dim = len(embeddings[0])
        avg = [0.0] * dim
        for emb in embeddings:
            for i in range(dim):
                avg[i] += emb[i]
        avg = [v / len(embeddings) for v in avg]
        return avg

    @staticmethod
    def hash_content(content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()
