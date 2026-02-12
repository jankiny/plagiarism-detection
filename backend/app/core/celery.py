from celery import Celery
from app.core.config import settings


app = Celery('plagiarism_detection')

app.conf.update(
    broker_url=settings.CELERY_BROKER_URL,
    result_backend=settings.CELERY_RESULT_BACKEND,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    # 显式声明任务模块列表
    include=['app.services.batch_processing'],
)
