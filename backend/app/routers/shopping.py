"""Список покупок.

Фронт сейчас рассчитывает список покупок локально (menuStore.generateShoppingList),
поэтому серверный CRUD здесь оставлен в основном для совместимости с прежним API.
Эндпоинт /shopping/generate использует таблицы products и ingredients_catalog,
которых нет в SQLAlchemy-моделях — они наполняются скриптом impg.py.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models.user import User
from app.models.shopping import ShoppingItem
from app.models.menu import WeekMenu, MenuMeal
from app.models.recipe import Recipe
from app.schemas.shopping import (
    ShoppingItemOut, ShoppingItemCreate, ShoppingItemUpdate,
    ShoppingBulkReplace, GenerateResult,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/shopping", tags=["shopping"])

BUDGET_LIMITS = {
    "low":  3000.0,
    "mid":  6000.0,
    "high": None,
}


@router.post("/generate", response_model=GenerateResult)
def generate_shopping_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Серверная генерация списка покупок с подбором цен.

    Сейчас фронт этим не пользуется (всё считается локально), но эндпоинт
    оставлен чтобы не ломать старые клиенты и для будущей интеграции цен.

    Использует две внеORM таблицы (наполняются скриптом impg.py):
      - ingredients_catalog (id, name, category)
      - products (ingredient_id, name, price_current, in_stock, ...)
    Если их нет — возвращает пустой результат, а не падает 500.
    """
    # 1. Очищаем старый список
    db.query(ShoppingItem).filter(ShoppingItem.user_id == current_user.id).delete()

    # 2. Собираем все recipe_id из всех меню недель пользователя через ORM.
    #    Старая версия пыталась читать wm.meals.get(...) — это объекты MenuMeal,
    #    у них нет .get(), был AttributeError.
    rows = (
        db.query(MenuMeal.recipe_id)
        .join(WeekMenu, MenuMeal.week_menu_id == WeekMenu.id)
        .filter(WeekMenu.user_id == current_user.id)
        .distinct()
        .all()
    )
    recipe_ids = {r[0] for r in rows if r[0]}

    if not recipe_ids:
        db.commit()
        return GenerateResult(
            items=[], total_price=0, budget_limit=None,
            budget_ok=True, matched_count=0, total_count=0,
        )

    # 3. Получаем ingredient_ids из рецептов.
    #    Recipe.ingredient_ids — JSON-колонка; у части рецептов NULL.
    recipes = (
        db.query(Recipe.ingredient_ids)
        .filter(Recipe.id.in_(recipe_ids))
        .all()
    )
    all_ingredient_ids: set[int] = set()
    for (raw,) in recipes:
        if not raw:
            continue
        ids = json.loads(raw) if isinstance(raw, str) else raw
        try:
            all_ingredient_ids.update(int(x) for x in ids)
        except (TypeError, ValueError):
            continue

    if not all_ingredient_ids:
        db.commit()
        return GenerateResult(
            items=[], total_price=0, budget_limit=None,
            budget_ok=True, matched_count=0, total_count=0,
        )

    # 4. Каталог ингредиентов и цены — внеORM таблицы.
    #    Защищаемся от их отсутствия: если таблиц нет (например в свежей
    #    инсталляции до запуска impg.py) — возвращаем пустой матчинг.
    try:
        ph = ",".join(["?"] * len(all_ingredient_ids))
        ids_list = list(all_ingredient_ids)

        catalog_rows = db.execute(
            text(f"SELECT id, name, category FROM ingredients_catalog WHERE id IN ({ph})"),
            ids_list,
        ).fetchall()
        catalog = {r[0]: {"name": r[1], "category": r[2]} for r in catalog_rows}

        price_rows = db.execute(
            text(
                f"SELECT ingredient_id, name, price_current FROM products "
                f"WHERE ingredient_id IN ({ph}) AND in_stock = 1 "
                f"ORDER BY price_current ASC"
            ),
            ids_list,
        ).fetchall()
    except Exception:
        # Таблиц нет или схема отличается — деградируем без падения.
        db.commit()
        return GenerateResult(
            items=[], total_price=0, budget_limit=None,
            budget_ok=True, matched_count=0, total_count=0,
        )

    # Берём самую дешёвую цену для каждого ингредиента (rows уже отсортированы)
    prices: dict[int, dict] = {}
    for r in price_rows:
        if r[0] not in prices:
            prices[r[0]] = {"price": r[2], "product_name": r[1]}

    # 5. Формируем список покупок
    prefs = current_user.preferences or {}
    budget_key = prefs.get("budget", "mid") if isinstance(prefs, dict) else "mid"
    budget_limit = BUDGET_LIMITS.get(budget_key)

    items: list[ShoppingItem] = []
    total_price = 0.0
    matched_count = 0

    for ing_id, ing in catalog.items():
        price_info = prices.get(ing_id)
        price = price_info["price"] if price_info else None
        product_name = price_info["product_name"] if price_info else None

        if price:
            total_price += price
            matched_count += 1

        item = ShoppingItem(
            user_id=current_user.id,
            name=ing["name"],
            category=ing["category"],
            quantity="",
            price=price,
            product_name=product_name,
        )
        db.add(item)
        items.append(item)

    db.commit()
    for item in items:
        db.refresh(item)

    budget_ok = budget_limit is None or total_price <= budget_limit
    return GenerateResult(
        items=items,
        total_price=round(total_price, 2),
        budget_limit=budget_limit,
        budget_ok=budget_ok,
        matched_count=matched_count,
        total_count=len(items),
    )


@router.get("", response_model=list[ShoppingItemOut])
def get_shopping_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ShoppingItem)
        .filter(ShoppingItem.user_id == current_user.id)
        .order_by(ShoppingItem.created_at, ShoppingItem.id)
        .all()
    )


@router.post("", response_model=ShoppingItemOut, status_code=201)
def add_item(
    data: ShoppingItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = ShoppingItem(user_id=current_user.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=ShoppingItemOut)
def update_item(
    item_id: int,
    data: ShoppingItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Элемент не найден")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Элемент не найден")
    db.delete(item)
    db.commit()


@router.put("/bulk", response_model=list[ShoppingItemOut])
def bulk_replace(
    data: ShoppingBulkReplace,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Заменяет весь список покупок пользователя одним запросом.

    Транзакционно: либо удаляем старое и вставляем новое целиком, либо ничего.
    """
    db.query(ShoppingItem).filter(ShoppingItem.user_id == current_user.id).delete()
    items = [
        ShoppingItem(user_id=current_user.id, **item.model_dump())
        for item in data.items
    ]
    db.add_all(items)
    db.commit()
    return (
        db.query(ShoppingItem)
        .filter(ShoppingItem.user_id == current_user.id)
        .order_by(ShoppingItem.created_at, ShoppingItem.id)
        .all()
    )


@router.delete("", status_code=204)
def clear_shopping_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(ShoppingItem).filter(ShoppingItem.user_id == current_user.id).delete()
    db.commit()
