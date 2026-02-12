import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system_settings import SystemSettings
from app.core.config import settings as env_settings

logger = logging.getLogger(__name__)


class SettingsService:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_settings(self) -> dict:
        """获取系统设置，优先读数据库，fallback 到 config.py 默认值"""
        db_settings = await self.db.get(SystemSettings, 1)
        if db_settings:
            return {
                "ai_api_key": self._mask_key(db_settings.ai_api_key),
                "ai_api_key_set": bool(db_settings.ai_api_key),
                "ai_api_base_url": db_settings.ai_api_base_url or "",
                "ai_chat_model": db_settings.ai_chat_model or "gpt-3.5-turbo",
                "ai_embedding_model": db_settings.ai_embedding_model or "text-embedding-3-small",
                "similarity_threshold": db_settings.similarity_threshold or 0.75,
                "max_upload_size_mb": db_settings.max_upload_size_mb or 50,
                "max_files_per_batch": db_settings.max_files_per_batch or 20,
                "system_name": db_settings.system_name or "文档查重检测平台",
                "updated_at": db_settings.updated_at,
            }
        # Fallback to env settings
        return {
            "ai_api_key": self._mask_key(env_settings.AI_API_KEY),
            "ai_api_key_set": bool(env_settings.AI_API_KEY),
            "ai_api_base_url": env_settings.AI_API_BASE_URL or "",
            "ai_chat_model": env_settings.AI_CHAT_MODEL,
            "ai_embedding_model": env_settings.AI_EMBEDDING_MODEL,
            "similarity_threshold": 0.75,
            "max_upload_size_mb": 50,
            "max_files_per_batch": 20,
            "system_name": "文档查重检测平台",
            "updated_at": None,
        }

    async def get_raw_settings(self) -> Optional[SystemSettings]:
        """获取原始数据库设置对象"""
        return await self.db.get(SystemSettings, 1)

    async def update_settings(self, updates: dict) -> dict:
        """更新系统设置"""
        db_settings = await self.db.get(SystemSettings, 1)
        if not db_settings:
            db_settings = SystemSettings(id=1)
            self.db.add(db_settings)

        for key, value in updates.items():
            if key == "ai_api_key":
                # Skip if empty or if it looks like a masked key (contains asterisks)
                if not value or "****" in str(value):
                    continue
            if hasattr(db_settings, key):
                setattr(db_settings, key, value)

        await self.db.commit()
        await self.db.refresh(db_settings)
        return await self.get_settings()

    @staticmethod
    def _mask_key(key: Optional[str]) -> str:
        if not key:
            return ""
        if len(key) <= 8:
            return "****"
        return key[:4] + "****" + key[-4:]
