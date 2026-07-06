"""
SEO-эндпоинты для Nuxt-зоны.

Установка:
    1. Скопировать этот файл в app/routers/seo.py (или обновить существующий).
    2. В app/main.py убедиться что есть строка:
           from app.routers.seo import router as seo_router
           app.include_router(seo_router, prefix="/api/seo", tags=["seo"])
    3. Перезапустить uvicorn.

Принципы:
    • Все эндпоинты — публичные, без авторизации (нужны для SSG-билда Nuxt).
    • Read-only. Никаких мутаций.
    • Slug рецептов — если в БД нет, генерим на лету через slugify(name).
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.recipe import Recipe, Ingredient

# canonical_foods — опционально, если модель есть
try:
    from app.models.canonical_food import CanonicalFood
    HAS_CANONICAL = True
except ImportError:
    HAS_CANONICAL = False
    CanonicalFood = None

router = APIRouter()


# ─── Утилиты ──────────────────────────────────────────────────────────
def slugify(name: str) -> str:
    """
    Транслит русского названия в URL-safe slug.
    'Яйцо куриное' → 'yajco-kurinoe'
    """
    if not name:
        return ""
    table = {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e",
        "ё": "yo", "ж": "zh", "з": "z", "и": "i", "й": "j", "к": "k",
        "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
        "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "c",
        "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "",
        "э": "e", "ю": "yu", "я": "ya", " ": "-", "_": "-",
    }
    out = []
    for ch in name.lower():
        if ch in table:
            out.append(table[ch])
        elif ch.isalnum() or ch == "-":
            out.append(ch)
        else:
            out.append("-")
    result = "-".join(filter(None, "".join(out).split("-")))
    return result


def recipe_slug(r: Recipe) -> str:
    """Slug рецепта: из БД если есть, иначе генерим из name."""
    return r.slug or slugify(r.name)


# ─── /api/seo/sitemap?type=<recipes|ingredients|menus|reference> ───────
@router.get("/sitemap")
def sitemap_urls(
    type: str = Query(..., regex="^(recipes|ingredients|menus|reference)$"),
    db: Session = Depends(get_db),
):
    """Список slug + updated_at для динамической части sitemap."""

    if type == "recipes":
        # Берём все рецепты, slug генерим если нет
        rows = db.query(Recipe.id, Recipe.name, Recipe.slug).all()
        out = []
        for r in rows:
            slug = r.slug or slugify(r.name)
            if slug:
                out.append({"slug": slug, "updated_at": None})
        return out

    if type == "ingredients":
        if not HAS_CANONICAL:
            return []
        rows = db.query(CanonicalFood).limit(300).all()
        return [{"slug": slugify(c.name), "updated_at": None} for c in rows if c.name]

    if type == "menus":
        return [
            {"slug": s, "updated_at": None}
            for s in ["dlya-semi", "pp", "byudzhetnoe"]
        ]

    if type == "reference":
        if not HAS_CANONICAL:
            return []
        rows = db.query(CanonicalFood).limit(50).all()
        out = []
        for c in rows:
            if not c.name:
                continue
            slug = slugify(c.name)
            out.append({"slug": slug, "subtype": "zameny", "updated_at": None})
            out.append({"slug": slug, "subtype": "srok-khraneniya", "updated_at": None})
        return out

    return []


# ─── /api/seo/og-data — данные для OG-картинок ───────────────────────
@router.get("/og-data")
def og_data(
    kind: str = Query(...),
    slug: str = Query(...),
    db: Session = Depends(get_db),
):
    if kind == "recipe":
        # Сначала ищем по slug в БД, потом — по slugify(name) на лету
        r = db.query(Recipe).filter(Recipe.slug == slug).first()
        if not r:
            for cand in db.query(Recipe).all():
                if slugify(cand.name) == slug:
                    r = cand
                    break
        if not r:
            raise HTTPException(404, "recipe not found")
        return {
            "title": r.name,
            "emoji": r.emoji or "🍽️",
            "bgColor": r.bg_color or "#E4F5EA",
            "mealType": r.meal_type,
            "timeMin": r.time_minutes,
            "kcal": int(r.kcal) if r.kcal else None,
            "subtitle": "Рецепт с КБЖУ и шагами",
        }

    if kind == "menu":
        menu_titles = {
            "dlya-semi": "Меню на неделю для семьи",
            "pp": "ПП-меню на неделю",
            "byudzhetnoe": "Бюджетное меню на неделю",
        }
        return {
            "title": menu_titles.get(slug, "Меню на неделю"),
            "emoji": "📅",
            "bgColor": "#EEEDFE",
            "subtitle": "7 дней · КБЖУ · список покупок",
        }

    return {
        "title": "Меню на неделю за 60 секунд",
        "emoji": "🍽️",
        "bgColor": "#EBF8F1",
        "subtitle": "plus-time.ru",
    }


# ─── /api/seo/recipes/{slug} — для архетипа A ──────────────────────────
@router.get("/recipes/{slug}")
def recipe_seo(slug: str, db: Session = Depends(get_db)):
    """
    Данные одного рецепта для страницы /recepty/[slug].
    Принимает либо настоящий slug из БД, либо сгенерированный из name.
    """
    # 1. Прямой поиск по slug
    r = db.query(Recipe).filter(Recipe.slug == slug).first()

    # 2. Fallback: ищем по совпадению slugify(name)
    if not r:
        for cand in db.query(Recipe).all():
            if slugify(cand.name) == slug:
                r = cand
                break

    if not r:
        raise HTTPException(404, "recipe not found")

    # Похожие — по тому же meal_type и cuisine
    similar_q = db.query(Recipe).filter(Recipe.id != r.id)
    if r.cuisine:
        similar_q = similar_q.filter(Recipe.cuisine == r.cuisine)
    if r.meal_type:
        similar_q = similar_q.filter(Recipe.meal_type == r.meal_type)
    similar = similar_q.limit(3).all()

    return {
        "id": r.id,
        "slug": recipe_slug(r),
        "name": r.name,
        "emoji": r.emoji or "🍽️",
        "bg_color": r.bg_color or "#E4F5EA",
        "description": r.description,
        "meal_type": r.meal_type,
        "cuisine": r.cuisine,
        "category": r.category,
        "time_minutes": r.time_minutes,
        "kcal": r.kcal,
        "proteins": r.proteins,
        "fats": r.fats,
        "carbs": r.carbs,
        "is_vegetarian": bool(r.is_vegetarian),
        "is_vegan": bool(r.is_vegan),
        "is_fast": bool(r.is_fast),
        "is_gluten_free": bool(r.is_gluten_free),
        "is_lactose_free": bool(r.is_lactose_free),
        "steps": r.steps or [],
        "tags": r.tags or [],
        "ingredients": [
            {
                "name": i.name,
                "quantity": i.quantity,
                "category": i.category,
                "canonical_food_id": i.canonical_food_id,
            }
            for i in (r.ingredients or [])
        ],
        "similar": [
            {
                "slug": recipe_slug(s),
                "name": s.name,
                "emoji": s.emoji or "🍽️",
                "bg_color": s.bg_color or "#E4F5EA",
                "time_minutes": s.time_minutes,
                "kcal": s.kcal,
                "meal_type": s.meal_type,
            }
            for s in similar
        ],
    }


# ─── /api/seo/recipes — листинг для каталога ──────────────────────────
@router.get("/recipes")
def recipes_list(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Каталог рецептов для /recepty (с пагинацией)."""
    total = db.query(Recipe).count()
    rows = db.query(Recipe).offset(offset).limit(limit).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "slug": recipe_slug(r),
                "name": r.name,
                "emoji": r.emoji or "🍽️",
                "bg_color": r.bg_color or "#E4F5EA",
                "time_minutes": r.time_minutes,
                "kcal": r.kcal,
                "meal_type": r.meal_type,
                "cuisine": r.cuisine,
            }
            for r in rows
        ],
    }


# ─── /api/seo/chto-est-doma — для S1.1 интерактивного селектора ───────
@router.post("/chto-est-doma")
def what_can_i_cook(
    selected_food_ids: list[int],
    db: Session = Depends(get_db),
):
    """
    Принимает список canonical_food_id, возвращает топ-5 рецептов с
    максимальным пересечением ингредиентов.
    """
    if not selected_food_ids:
        return {"recipes": []}

    selected = set(selected_food_ids)
    scored = []

    recipes_with_canonicals = (
        db.query(Recipe)
        .join(Ingredient, Ingredient.recipe_id == Recipe.id)
        .filter(Ingredient.canonical_food_id.isnot(None))
        .distinct()
        .all()
    )

    for r in recipes_with_canonicals:
        all_ids = {i.canonical_food_id for i in r.ingredients if i.canonical_food_id}
        if not all_ids:
            continue
        overlap = len(selected & all_ids)
        if overlap == 0:
            continue
        score = overlap / len(all_ids)
        scored.append((score, r))

    scored.sort(key=lambda x: (-x[0], x[1].time_minutes or 9999))
    top = scored[:5]

    return {
        "recipes": [
            {
                "slug": recipe_slug(r),
                "name": r.name,
                "emoji": r.emoji or "🍽️",
                "bg_color": r.bg_color or "#E4F5EA",
                "time_minutes": r.time_minutes,
                "kcal": r.kcal,
                "meal_type": r.meal_type,
                "match_score": round(score, 2),
            }
            for score, r in top
        ],
    }
