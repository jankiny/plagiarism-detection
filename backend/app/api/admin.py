from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, func
from app.api.auth import admin_user, fastapi_users, current_user
from app.models.user import User
from app.models.document_library import DocumentLibrary
from app.models.library_document import LibraryDocument
from app.core.db import get_db
from app.schemas import UserRead, UserCreate, UserUpdate
from app.services.settings_service import SettingsService
from uuid import UUID
from typing import List, Optional
from passlib.context import CryptContext
from pydantic import BaseModel

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/admin", tags=["admin"])


class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "user"
    display_name: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    new_password: str


@router.get("/users", response_model=List[dict])
async def list_users(
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)"""
    result = await db.execute(select(User))
    users = result.scalars().all()

    return [{
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "display_name": user.display_name,
        "is_active": user.is_active,
        "created_at": user.created_at
    } for user in users]


@router.post("/users", response_model=dict)
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (admin only)"""
    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )

    role = user_data.role if user_data.role in ["user", "moderator"] else "user"

    # Create user directly
    new_user = User(
        email=user_data.email,
        hashed_password=pwd_context.hash(user_data.password),
        role=role,
        display_name=user_data.display_name,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "id": str(new_user.id),
        "email": new_user.email,
        "role": new_user.role,
        "display_name": new_user.display_name,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at
    }


@router.put("/users/{user_id}", response_model=dict)
async def update_user_role(
    user_id: UUID,
    role: str = Body(..., embed=True),
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user role (admin only)"""
    if role not in ["user", "moderator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效角色。有效角色: user, moderator, admin"
        )

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到用户"
        )

    if user.id == current_user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="管理员不能更改自己的角色"
        )

    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(role=role)
    )
    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "display_name": user.display_name,
        "is_active": user.is_active,
        "created_at": user.created_at
    }


@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user (admin only) - Soft delete by deactivation"""
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到用户"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="管理员不能删除自己"
        )

    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(is_active=False)
    )
    await db.commit()

    return {"message": f"用户 {user.email} 已停用"}


@router.put("/users/{user_id}/reset-password", response_model=dict)
async def reset_user_password(
    user_id: UUID,
    data: ResetPasswordRequest,
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """重置用户密码（管理员直接设置，无需旧密码）"""
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="未找到用户")

    user.hashed_password = pwd_context.hash(data.new_password)
    await db.commit()

    return {"message": f"用户 {user.email} 的密码已重置"}


@router.get("/stats", response_model=dict)
async def get_system_stats(
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get system statistics (admin only)"""
    result = await db.execute(select(User))
    all_users = result.scalars().all()

    total_users = len(all_users)
    active_users = len([u for u in all_users if u.is_active])
    admin_users = len([u for u in all_users if u.role == "admin"])
    moderator_users = len([u for u in all_users if u.role == "moderator"])
    regular_users = len([u for u in all_users if u.role == "user"])

    # 文档库统计
    lib_result = await db.execute(select(func.count(DocumentLibrary.id)).where(DocumentLibrary.is_active == True))
    library_count = lib_result.scalar() or 0

    lib_doc_result = await db.execute(select(func.count(LibraryDocument.id)))
    library_doc_count = lib_doc_result.scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "admins": admin_users,
        "moderators": moderator_users,
        "regular_users": regular_users,
        "libraries": library_count,
        "library_documents": library_doc_count,
        "system_access": True
    }


# 系统设置 API
@router.get("/settings")
async def get_settings(
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """获取当前系统设置"""
    service = SettingsService(db)
    return await service.get_settings()


@router.put("/settings")
async def update_settings(
    updates: dict = Body(...),
    current_user: User = Depends(admin_user),
    db: AsyncSession = Depends(get_db)
):
    """更新系统设置"""
    service = SettingsService(db)
    return await service.update_settings(updates)
