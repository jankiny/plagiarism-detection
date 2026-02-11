from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@db:5432/plagiarism_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage settings
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # s3 or local
    S3_ENDPOINT_URL: Optional[str] = os.getenv("S3_ENDPOINT_URL")
    S3_ACCESS_KEY: Optional[str] = os.getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY: Optional[str] = os.getenv("S3_SECRET_KEY")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "plagiarism-uploads")

    # AI API 设置 (兼容 OpenAI 格式的 API)
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY")
    AI_API_BASE_URL: Optional[str] = os.getenv("AI_API_BASE_URL")  # 留空则使用 OpenAI 官方地址
    AI_CHAT_MODEL: str = os.getenv("AI_CHAT_MODEL", "gpt-3.5-turbo")
    AI_EMBEDDING_MODEL: str = os.getenv("AI_EMBEDDING_MODEL", "text-embedding-3-small")

    # Celery settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")


settings = Settings()
