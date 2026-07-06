"""
Генератор меню на неделю — порт Front/src/utils/mealPlanGenerator.js (этап A).

Отличия от JS-версии:
  • Детерминизм: источник случайности — переданный random.Random(seed),
    а не глобальный Math.random. Один seed → одно и то же меню (перезагрузка
    страницы не тасует). Кнопка «Перегенерировать» шлёт новый seed.
  • Работает с recipe-view dict'ами (см. routers/menu.py::_recipe_view),
    имена полей совпадают с mapped-форматом фронта: type, time, protein, ings[{n}].
  • scaleIngredients / parseQuantity / formatNumber НЕ портированы — они нужны
    списку покупок (этап B) и пока остаются на фронте.

Все нормы — в nutrition_norms.py.
"""

import math
import re

from app.services.nutrition_norms import (
    ADULT_EQUIVALENT, MEAL_SPLIT, should_add_snack,
    TOLERANCE, HEALTH_CONSTRAINTS, HERO_INGREDIENTS,
    SCORING_WEIGHTS, RELAXATION_LEVELS, MIN_POOL_SIZE,
    ALLERGEN_PATTERNS, CUISINE_PATTERNS,
    is_batch_mode, is_batch_suitable,
)

DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
SLOTS_3 = ["breakfast", "lunch", "dinner"]
SLOTS_4 = ["breakfast", "lunch", "dinner", "snack"]


def _round_half_up(x: float) -> int:
    """Аналог JS Math.round (округление .5 вверх). Все значения тут положительные."""
    return math.floor(x + 0.5)


# ═══════════════════════════════════════════════════════════════════════
# ПУБЛИЧНОЕ API
# ═══════════════════════════════════════════════════════════════════════
def generate_week_menu(all_recipes: list[dict], prefs: dict | None, rng) -> dict:
    """Главная функция. recipes — список recipe-view, prefs — dict, rng — random.Random."""
    prefs = prefs or {}
    if not all_recipes:
        return empty_result(prefs)

    adult_equivalent = compute_adult_equivalent(prefs)
    mt = compute_meal_targets(prefs)
    slots, targets, use_snack = mt["slots"], mt["targets"], mt["useSnack"]

    # Шаг 1: жёсткая фильтрация (аллергии/диета/dislikedDishIds) — НИКОГДА не смягчается
    safe = apply_hard_filters(all_recipes, prefs)

    # Шаг 2: минимально достаточный уровень смягчения
    relaxed = relax_until_enough(safe, prefs, len(slots))
    pool, fallback_applied = relaxed["pool"], relaxed["fallbackApplied"]

    # Шаг 3: разделение по слотам
    pool_by_slot = {slot: pool_for_slot(pool, slot) for slot in slots}

    is_batch = is_batch_mode(prefs)

    week_state = {
        "usedRecipeIds": {},
        "usedHeroes": {},
        "lastDayHero": None,
        "dayHasVeg": set(),
    }

    # ── BATCH: один lunch и один dinner на пн-пт ──
    batch_lunch = None
    batch_dinner = None
    if is_batch:
        batch_lunch_pool = [r for r in pool_by_slot["lunch"] if is_batch_suitable(r)]
        batch_dinner_pool = [r for r in pool_by_slot["dinner"] if is_batch_suitable(r)]
        lp = batch_lunch_pool if batch_lunch_pool else pool_by_slot["lunch"]
        dp = batch_dinner_pool if batch_dinner_pool else pool_by_slot["dinner"]

        batch_prefs = {**prefs, "cookTime": None}

        batch_lunch = pick_best(lp, "lunch", targets["lunch"], batch_prefs, week_state, 1, rng)
        if batch_lunch:
            register_use(week_state, batch_lunch, 1)
        batch_dinner = pick_best(
            [r for r in dp if not batch_lunch or r["id"] != batch_lunch["id"]],
            "dinner", targets["dinner"], batch_prefs, week_state, 1, rng,
        )
        if batch_dinner:
            register_use(week_state, batch_dinner, 1)

    # ── Генерация по дням ──
    week = []
    for day_idx, day_name in enumerate(DAYS):
        meals = []
        week_state["lastDayHero"] = None

        for slot in slots:
            is_weekday = 0 <= day_idx <= 4
            is_lunch_or_dinner = slot in ("lunch", "dinner")

            if is_batch and is_lunch_or_dinner and is_weekday:
                pick = batch_lunch if slot == "lunch" else batch_dinner
            else:
                sp = [
                    r for r in pool_by_slot[slot]
                    if not is_batch or (
                        (not batch_lunch or r["id"] != batch_lunch["id"])
                        and (not batch_dinner or r["id"] != batch_dinner["id"])
                    )
                ]
                pick = pick_best(sp, slot, targets[slot], prefs, week_state, day_idx, rng)

            if not pick:
                continue

            meals.append({
                "slot": slot,
                "recipe": pick,
                "isBatch": is_batch and is_lunch_or_dinner and is_weekday,
            })

            should_register = not (is_batch and is_lunch_or_dinner and is_weekday)
            if should_register:
                register_use(week_state, pick, day_idx)

        day_kcal = sum(recipe_kcal(m["recipe"]) or 0 for m in meals)
        week.append({"day": day_name, "dayIdx": day_idx, "meals": meals, "dayKcal": day_kcal})

    stats = compute_week_stats(week, prefs, is_batch)

    return {
        "week_menu": week,
        "adult_equivalent": adult_equivalent,
        "meal_targets": targets,
        "use_snack": use_snack,
        "slots": slots,
        "fallback_applied": fallback_applied,
        "stats": stats,
    }


def compute_adult_equivalent(prefs: dict | None) -> float:
    prefs = prefs or {}
    family_size = max(1, prefs.get("familySize") or 1)
    tags = prefs.get("familyTags") or {}

    non_adults = []
    if tags.get("kids_small"):
        non_adults.append(ADULT_EQUIVALENT["kid_small"])
    if tags.get("kids"):
        non_adults.append(ADULT_EQUIVALENT["kid"])
    if tags.get("teens"):
        non_adults.append(ADULT_EQUIVALENT["teen"])
    if tags.get("elderly"):
        non_adults.append(ADULT_EQUIVALENT["elderly"])

    used_tags = non_adults[:max(0, family_size - 1)]
    adults = family_size - len(used_tags)

    ae = adults * ADULT_EQUIVALENT["adult"] + sum(used_tags)
    return _round_half_up(ae * 100) / 100


def compute_meal_targets(prefs: dict | None) -> dict:
    prefs = prefs or {}
    tk = prefs.get("targetKcal") or 2000
    tp = prefs.get("targetProtein") or 80
    tf = prefs.get("targetFat") or 70
    tc = prefs.get("targetCarbs") or 250

    use_snack = should_add_snack(prefs)
    split = MEAL_SPLIT["four"] if use_snack else MEAL_SPLIT["three"]
    slots = SLOTS_4 if use_snack else SLOTS_3

    targets = {}
    for slot in slots:
        targets[slot] = {
            "kcal": _round_half_up(tk * split[slot]),
            "protein": _round_half_up(tp * split[slot]),
            "fat": _round_half_up(tf * split[slot]),
            "carbs": _round_half_up(tc * split[slot]),
        }
    return {"slots": slots, "targets": targets, "useSnack": use_snack}


# ═══════════════════════════════════════════════════════════════════════
# ВНУТРЕННЕЕ
# ═══════════════════════════════════════════════════════════════════════
def empty_result(prefs: dict | None) -> dict:
    return {
        "week_menu": [],
        "adult_equivalent": compute_adult_equivalent(prefs),
        "meal_targets": {},
        "use_snack": False,
        "slots": SLOTS_3,
        "fallback_applied": None,
        "stats": {"avgKcal": 0, "fishCount": 0, "vegDaysCount": 0, "uniqueRecipes": 0},
    }


def apply_hard_filters(recipes: list[dict], prefs: dict | None) -> list[dict]:
    prefs = prefs or {}
    r = prefs.get("restrictions") or {}
    disliked = {str(x) for x in (prefs.get("dislikedDishIds") or [])}

    out = []
    for rec in recipes:
        if not rec:
            continue
        if str(rec["id"]) in disliked:
            continue

        text = recipe_full_text(rec)

        # Аллергии
        if r.get("nuts") and ALLERGEN_PATTERNS["nuts"].search(text):
            continue
        if r.get("lactose") and ALLERGEN_PATTERNS["lactose"].search(text):
            continue
        if r.get("gluten") and ALLERGEN_PATTERNS["gluten"].search(text):
            continue
        if r.get("seafood") and ALLERGEN_PATTERNS["seafood"].search(text):
            continue
        if r.get("pork") and ALLERGEN_PATTERNS["pork"].search(text):
            continue
        if r.get("halal") and ALLERGEN_PATTERNS["halal"].search(text):
            continue

        # Диета
        if r.get("veg") and ALLERGEN_PATTERNS["meat"].search(text):
            continue
        if r.get("vegan") and ALLERGEN_PATTERNS["animal"].search(text):
            continue

        out.append(rec)
    return out


def apply_soft_filters(recipes: list[dict], prefs: dict | None, level: int = 0) -> list[dict]:
    prefs = prefs or {}
    drops = RELAXATION_LEVELS[level]["drops"] if 0 <= level < len(RELAXATION_LEVELS) else []
    cook_time_limit = prefs.get("cookTime")
    disliked_raw = prefs.get("dislikedProducts") or ""
    disliked_words = [
        s for s in (part.strip() for part in re.split(r"[,;\n]", str(disliked_raw).lower()))
        if len(s) > 2
    ]

    out = []
    for rec in recipes:
        text = recipe_full_text(rec)
        time = rec.get("time") or rec.get("total_time_min") or 0

        if "cookTime" not in drops and cook_time_limit and time > cook_time_limit + 15:
            continue

        if "dislikedProducts" not in drops and disliked_words:
            if any(w in text for w in disliked_words):
                continue

        out.append(rec)
    return out


def relax_until_enough(safe: list[dict], prefs: dict | None, slots_count: int) -> dict:
    level = 0
    pool = apply_soft_filters(safe, prefs, 0)
    need = MIN_POOL_SIZE * slots_count

    while len(pool) < need and level < len(RELAXATION_LEVELS) - 1:
        level += 1
        pool = apply_soft_filters(safe, prefs, level)

    if len(pool) < need and len(safe) > len(pool):
        pool = safe

    return {
        "pool": pool,
        "fallbackApplied": RELAXATION_LEVELS[level] if level > 0 else None,
    }


def pool_for_slot(pool: list[dict], slot: str) -> list[dict]:
    matched = [r for r in pool if (r.get("type") or r.get("meal_type")) == slot]
    if len(matched) >= MIN_POOL_SIZE:
        return matched

    if slot == "snack":
        if matched:
            return matched
        return [
            r for r in pool
            if recipe_kcal(r) <= 200 and (r.get("time") or r.get("total_time_min") or 0) <= 10
        ]

    return [
        r for r in pool
        if not (r.get("type") or r.get("meal_type")) or (r.get("type") or r.get("meal_type")) == slot
    ]


def pick_best(pool, slot, target, prefs, week_state, day_idx, rng):
    if not pool:
        return None
    scored = [(score_recipe(r, slot, target, prefs, week_state, day_idx, rng), r) for r in pool]
    scored.sort(key=lambda x: x[0], reverse=True)
    top_k = min(3, len(scored))
    return scored[int(rng.random() * top_k)][1]


def score_recipe(recipe, slot, target, prefs, week_state, day_idx, rng):
    w = SCORING_WEIGHTS
    score = 0.0

    kcal = recipe_kcal(recipe)
    protein = recipe.get("protein")
    protein = (kcal * 0.15 / 4) if protein is None else protein
    fat = recipe.get("fat")
    fat = (kcal * 0.30 / 9) if fat is None else fat
    carbs = recipe.get("carbs")
    carbs = (kcal * 0.55 / 4) if carbs is None else carbs

    # 1. Близость к целевым КБЖУ
    score += w["kcalProximity"] * proximity(kcal, target["kcal"])
    score += w["proteinProximity"] * proximity(protein, target["protein"])
    score += w["fatProximity"] * proximity(fat, target["fat"])
    score += w["carbsProximity"] * proximity(carbs, target["carbs"])

    # 2. Лайки со свайпа (сравниваем как строки — id рецептов на фронте строковые)
    liked = {str(x) for x in ((prefs or {}).get("likedDishIds") or [])}
    if str(recipe["id"]) in liked:
        score += w["liked"]

    # 3. Кухня
    cuisine = detect_cuisine(recipe)
    if cuisine and ((prefs or {}).get("cuisines") or {}).get(cuisine):
        score += w["cuisineMatch"]

    # 4. Штраф за превышение времени
    time = recipe.get("time") or recipe.get("total_time_min") or 0
    cook_time = (prefs or {}).get("cookTime")
    if cook_time and time > cook_time:
        overshoot = (time - cook_time) / cook_time
        score -= w["timePenalty"] * min(1, overshoot)

    # 5. Разнообразие
    used_count = week_state["usedRecipeIds"].get(recipe["id"], 0)
    if used_count > 0:
        score -= w["diversityPenalty"] * used_count

    # 6. Hero-ингредиент
    hero = extract_hero(recipe)
    if hero:
        hero_count = week_state["usedHeroes"].get(hero, 0)
        if hero_count >= 2:
            score -= w["heroPenalty"] * 2
        if week_state["lastDayHero"] == hero:
            score -= w["heroPenalty"]

    # 7. Constraint bonus — рыба в пред. дни + овощи каждый день
    text = recipe_full_text(recipe)
    if (ALLERGEN_PATTERNS["fish"].search(text)
            and day_idx in HEALTH_CONSTRAINTS["fish"]["preferDays"]
            and slot == "dinner"):
        score += w["constraintBonus"]
    if ALLERGEN_PATTERNS["veggies"].search(text) and day_idx not in week_state["dayHasVeg"]:
        score += w["constraintBonus"] * 0.5

    # 8. Шум
    score += rng.random() * w["randomNoise"]

    return score


def register_use(state, recipe, day_idx):
    rid = recipe["id"]
    state["usedRecipeIds"][rid] = state["usedRecipeIds"].get(rid, 0) + 1

    hero = extract_hero(recipe)
    if hero:
        state["usedHeroes"][hero] = state["usedHeroes"].get(hero, 0) + 1
        state["lastDayHero"] = hero

    text = recipe_full_text(recipe)
    if ALLERGEN_PATTERNS["veggies"].search(text):
        state["dayHasVeg"].add(day_idx)


def compute_week_stats(week, prefs, is_batch):
    prefs = prefs or {}
    total_kcal = 0
    fish_days = 0
    veg_days = 0
    unique_ids = set()

    for d in week:
        total_kcal += d["dayKcal"]
        day_has_fish = False
        day_has_veg = False
        for m in d["meals"]:
            if m["recipe"]:
                unique_ids.add(m["recipe"].get("id"))
            text = recipe_full_text(m["recipe"])
            if ALLERGEN_PATTERNS["fish"].search(text):
                day_has_fish = True
            if ALLERGEN_PATTERNS["veggies"].search(text):
                day_has_veg = True
        if day_has_fish:
            fish_days += 1
        if day_has_veg:
            veg_days += 1

    avg_kcal = _round_half_up(total_kcal / 7)
    target_kcal = prefs.get("targetKcal") or 2000
    kcal_deviation = abs(avg_kcal - target_kcal) / target_kcal

    diversity_threshold = 5 if is_batch else 14

    return {
        "avgKcal": avg_kcal,
        "targetKcal": target_kcal,
        "kcalOk": kcal_deviation <= TOLERANCE["week"]["kcal"],
        "kcalDeviation": kcal_deviation,
        "fishCount": fish_days,
        "fishOk": fish_days >= HEALTH_CONSTRAINTS["fish"]["minPerWeek"],
        "vegDaysCount": veg_days,
        "vegOk": veg_days >= HEALTH_CONSTRAINTS["vegetables"]["minDaysWithVeg"],
        "uniqueRecipes": len(unique_ids),
        "diversityOk": len(unique_ids) >= diversity_threshold,
    }


# ═══════════════════════════════════════════════════════════════════════
# ХЕЛПЕРЫ
# ═══════════════════════════════════════════════════════════════════════
def recipe_kcal(recipe) -> float:
    if not recipe:
        return 0
    k = recipe.get("kcal")
    if isinstance(k, (int, float)) and not isinstance(k, bool):
        return k
    cal = recipe.get("calories")
    if isinstance(cal, (int, float)) and not isinstance(cal, bool):
        return cal
    raw = recipe.get("kcal") or recipe.get("calories") or "0"
    m = re.match(r"\s*([+-]?\d+)", str(raw))
    return int(m.group(1)) if m else 0


def recipe_full_text(recipe) -> str:
    if not recipe:
        return ""
    tags = " ".join(recipe.get("tags") or [])
    ings = " ".join(
        (i.get("n") or i.get("name") or "")
        for i in (recipe.get("ings") or recipe.get("ingredients") or [])
    )
    return f"{recipe.get('name') or ''} {tags} {ings} {recipe.get('desc') or ''} {recipe.get('category') or ''}".lower()


def extract_hero(recipe):
    text = recipe_full_text(recipe)
    for hero in HERO_INGREDIENTS:
        if hero in text:
            return hero[:5]
    return None


def detect_cuisine(recipe):
    text = recipe_full_text(recipe)
    for key, pattern in CUISINE_PATTERNS.items():
        if pattern.search(text):
            return key
    return None


def proximity(actual, target) -> float:
    """Линейная близость: 1.0 при равенстве, 0 при отклонении ≥ 30%."""
    if not target or not actual:
        return 0
    dev = abs(actual - target) / target
    return max(0, 1 - dev / 0.3)
