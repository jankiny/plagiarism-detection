import uuid
from sqlalchemy import Column, String, Text, DateTime, func, UUID, ForeignKey
from .base import Base


class Whitelist(Base):
    __tablename__ = "whitelists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    label = Column(String, nullable=False, default="")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
