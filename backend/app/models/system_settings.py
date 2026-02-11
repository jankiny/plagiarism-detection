from sqlalchemy import Column, String, Integer, Float, DateTime, func
from .base import Base


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    ai_api_key = Column(String, nullable=True)
    ai_api_base_url = Column(String, nullable=True)
    ai_chat_model = Column(String, default="gpt-3.5-turbo")
    ai_embedding_model = Column(String, default="text-embedding-3-small")
    similarity_threshold = Column(Float, default=0.75)
    max_upload_size_mb = Column(Integer, default=50)
    max_files_per_batch = Column(Integer, default=20)
    system_name = Column(String, default="文档查重检测平台")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
