from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List
import uuid

from app.core.db import get_db
from app.models.user import User
from app.models.whitelist import WhitelistCollection, WhitelistItem
from app.api.auth import current_user, mod_or_admin_user


router = APIRouter(prefix="/whitelist")


# ───── Schemas ─────

class CollectionCreate(BaseModel):
    name: str
    description: str = ""


class ItemCreate(BaseModel):
    content: str
    label: str = ""


class ItemBatchAdd(BaseModel):
    items: List[ItemCreate]


# ───── Collection CRUD ─────

@router.get("/")
async def list_collections(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """获取所有白名单清单（含条目数量）"""
    result = await db.execute(
        select(WhitelistCollection)
        .options(selectinload(WhitelistCollection.items))
        .order_by(WhitelistCollection.created_at.desc())
    )
    collections = result.scalars().unique().all()

    return {
        "data": [
            {
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "item_count": len(c.items),
                "created_by": str(c.created_by),
                "created_at": c.created_at,
            }
            for c in collections
        ]
    }


@router.post("/")
async def create_collection(
    body: CollectionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """创建白名单清单（版主及以上权限）"""
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="清单名称不能为空")

    collection = WhitelistCollection(
        id=uuid.uuid4(),
        name=body.name.strip(),
        description=body.description.strip(),
        created_by=user.id,
    )
    db.add(collection)
    await db.commit()
    await db.refresh(collection)

    return {
        "id": str(collection.id),
        "name": collection.name,
        "description": collection.description,
        "item_count": 0,
        "created_by": str(collection.created_by),
        "created_at": collection.created_at,
    }


@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """删除白名单清单（级联删除所有条目）"""
    collection = await db.get(WhitelistCollection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="白名单清单不存在")

    await db.delete(collection)
    await db.commit()
    return {"message": "删除成功"}


# ───── Item CRUD within a Collection ─────

@router.get("/{collection_id}/items")
async def list_items(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """获取某个清单下的所有白名单条目"""
    collection = await db.get(WhitelistCollection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="白名单清单不存在")

    result = await db.execute(
        select(WhitelistItem)
        .where(WhitelistItem.collection_id == collection_id)
        .order_by(WhitelistItem.created_at.desc())
    )
    items = result.scalars().all()

    return {
        "data": [
            {
                "id": str(item.id),
                "collection_id": str(item.collection_id),
                "content": item.content,
                "label": item.label,
                "created_at": item.created_at,
            }
            for item in items
        ]
    }


@router.post("/{collection_id}/items")
async def add_item(
    collection_id: uuid.UUID,
    body: ItemCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """向清单中添加一个白名单条目"""
    collection = await db.get(WhitelistCollection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="白名单清单不存在")

    if not body.content.strip():
        raise HTTPException(status_code=400, detail="白名单内容不能为空")

    item = WhitelistItem(
        id=uuid.uuid4(),
        collection_id=collection_id,
        content=body.content.strip(),
        label=body.label.strip(),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return {
        "id": str(item.id),
        "collection_id": str(item.collection_id),
        "content": item.content,
        "label": item.label,
        "created_at": item.created_at,
    }


@router.post("/{collection_id}/items/batch")
async def add_items_batch(
    collection_id: uuid.UUID,
    body: ItemBatchAdd,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """批量向清单添加多个条目"""
    collection = await db.get(WhitelistCollection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="白名单清单不存在")

    created = []
    for entry in body.items:
        if not entry.content.strip():
            continue
        item = WhitelistItem(
            id=uuid.uuid4(),
            collection_id=collection_id,
            content=entry.content.strip(),
            label=entry.label.strip(),
        )
        db.add(item)
        created.append(item)

    await db.commit()
    return {"message": f"成功添加 {len(created)} 个条目"}


@router.delete("/{collection_id}/items/{item_id}")
async def delete_item(
    collection_id: uuid.UUID,
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """删除清单中的某个条目"""
    item = await db.get(WhitelistItem, item_id)
    if not item or item.collection_id != collection_id:
        raise HTTPException(status_code=404, detail="白名单条目不存在")

    await db.delete(item)
    await db.commit()
    return {"message": "删除成功"}
