from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.auth import fastapi_users, current_user, pwd_context
from app.models.user import User
from app.core.db import get_db
from app.schemas import UserRead
from passlib.exc import UnknownHashError
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None


@router.get("/me", response_model=UserRead)
async def get_current_user_info(user: User = Depends(current_user)):
    """Get current authenticated user"""
    return user


@router.put("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """修改自己的密码（需验证旧密码）"""
    try:
        if not pwd_context.verify(data.old_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="旧密码不正确")
    except UnknownHashError:
        raise HTTPException(
            status_code=400,
            detail="当前账户密码格式异常，请使用忘记密码或联系管理员重置",
        )

    user.hashed_password = pwd_context.hash(data.new_password)
    await db.commit()
    await db.refresh(user)
    return {"message": "密码修改成功"}


@router.put("/me/profile")
async def update_profile(
    data: UpdateProfileRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """修改自己的显示名称"""
    if data.display_name is not None:
        user.display_name = data.display_name
    await db.commit()
    await db.refresh(user)
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "display_name": user.display_name,
    }


@router.get("/{user_id}", response_model=UserRead)
async def get_user_by_id(
    user_id: str,
    current_user_obj: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user by ID (admin or self only)"""
    if str(current_user_obj.id) != user_id and current_user_obj.role != "admin":
        raise HTTPException(status_code=403, detail="无权访问")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="未找到用户")

    return user


@router.get("/me/dashboard")
async def get_user_dashboard(
    current_user_obj: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics for current user"""
    from app.models import Batch, Document
    from sqlalchemy import select, func

    batch_count = await db.scalar(
        select(func.count(Batch.id)).where(Batch.user_id == current_user_obj.id)
    )

    doc_count = await db.scalar(
        select(func.count(Document.id))
        .join(Batch, Document.batch_id == Batch.id)
        .where(Batch.user_id == current_user_obj.id)
    )

    return {
        "data": {
            "num_batches": batch_count or 0,
            "num_documents": doc_count or 0
        }
    }
