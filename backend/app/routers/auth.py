from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Any

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.services.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        name=data.name,
        family_size=data.family_size,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return Token(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# Sentinel чтобы отличить "поле не пришло" от "поле пришло как null".
# Pydantic v2: использование model_dump(exclude_unset=True) — единственный
# надёжный способ узнать какие поля юзер реально хотел изменить.
class UserUpdate(BaseModel):
    name: str | None = None
    family_size: int | None = Field(default=None, ge=1, le=20)
    preferences: Any | None = None
    current_password: str | None = None
    new_password: str | None = None


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = data.model_dump(exclude_unset=True)

    if "name" in payload:
        current_user.name = payload["name"]

    if "family_size" in payload:
        current_user.family_size = payload["family_size"]

    if "preferences" in payload:
        # null здесь означает "сбросить prefs". Если фронт хочет частичный
        # апдейт — он сам мерджит на клиенте и шлёт целиком, как сейчас и делает.
        current_user.preferences = payload["preferences"]

    if payload.get("new_password"):
        if not payload.get("current_password"):
            raise HTTPException(status_code=400, detail="Укажите текущий пароль")
        if not verify_password(payload["current_password"], current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Неверный текущий пароль")
        current_user.hashed_password = hash_password(payload["new_password"])

    db.commit()
    db.refresh(current_user)
    return current_user
