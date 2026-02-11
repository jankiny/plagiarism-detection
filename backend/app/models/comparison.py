import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSON
from .base import Base

class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_a = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    doc_b = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)  # 跨库比较时为空
    similarity = Column(Float, nullable=False)
    matches = Column(JSON, nullable=True)
    source_type = Column(String, default="internal")  # internal / library
    library_id = Column(UUID(as_uuid=True), ForeignKey("document_libraries.id"), nullable=True)
    library_doc_id = Column(UUID(as_uuid=True), ForeignKey("library_documents.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
