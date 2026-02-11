import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document_library import DocumentLibrary
from app.models.library_document import LibraryDocument
from app.services.embedding import EmbeddingService
from app.services.storage import StorageService
from app.services.parsing import extract_text_from_file
import hashlib
import uuid

logger = logging.getLogger(__name__)


class LibraryService:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.embedding_service = EmbeddingService()
        self.storage_service = StorageService()

    async def create_library(self, name: str, description: str, owner_id: uuid.UUID) -> DocumentLibrary:
        library = DocumentLibrary(
            name=name,
            description=description,
            owner_id=owner_id,
        )
        self.db.add(library)
        await self.db.commit()
        await self.db.refresh(library)
        return library

    async def list_libraries(self, owner_id: Optional[uuid.UUID] = None, active_only: bool = True) -> List[DocumentLibrary]:
        query = select(DocumentLibrary)
        if active_only:
            query = query.where(DocumentLibrary.is_active == True)
        if owner_id:
            query = query.where(DocumentLibrary.owner_id == owner_id)
        query = query.order_by(DocumentLibrary.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_library(self, library_id: uuid.UUID) -> Optional[DocumentLibrary]:
        return await self.db.get(DocumentLibrary, library_id)

    async def get_library_documents(self, library_id: uuid.UUID) -> List[LibraryDocument]:
        result = await self.db.execute(
            select(LibraryDocument)
            .where(LibraryDocument.library_id == library_id)
            .order_by(LibraryDocument.created_at.desc())
        )
        return result.scalars().all()

    async def add_document_to_library(
        self, library_id: uuid.UUID, filename: str, content: bytes, uploaded_by: uuid.UUID
    ) -> LibraryDocument:
        # 存储文件
        storage_path = f"libraries/{library_id}/{filename}"
        self.storage_service.save(storage_path, content)

        # 提取文本
        text_content = await extract_text_from_file(content, filename)

        # 计算内容哈希
        content_hash = hashlib.sha256(content).hexdigest()

        # 创建文档记录
        lib_doc = LibraryDocument(
            library_id=library_id,
            filename=filename,
            content_hash=content_hash,
            text_content=text_content,
            storage_path=storage_path,
            uploaded_by=uploaded_by,
            status="processing",
        )
        self.db.add(lib_doc)
        await self.db.commit()
        await self.db.refresh(lib_doc)

        # 生成向量
        try:
            if text_content and self.embedding_service.is_available:
                embedding = self.embedding_service.generate_text_embedding(text_content)
                if embedding:
                    lib_doc.embedding = embedding
                    lib_doc.status = "ready"
                else:
                    lib_doc.status = "ready"  # 没有embedding也标记为ready
            else:
                lib_doc.status = "ready"
        except Exception as e:
            logger.error(f"生成文档库文档向量失败: {e}")
            lib_doc.status = "failed"

        # 更新文档库计数
        library = await self.db.get(DocumentLibrary, library_id)
        if library:
            result = await self.db.execute(
                select(LibraryDocument).where(LibraryDocument.library_id == library_id)
            )
            library.document_count = len(result.scalars().all())

        await self.db.commit()
        await self.db.refresh(lib_doc)
        return lib_doc

    async def delete_library_document(self, doc_id: uuid.UUID) -> bool:
        doc = await self.db.get(LibraryDocument, doc_id)
        if not doc:
            return False

        library_id = doc.library_id
        await self.db.delete(doc)

        # 更新文档库计数
        library = await self.db.get(DocumentLibrary, library_id)
        if library and library.document_count > 0:
            library.document_count -= 1

        await self.db.commit()
        return True

    async def deactivate_library(self, library_id: uuid.UUID) -> bool:
        library = await self.db.get(DocumentLibrary, library_id)
        if not library:
            return False
        library.is_active = False
        await self.db.commit()
        return True
