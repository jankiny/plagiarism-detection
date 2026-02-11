import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api.auth import fastapi_users, auth_backend
from app.api.users import router as users_router
from app.api.admin import router as admin_router
from app.schemas import UserRead, UserCreate, UserUpdate
from app.core.db import async_engine
from app.models.base import Base


app = FastAPI()

# CORS Middleware - Restrict origins in production
allowed_origins = ["http://localhost:5173", "http://localhost:80"]
if os.getenv("ENVIRONMENT") == "development":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
from app.api.v1 import routes as v1_routes

# fastapi-users 认证路由
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/api/v1/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/api/v1/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/api/v1/auth",
    tags=["auth"],
)

app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(admin_router, prefix="/api", tags=["admin"])
app.include_router(v1_routes.router, prefix="/api/v1", tags=["analysis"])


@app.on_event("startup")
async def startup_event():
    logging.info("Starting up...")
    async with async_engine.begin() as conn:
        # 确保 pgvector 扩展已启用
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

    # Seed the database with initial data
    try:
        from app.core.database_seed import seed_database
        await seed_database()
    except Exception as e:
        logging.error(f"Database seeding failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    logging.info("Shutting down...")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Plagiarism Detection API", "status": "running"}
