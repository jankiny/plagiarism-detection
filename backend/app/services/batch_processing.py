from celery import Celery
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.batch import Batch
from app.models.document import Document
from app.models.comparison import Comparison
from app.services.embedding import EmbeddingService
from app.services.ai_detection import AIDetectionService
import asyncio

celery = Celery(__name__)
celery.config_from_object("app.core.celery")

engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

embedding_service = EmbeddingService()
ai_service = AIDetectionService()

@celery.task
def process_batch(batch_id: str, ai_threshold: float = 0.5, **kwargs):
    """处理一批文档的查重和/或 AI 检测"""
    asyncio.run(_process_batch_async(batch_id, ai_threshold))

async def _process_batch_async(batch_id: str, ai_threshold: float):
    async with SessionLocal() as session:
        batch = await session.get(Batch, batch_id)
        if not batch:
            print(f"批次 {batch_id} 未找到")
            return

        batch.status = "processing"
        await session.commit()

        from sqlalchemy import select
        result = await session.execute(
            select(Document).where(Document.batch_id == batch_id)
        )
        documents = result.scalars().all()

        analysis_type = batch.analysis_type or "plagiarism"

        from app.services.plagiarism import PlagiarismService
        plagiarism_service = PlagiarismService(session)

        for doc in documents:
            try:
                doc.status = "processing"
                await session.commit()

                # AI 检测（仅在 API 已配置时可用）
                if analysis_type in ["ai", "both", "mixed"]:
                    if doc.text_content and ai_service.is_available:
                        ai_result = ai_service.detect(doc.text_content, threshold=ai_threshold)
                        doc.ai_score = ai_result.get("score", 0.0)
                        doc.is_ai_generated = ai_result.get("is_ai", False)
                        doc.ai_confidence = ai_result.get("confidence", 0.0)
                        doc.ai_provider = ai_result.get("provider", "unknown")

                        from app.models.ai_detection import AIDetection
                        ai_detection_record = AIDetection(
                            document_id=doc.id,
                            model_version=ai_result.get("details", {}).get("model", "unknown"),
                            probability=ai_result.get("score", 0.0),
                            meta_data={
                                "provider": ai_result.get("provider", "unknown"),
                                "confidence": ai_result.get("confidence", 0.0),
                                "label": ai_result.get("label", "unknown"),
                                "details": ai_result.get("details", {}),
                            },
                        )
                        session.add(ai_detection_record)

                # 查重检测（仅在 API 已配置时可用）
                if analysis_type in ["plagiarism", "both", "mixed"]:
                    if doc.text_content and embedding_service.is_available:
                        embedding = embedding_service.generate_text_embedding(doc.text_content)
                        doc.embedding = embedding

                        similar_results = await plagiarism_service.find_similar_in_batch(doc, batch_id)

                        for res in similar_results:
                            comparison = Comparison(
                                doc_a=doc.id,
                                doc_b=res["document_id"],
                                similarity=res["similarity"],
                                matches=res.get("matches", []),
                            )
                            session.add(comparison)

                doc.status = "completed"
                await session.commit()
            except Exception as e:
                print(f"处理文档 {doc.id} 时出错: {e}")
                doc.status = "failed"
                await session.commit()

        batch.status = "completed"
        batch.processed_docs = len([d for d in documents if d.status == "completed"])
        await session.commit()
