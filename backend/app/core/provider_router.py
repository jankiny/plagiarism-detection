import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class ProviderRouter:
    """
    检查 AI API 是否已配置。
    统一使用 OpenAI 兼容格式的 API（可对接任意兼容服务）。
    """

    def __init__(self):
        self.api_key = settings.AI_API_KEY
        self.base_url = settings.AI_API_BASE_URL
        self.chat_model = settings.AI_CHAT_MODEL
        self.embedding_model = settings.AI_EMBEDDING_MODEL

    @property
    def is_available(self) -> bool:
        return bool(self.api_key)

    def get_openai_client(self):
        """返回一个 OpenAI 兼容的客户端实例"""
        if not self.is_available:
            raise ValueError("AI API 未配置，请设置 AI_API_KEY 环境变量。")

        from openai import OpenAI
        kwargs = {"api_key": self.api_key}
        if self.base_url:
            kwargs["base_url"] = self.base_url
        return OpenAI(**kwargs)

    def log_usage(self, operation: str, details: dict = None):
        logger.info(f"AI API 调用: {operation} | 模型: {self.chat_model} | 详情: {details or {}}")
