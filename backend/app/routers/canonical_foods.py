"""CRUD-роутер для управления справочником канонических продуктов.

Эндпоинты:
  GET  /canonical-foods/            — список (с фильтром по категории)
  GET  /canonical-foods/{id}        — одна запись
  POST /canonical-foods/            — создать новую запись
  PUT  /canonical-foods/{id}        — обновить запись
  POST /canonical-foods/match       — найти совпадение для строки
  POST /canonical-foods/match-batch — батч-матчинг нескольких строк

Доступ: только для авторизованных пользователей.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.canonical_food import CanonicalFood
from app.services.auth import get_current_user
from app.services.food_matcher import FoodMatcher, CATEGORY_RANGES

router = APIRouter(prefix="/canonical-foods", tags=["canonical-foods"])


# ──────────────────────────────────────────────
# Pydantic схемы
# ──────────────────────────────────────────────

class CanonicalFoodOut(BaseModel):
    id: int
    name: str
    aliases: list[str]
    category: str
    base_unit: str
    piece_weight_g: Optional[float] = None
    density_g_per_ml: Optional[float] = None
    kcal_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None

    class Config:
        from_attributes = True


class CanonicalFoodCreate(BaseModel):
    name: str
    aliases: list[str] = []
    category: str = "прочее"
    base_unit: str = "g"
    piece_weight_g: Optional[float] = None
    density_g_per_ml: Optional[float] = None
    kcal_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None


class MatchRequest(BaseModel):
    raw_name: str


class MatchResponse(BaseModel):
    raw_name: str
    canonical_food_id: Optional[int]
    canonical_name: Optional[str]
    confidence: float


class BatchMatchRequest(BaseModel):
    raw_names: list[str]


# ──────────────────────────────────────────────
# Эндпоинты
# ──────────────────────────────────────────────

@router.get("/", response_model=list[CanonicalFoodOut])
def list_foods(
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    q: Optional[str] = Query(None, description="Поиск по имени"),
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(CanonicalFood)
    if category:
        query = query.filter(CanonicalFood.category == category)
    if q:
        query = query.filter(CanonicalFood.name.ilike(f"%{q}%"))
    return query.order_by(CanonicalFood.id).offset(offset).limit(limit).all()


@router.get("/categories", response_model=list[str])
def list_categories(_user=Depends(get_current_user)):
    return list(CATEGORY_RANGES.keys())


@router.get("/{food_id}", response_model=CanonicalFoodOut)
def get_food(
    food_id: int,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    food = db.query(CanonicalFood).filter(CanonicalFood.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    return food


@router.post("/", response_model=CanonicalFoodOut, status_code=201)
def create_food(
    data: CanonicalFoodCreate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Добавить новый продукт в справочник.
    ID назначается автоматически по диапазону категории.
    """
    existing = db.query(CanonicalFood).filter(CanonicalFood.name == data.name).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Продукт с именем «{data.name}» уже существует (id={existing.id})",
        )

    matcher = FoodMatcher(db)
    food = matcher.add_food(**data.model_dump())
    return food


@router.put("/{food_id}", response_model=CanonicalFoodOut)
def update_food(
    food_id: int,
    data: CanonicalFoodCreate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    food = db.query(CanonicalFood).filter(CanonicalFood.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    for field, value in data.model_dump().items():
        setattr(food, field, value)

    db.commit()
    db.refresh(food)

    # Обновить кэш матчера
    FoodMatcher(db).rebuild()
    return food


@router.post("/match", response_model=MatchResponse)
def match_ingredient(
    req: MatchRequest,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Найти канонический продукт для произвольной строки."""
    matcher = FoodMatcher(db)
    food_id, score = matcher.match(req.raw_name)

    canonical_name = None
    if food_id:
        food = db.query(CanonicalFood).filter(CanonicalFood.id == food_id).first()
        canonical_name = food.name if food else None

    return MatchResponse(
        raw_name=req.raw_name,
        canonical_food_id=food_id,
        canonical_name=canonical_name,
        confidence=score,
    )


@router.post("/match-batch", response_model=list[MatchResponse])
def match_batch(
    req: BatchMatchRequest,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Батч-матчинг нескольких строк (удобно для прогона по рецептам)."""
    if len(req.raw_names) > 200:
        raise HTTPException(status_code=400, detail="Максимум 200 строк за запрос")

    matcher = FoodMatcher(db)
    results = []

    food_cache: dict[int, CanonicalFood] = {}
    for raw in req.raw_names:
        food_id, score = matcher.match(raw)
        if food_id and food_id not in food_cache:
            food = db.query(CanonicalFood).filter(CanonicalFood.id == food_id).first()
            if food:
                food_cache[food_id] = food

        results.append(
            MatchResponse(
                raw_name=raw,
                canonical_food_id=food_id,
                canonical_name=food_cache[food_id].name if food_id and food_id in food_cache else None,
                confidence=score,
            )
        )
    return results
