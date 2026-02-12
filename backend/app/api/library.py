from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.db import get_db
from app.models.user import User
from app.models.document_library import DocumentLibrary
from app.models.library_document import LibraryDocument
from app.api.auth import current_user, mod_or_admin_user
from app.services.library_service import LibraryService

router = APIRouter(tags=["libraries"])


@router.get("/libraries")
async def list_libraries(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """获取可用文档库列表"""
    service = LibraryService(db)
    libraries = await service.list_libraries()
    return {
        "data": [
            {
                "id": str(lib.id),
                "name": lib.name,
                "description": lib.description,
                "owner_id": str(lib.owner_id),
                "is_active": lib.is_active,
                "status": "active" if lib.is_active else "inactive",
                "document_count": lib.document_count or 0,
                "created_at": lib.created_at,
            }
            for lib in libraries
        ]
    }


@router.post("/libraries")
async def create_library(
    name: str = Form(...),
    description: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """创建文档库（版主/管理员）"""
    service = LibraryService(db)
    library = await service.create_library(name, description, user.id)
    return {
        "id": str(library.id),
        "name": library.name,
        "description": library.description,
        "owner_id": str(library.owner_id),
        "document_count": 0,
        "created_at": library.created_at,
    }


@router.get("/libraries/{library_id}")
async def get_library_detail(
    library_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """文档库详情及文档列表"""
    service = LibraryService(db)
    library = await service.get_library(library_id)
    if not library:
        raise HTTPException(status_code=404, detail="文档库不存在")

    documents = await service.get_library_documents(library_id)
    return {
        "id": str(library.id),
        "name": library.name,
        "description": library.description,
        "owner_id": str(library.owner_id),
        "is_active": library.is_active,
        "document_count": library.document_count or 0,
        "created_at": library.created_at,
        "documents": [
            {
                "id": str(doc.id),
                "filename": doc.filename,
                "status": doc.status,
                "uploaded_by": str(doc.uploaded_by) if doc.uploaded_by else None,
                "created_at": doc.created_at,
            }
            for doc in documents
        ],
    }


@router.post("/libraries/{library_id}/documents")
async def upload_library_document(
    library_id: UUID,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """向文档库上传文档（版主/管理员）"""
    service = LibraryService(db)
    library = await service.get_library(library_id)
    if not library:
        raise HTTPException(status_code=404, detail="文档库不存在")
    if not library.is_active:
        raise HTTPException(status_code=400, detail="文档库已停用")

    uploaded = []
    for file in files:
        content = await file.read()
        doc = await service.add_document_to_library(
            library_id, file.filename, content, user.id
        )
        uploaded.append({
            "id": str(doc.id),
            "filename": doc.filename,
            "status": doc.status,
        })

    return {"message": f"成功上传 {len(uploaded)} 个文档", "documents": uploaded}


@router.delete("/libraries/{library_id}")
async def deactivate_library(
    library_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """停用文档库（版主/管理员）"""
    service = LibraryService(db)
    success = await service.deactivate_library(library_id)
    if not success:
        raise HTTPException(status_code=404, detail="文档库不存在")
    return {"message": "文档库已停用"}


@router.delete("/libraries/{library_id}/documents/{doc_id}")
async def delete_library_document(
    library_id: UUID,
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(mod_or_admin_user),
):
    """删除文档库中的文档（版主/管理员）"""
    service = LibraryService(db)
    success = await service.delete_library_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="文档不存在")
    return {"message": "文档已删除"}
