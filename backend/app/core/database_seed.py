import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.core.config import settings
from app.models.user import User
from app.models.system_settings import SystemSettings
from app.models.base import Base
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_async_session():
    """Create async database session"""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

async def get_user_by_email(session: AsyncSession, email: str) -> User:
    """Get user by email"""
    result = await session.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()

async def create_user(session: AsyncSession, email: str, password: str, role: str = "user", display_name: str = None) -> User:
    """Create a new user"""
    hashed_password = pwd_context.hash(password)
    user = User(
        email=email,
        hashed_password=hashed_password,
        role=role,
        display_name=display_name
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def seed_database():
    """Seed the database with initial admin and sample users"""
    print("Seeding database...")

    try:
        engine = create_async_engine(settings.DATABASE_URL)

        # 启用 pgvector 扩展并创建表
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)

            # 添加新字段的 ALTER TABLE（幂等）
            alter_statements = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR",
                "ALTER TABLE batches ADD COLUMN IF NOT EXISTS compare_mode VARCHAR DEFAULT 'library'",
                "ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS source_type VARCHAR DEFAULT 'internal'",
                "ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS library_id UUID",
                "ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS library_doc_id UUID",
                "ALTER TABLE comparisons ALTER COLUMN doc_b DROP NOT NULL",
            ]
            for stmt in alter_statements:
                try:
                    await conn.execute(text(stmt))
                except Exception:
                    pass  # 字段已存在或表不存在时忽略

            # 创建 hnsw 向量索引
            try:
                await conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_library_documents_embedding "
                    "ON library_documents USING hnsw (embedding vector_cosine_ops)"
                ))
            except Exception:
                pass  # 表还不存在时忽略

        # Create session
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as session:
            # Create admin user if not exists
            admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
            admin_password = os.getenv("ADMIN_PASSWORD", "AdminPass123!")

            existing_admin = await get_user_by_email(session, admin_email)
            if not existing_admin:
                admin_user = await create_user(session, admin_email, admin_password, "admin", "系统管理员")
                print(f"Created admin user: {admin_user.email}")
            else:
                print(f"Admin user already exists: {existing_admin.email}")

            # Create sample users if they don't exist
            # sample_users = [
            #     {"email": "user1@example.com", "password": "UserPass123!", "role": "user", "display_name": "测试用户1"},
            #     {"email": "user2@example.com", "password": "UserPass123!", "role": "user", "display_name": "测试用户2"},
            #     {"email": "moderator@example.com", "password": "ModPass123!", "role": "moderator", "display_name": "版主"},
            # ]

            # for user_data in sample_users:
            #     existing_user = await get_user_by_email(session, user_data["email"])
            #     if not existing_user:
            #         user = await create_user(
            #             session,
            #             user_data["email"],
            #             user_data["password"],
            #             user_data["role"],
            #             user_data.get("display_name")
            #         )
            #         print(f"Created user: {user.email} with role: {user.role}")
            #     else:
            #         print(f"User already exists: {existing_user.email}")

            # 初始化系统设置（如果不存在）
            existing_settings = await session.get(SystemSettings, 1)
            if not existing_settings:
                default_settings = SystemSettings(
                    id=1,
                    ai_api_key=settings.AI_API_KEY,
                    ai_api_base_url=settings.AI_API_BASE_URL,
                    ai_chat_model=settings.AI_CHAT_MODEL,
                    ai_embedding_model=settings.AI_EMBEDDING_MODEL,
                )
                session.add(default_settings)
                await session.commit()
                print("Created default system settings")

            await session.commit()
            print("Database seeding completed!")

    except Exception as e:
        print(f"Error during database seeding: {str(e)}")
        return

def main():
    """Main function to run the seeding script"""
    asyncio.run(seed_database())

if __name__ == "__main__":
    main()
