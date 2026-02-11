import uuid
from sqlalchemy import Column, String, Text, DateTime, func, UUID, Boolean, Integer, ForeignKey
from .base import Base


class DocumentLibrary(Base):
    __tablename__ = "document_libraries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    document_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
