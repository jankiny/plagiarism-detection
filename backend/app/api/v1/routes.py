from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import json

from app.core.db import get_db
from app.models.user import User
from app.api.auth import fastapi_users, current_user
from app.services.ai_detection import AIDetectionService
from app.services.plagiarism import PlagiarismService

router = APIRouter()
ai_service = AIDetectionService()


class AnalysisOptions(BaseModel):
    ai_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    check_plagiarism: bool = True
    check_ai: bool = True


class AnalysisResponse(BaseModel):
    batch_id: str
    status: str
    message: str


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_content(
    files: List[UploadFile] = File(default=[]),
    text: Optional[str] = Form(default=None),
    options: str = Form(default='{"check_plagiarism": true, "check_ai": true}'),
    library_ids: str = Form(default='[]'),
    compare_mode: str = Form(default='library'),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """统一内容分析接口（文件或文本），支持查重和 AI 检测。"""
    try:
        parsed_options = json.loads(options)
        opts = AnalysisOptions(**parsed_options)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无效的选项JSON: {e}")

    try:
        parsed_library_ids = json.loads(library_ids)
    except Exception:
        parsed_library_ids = []

    if compare_mode not in ["library", "internal", "both"]:
        compare_mode = "library"

    if not files and not text:
        raise HTTPException(status_code=400, detail="必须提供文件或文本")

    from app.models import Batch, Document
    from app.models.batch_library import BatchLibrary

    batch_id = uuid.uuid4()

    # 确定 analysis_type
    if opts.check_plagiarism and opts.check_ai:
        analysis_type = "mixed"
    elif opts.check_ai:
        analysis_type = "ai"
    else:
        analysis_type = "plagiarism"

    batch = Batch(
        id=batch_id,
        user_id=user.id,
        total_docs=0,
        status="queued",
        analysis_type=analysis_type,
        ai_threshold=opts.ai_threshold,
        compare_mode=compare_mode,
    )
    db.add(batch)

    # 创建 BatchLibrary 关联记录
    for lib_id in parsed_library_ids:
        try:
            batch_lib = BatchLibrary(
                batch_id=batch_id,
                library_id=uuid.UUID(lib_id) if isinstance(lib_id, str) else lib_id,
            )
            db.add(batch_lib)
        except Exception:
            pass

    docs_to_process = []
    if text:
        doc_id = uuid.uuid4()
        doc = Document(
            id=doc_id,
            batch_id=batch_id,
            filename="input_text.txt",
            storage_path=f"{batch_id}/input_text.txt",
            text_content=text,
            status="queued",
        )
        db.add(doc)
        docs_to_process.append(doc)

    from app.services.parsing import extract_text_from_file
    from app.services.storage import StorageService

    storage_service = StorageService()

    for file in files:
        content = await file.read()
        storage_path = f"{batch_id}/{file.filename}"
        storage_service.save(storage_path, content)

        text_content = await extract_text_from_file(content, file.filename)

        doc = Document(
            batch_id=batch_id,
            filename=file.filename,
            storage_path=storage_path,
            text_content=text_content,
            status="queued",
        )
        db.add(doc)
        docs_to_process.append(doc)

    batch.total_docs = len(docs_to_process)
    await db.commit()

    from app.services.batch_processing import process_batch

    process_batch.delay(str(batch_id), ai_threshold=opts.ai_threshold)

    return AnalysisResponse(
        batch_id=str(batch_id), status="queued", message="分析已成功启动"
    )


@router.get("/batches")
async def list_user_batches(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """获取用户的所有批次列表"""
    from app.models import Batch
    from sqlalchemy import select, desc

    result = await db.execute(
        select(Batch)
        .where(Batch.user_id == user.id)
        .order_by(desc(Batch.created_at))
        .offset(skip)
        .limit(limit)
    )
    batches = result.scalars().all()

    return {
        "data": [
            {
                "id": str(b.id),
                "created_at": b.created_at,
                "total_docs": b.total_docs,
                "status": b.status,
                "analysis_type": b.analysis_type,
                "compare_mode": b.compare_mode,
            }
            for b in batches
        ]
    }


@router.get("/ai-detection/health")
async def ai_health_check():
    """AI 检测服务健康检查"""
    health_status = ai_service.health_check()
    return {"service": "ai_detection", "health": health_status}


@router.post("/ai-detection")
async def detect_ai_only(
    text: str = Body(..., embed=True),
    threshold: float = Body(0.5, embed=True),
    user: User = Depends(current_user),
):
    """直接对文本进行 AI 检测"""
    if not ai_service.is_available:
        raise HTTPException(status_code=503, detail="AI 检测未启用：未配置 AI API")

    try:
        ai_result = ai_service.detect(text, threshold=threshold)
        return {"data": ai_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI检测失败: {str(e)}")


@router.get("/batches/{batch_id}/results")
async def get_batch_results(
    batch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_user),
):
    """获取批次的详细结果，包括 AI 分数和查重匹配。"""
    from app.models import Batch, Document, Comparison
    from app.models.library_document import LibraryDocument
    from app.models.document_library import DocumentLibrary
    from sqlalchemy import select
    from sqlalchemy.orm import aliased

    # 使用 async 查询
    result = await db.execute(
        select(Batch).where(Batch.id == batch_id, Batch.user_id == user.id)
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="未找到该批次")

    doc_result = await db.execute(
        select(Document).where(Document.batch_id == batch_id)
    )
    documents = doc_result.scalars().all()

    results = []
    for doc in documents:
        # 查询批次内对比结果
        DocB = aliased(Document)
        internal_comps = await db.execute(
            select(Comparison, DocB.filename.label("match_filename"))
            .outerjoin(DocB, Comparison.doc_b == DocB.id)
            .where(
                Comparison.doc_a == doc.id,
                Comparison.source_type == "internal",
            )
            .order_by(Comparison.similarity.desc())
        )

        plagiarism_details = []
        for comp, match_filename in internal_comps:
            plagiarism_details.append({
                "similar_document": match_filename or "未知文档",
                "similarity": comp.similarity,
                "matches": comp.matches or [],
                "source_type": "internal",
                "library_name": None,
            })

        # 查询文档库对比结果
        library_comps = await db.execute(
            select(Comparison)
            .where(
                Comparison.doc_a == doc.id,
                Comparison.source_type == "library",
            )
            .order_by(Comparison.similarity.desc())
        )

        for comp in library_comps.scalars().all():
            # 获取库文档信息
            lib_doc_name = "未知文档"
            library_name = "未知文档库"

            if comp.library_doc_id:
                lib_doc = await db.get(LibraryDocument, comp.library_doc_id)
                if lib_doc:
                    lib_doc_name = lib_doc.filename

            if comp.library_id:
                lib = await db.get(DocumentLibrary, comp.library_id)
                if lib:
                    library_name = lib.name

            plagiarism_details.append({
                "similar_document": lib_doc_name,
                "similarity": comp.similarity,
                "matches": comp.matches or [],
                "source_type": "library",
                "library_name": library_name,
            })

        # 按相似度排序
        plagiarism_details.sort(key=lambda x: x["similarity"], reverse=True)

        results.append({
            "document_id": str(doc.id),
            "filename": doc.filename,
            "status": doc.status,
            "ai_analysis": {
                "score": doc.ai_score or 0.0,
                "is_ai": doc.is_ai_generated or False,
                "confidence": doc.ai_confidence or 0.0,
                "provider": doc.ai_provider,
            },
            "plagiarism_analysis": plagiarism_details,
        })

    return {"status": "ok", "data": results}
