from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Any


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    family_size: int = 1


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str | None = None
    family_size: int
    preferences: Any | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
