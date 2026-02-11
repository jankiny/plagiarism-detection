from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import uuid
import json

from app.core.db import get_db
from app.models.user import User
from app.api.auth import fastapi_users
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
    db: Session = Depends(get_db),
    user: User = Depends(fastapi_users.current_user()),
):
    """统一内容分析接口（文件或文本），支持查重和 AI 检测。"""
    try:
        parsed_options = json.loads(options)
        opts = AnalysisOptions(**parsed_options)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无效的选项JSON: {e}")

    if not files and not text:
        raise HTTPException(status_code=400, detail="必须提供文件或文本")

    from app.models import Batch, Document

    batch_id = uuid.uuid4()
    batch = Batch(
        id=batch_id,
        user_id=user.id,
        total_docs=0,
        status="queued",
        analysis_type="mixed",
        ai_threshold=opts.ai_threshold,
    )
    db.add(batch)

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


@router.get("/ai-detection/health")
async def ai_health_check():
    """AI 检测服务健康检查"""
    health_status = ai_service.health_check()
    return {"service": "ai_detection", "health": health_status}


@router.post("/ai-detection")
async def detect_ai_only(
    text: str = Body(..., embed=True),
    threshold: float = Body(0.5, embed=True),
    user: User = Depends(fastapi_users.current_user()),
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
    db: Session = Depends(get_db),
    user: User = Depends(fastapi_users.current_user()),
):
    """获取批次的详细结果，包括 AI 分数和查重匹配。"""
    from app.models import Batch, Document, Comparison
    from sqlalchemy import select
    from sqlalchemy.orm import aliased

    batch = (
        db.query(Batch).filter(Batch.id == batch_id, Batch.user_id == user.id).first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="未找到该批次")

    documents = db.query(Document).filter(Document.batch_id == batch_id).all()

    results = []
    for doc in documents:
        DocB = aliased(Document)
        comparisons = db.execute(
            select(Comparison, DocB.filename.label("match_filename"))
            .join(DocB, Comparison.doc_b == DocB.id)
            .where(Comparison.doc_a == doc.id)
            .order_by(Comparison.similarity.desc())
        ).all()

        plagiarism_details = []
        for comp, match_filename in comparisons:
            plagiarism_details.append(
                {
                    "similar_document": match_filename,
                    "similarity": comp.similarity,
                    "matches": comp.matches or [],
                }
            )

        results.append(
            {
                "document_id": str(doc.id),
                "filename": doc.filename,
                "status": doc.status,
                "ai_analysis": {
                    "score": doc.ai_score,
                    "is_ai": doc.is_ai_generated,
                    "confidence": doc.ai_confidence,
                    "provider": doc.ai_provider,
                },
                "plagiarism_analysis": plagiarism_details,
            }
        )

    return {"status": "ok", "data": results}
