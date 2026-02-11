import uuid
from sqlalchemy import Column, String, Text, DateTime, func, UUID, ForeignKey
from pgvector.sqlalchemy import Vector
from .base import Base


class LibraryDocument(Base):
    __tablename__ = "library_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    library_id = Column(UUID(as_uuid=True), ForeignKey("document_libraries.id"), nullable=False)
    filename = Column(String, nullable=False)
    content_hash = Column(String, nullable=True)
    text_content = Column(Text, nullable=True)
    embedding = Column(Vector(384), nullable=True)
    storage_path = Column(String, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(String, default="processing")  # processing / ready / failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
