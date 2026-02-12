from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.db import get_db
from app.models.user import User
from app.models.whitelist import Whitelist
from app.api.auth import current_user, mod_or_admin_user


router = APIRouter(prefix="/whitelist")


class WhitelistCreate(BaseModel):
    content: str
    label: str = ""


@router.get("/")
async def list_whitelists(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """获取白名单列表（所有登录用户可用）"""
    result = await db.execute(
        select(Whitelist).order_by(Whitelist.created_at.desc())
    )
    items = result.scalars().all()

    return {
        "data": [
            {
                "id": str(item.id),
                "content": item.content,
                "label": item.label,
                "created_by": str(item.created_by),
                "created_at": item.created_at,
            }
            for item in items
        ]
    }


@router.post("/")
async def create_whitelist(
    body: WhitelistCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """创建白名单条目（版主及以上权限）"""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="白名单内容不能为空")

    item = Whitelist(
        id=uuid.uuid4(),
        content=body.content.strip(),
        label=body.label.strip(),
        created_by=user.id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return {
        "id": str(item.id),
        "content": item.content,
        "label": item.label,
        "created_by": str(item.created_by),
        "created_at": item.created_at,
    }


@router.delete("/{item_id}")
async def delete_whitelist(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """删除白名单条目（版主及以上权限）"""
    item = await db.get(Whitelist, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="白名单条目不存在")

    await db.delete(item)
    await db.commit()
    return {"message": "删除成功"}
