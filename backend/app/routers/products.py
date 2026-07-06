"""
Подбор товаров для списка ингредиентов корзины.

POST /products/match-batch
  body: {"ingredients": ["Помидоры черри", "Молоко", ...]}
  response: [
    {
      "ingredient": "Помидоры черри",
      "match": {
        "id": 42,
        "name": "Помидоры Сладкая Ягода 200г",
        "price": 259.99,
        "url": null,            # url в схеме products нет, оставляем null
        "package_size": 200.0,
        "package_unit": "g",
        "in_stock": 1
      },
      "alternatives_count": 7   # сколько ещё есть аналогов
    },
    ...
  ]

Алгоритм:
  1. Нормализуем имя ингредиента
  2. Ищем в ingredients_catalog запись по точному совпадению или подстроке
  3. По найденному id берём из products самый дешёвый товар с in_stock=1
  4. Если в каталоге не нашли — fallback: ищем продукты по подстроке имени
"""
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(prefix="/products", tags=["products"])


# ─── схемы ответа ───
class ProductMatch(BaseModel):
    id: int
    name: str
    price: Optional[float] = None
    package_size: Optional[float] = None
    package_unit: Optional[str] = None
    in_stock: int = 0
    ingredient_id: Optional[int] = None


class MatchedIngredient(BaseModel):
    ingredient: str
    match: Optional[ProductMatch] = None
    alternatives_count: int = 0


class BatchRequest(BaseModel):
    ingredients: list[str]


# ─── нормализация (та же что в импорт-скрипте) ───
def _normalize(s: str) -> str:
    if not s:
        return ""
    s = s.lower().replace("ё", "е")
    s = re.sub(r"[^а-яa-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# ─── поиск ───
def _find_ingredient_id(db: Session, ingredient_name: str) -> Optional[int]:
    """
    Ищет id в ingredients_catalog. Стратегия:
    1. Точное совпадение нормализованного имени
    2. Имя каталога — подстрока имени ингредиента (как слово)
    """
    norm = _normalize(ingredient_name)
    if not norm:
        return None

    # Точное совпадение
    row = db.execute(
        text("SELECT id FROM ingredients_catalog WHERE LOWER(name) = :n LIMIT 1"),
        {"n": norm},
    ).fetchone()
    if row:
        return row[0]

    # Подстрока: 'помидоры черри' содержит 'помидоры' → возвращаем самое длинное совпадение
    rows = db.execute(text("SELECT id, name FROM ingredients_catalog")).fetchall()
    best_id = None
    best_len = 0
    for cid, cname in rows:
        c_norm = _normalize(cname)
        if not c_norm or len(c_norm) < 3:
            continue
        # пропускаем если слишком общие слова попадут (типа "сок" в "соковыжималка")
        pattern = rf"(^|\s){re.escape(c_norm)}(\s|$)"
        if re.search(pattern, norm):
            if len(c_norm) > best_len:
                best_len = len(c_norm)
                best_id = cid
    return best_id


def _find_product_by_ingredient(db: Session, ing_id: int) -> tuple[Optional[dict], int]:
    """
    Возвращает (самый_дешёвый_продукт, всего_аналогов).
    Берём только in_stock=1 и с непустой ценой.
    """
    rows = db.execute(text("""
        SELECT id, name, price_current, package_size, package_unit, in_stock, ingredient_id
        FROM products
        WHERE ingredient_id = :ing_id
          AND in_stock = 1
          AND price_current IS NOT NULL
        ORDER BY price_current ASC
    """), {"ing_id": ing_id}).fetchall()

    if not rows:
        return None, 0

    first = rows[0]
    return {
        "id": first[0],
        "name": first[1],
        "price": first[2],
        "package_size": first[3],
        "package_unit": first[4],
        "in_stock": first[5],
        "ingredient_id": first[6],
    }, len(rows)


def _fallback_search_products(db: Session, ingredient_name: str) -> tuple[Optional[dict], int]:
    """
    Если в каталоге ингредиент не нашёлся — ищем напрямую в products
    по подстроке нормализованного имени.
    """
    norm = _normalize(ingredient_name)
    if not norm or len(norm) < 3:
        return None, 0

    # Берём первые два значимых токена для поиска
    tokens = [t for t in norm.split() if len(t) >= 3]
    if not tokens:
        return None, 0

    # AND по всем токенам — например "помидоры черри" найдёт товар с обоими словами
    where_clauses = " AND ".join(
        [f"LOWER(name) LIKE :tok{i}" for i in range(len(tokens))]
    )
    params = {f"tok{i}": f"%{t}%" for i, t in enumerate(tokens)}

    rows = db.execute(text(f"""
        SELECT id, name, price_current, package_size, package_unit, in_stock, ingredient_id
        FROM products
        WHERE in_stock = 1
          AND price_current IS NOT NULL
          AND {where_clauses}
        ORDER BY price_current ASC
        LIMIT 20
    """), params).fetchall()

    if not rows:
        # Последний шанс — самый длинный токен в одиночку
        longest = max(tokens, key=len)
        rows = db.execute(text("""
            SELECT id, name, price_current, package_size, package_unit, in_stock, ingredient_id
            FROM products
            WHERE in_stock = 1
              AND price_current IS NOT NULL
              AND LOWER(name) LIKE :pat
            ORDER BY price_current ASC
            LIMIT 20
        """), {"pat": f"%{longest}%"}).fetchall()

    if not rows:
        return None, 0

    first = rows[0]
    return {
        "id": first[0],
        "name": first[1],
        "price": first[2],
        "package_size": first[3],
        "package_unit": first[4],
        "in_stock": first[5],
        "ingredient_id": first[6],
    }, len(rows)


# ─── эндпоинт ───
@router.post("/match-batch", response_model=list[MatchedIngredient])
def match_batch(req: BatchRequest, db: Session = Depends(get_db)):
    """Подобрать товары для списка ингредиентов."""
    if not req.ingredients:
        return []
    if len(req.ingredients) > 200:
        raise HTTPException(400, "max 200 ingredients per batch")

    out = []
    for ing_name in req.ingredients:
        # 1. Сначала ищем через каталог (точнее)
        ing_id = _find_ingredient_id(db, ing_name)
        if ing_id:
            match, alts = _find_product_by_ingredient(db, ing_id)
            if match:
                out.append(MatchedIngredient(
                    ingredient=ing_name,
                    match=ProductMatch(**match),
                    alternatives_count=max(0, alts - 1),
                ))
                continue

        # 2. Если в каталоге не нашли или у каталогового нет товаров — fallback
        match, alts = _fallback_search_products(db, ing_name)
        if match:
            out.append(MatchedIngredient(
                ingredient=ing_name,
                match=ProductMatch(**match),
                alternatives_count=max(0, alts - 1),
            ))
            continue

        # 3. Не нашли ничего
        out.append(MatchedIngredient(ingredient=ing_name, match=None, alternatives_count=0))

    return out