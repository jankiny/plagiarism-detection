import uuid
from sqlalchemy import Column, UUID, ForeignKey, DateTime, func
from .base import Base


class BatchLibrary(Base):
    __tablename__ = "batch_libraries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=False)
    library_id = Column(UUID(as_uuid=True), ForeignKey("document_libraries.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
