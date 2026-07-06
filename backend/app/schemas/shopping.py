from pydantic import BaseModel
from datetime import datetime


class ShoppingItemOut(BaseModel):
    id: int
    name: str
    quantity: str
    category: str
    is_done: bool
    price: float | None = None
    product_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ShoppingItemCreate(BaseModel):
    name: str
    quantity: str = ""
    category: str = "📦 Прочее"
    price: float | None = None
    product_name: str | None = None


class ShoppingItemUpdate(BaseModel):
    name: str | None = None
    quantity: str | None = None
    category: str | None = None
    is_done: bool | None = None


class ShoppingBulkReplace(BaseModel):
    items: list[ShoppingItemCreate]


class GenerateResult(BaseModel):
    items: list[ShoppingItemOut]
    total_price: float
    budget_limit: float | None
    budget_ok: bool
    matched_count: int
    total_count: int
