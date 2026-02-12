import uuid
from sqlalchemy import Column, String, Text, DateTime, func, UUID, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base


class WhitelistCollection(Base):
    """白名单清单（顶层实体，用户在检测时按清单为单位选择）"""
    __tablename__ = "whitelist_collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("WhitelistItem", back_populates="collection", cascade="all, delete-orphan", lazy="selectin")


class WhitelistItem(Base):
    """白名单条目（属于某个清单，包含具体加白文本内容）"""
    __tablename__ = "whitelist_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_id = Column(UUID(as_uuid=True), ForeignKey("whitelist_collections.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    label = Column(String, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    collection = relationship("WhitelistCollection", back_populates="items")
