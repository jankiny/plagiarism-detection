import uuid
from fastapi_users import schemas
from typing import Optional
from pydantic import BaseModel

class UserRead(schemas.BaseUser[uuid.UUID]):
    role: str = "user"
    display_name: Optional[str] = None

class UserCreate(schemas.BaseUserCreate):
    role: Optional[str] = "user"
    display_name: Optional[str] = None

class UserUpdate(schemas.BaseUserUpdate):
    role: Optional[str] = None
    display_name: Optional[str] = None
