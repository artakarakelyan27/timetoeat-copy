"""
Нормы и константы планирования питания — порт Front/src/utils/nutritionNorms.js (этап A).

Работает с recipe-view dict'ами, которые собирает menu_generator._recipe_view:
    { id, name, kcal, protein, fat, carbs, type, time, tags[list], ings[{n}],
      desc, category, servings }

Источники значений (для разработчика, в UI не показываются):
    • МР 2.3.1.0253-21 (Роспотребнадзор) — нормы энергии/веществ
    • СанПиН 2.3/2.4.3590-20 — питание детей
    • WHO Technical Report 916 — макронутриенты
"""

import re

# ── Взрослый эквивалент (Adult Equivalent) ──────────────────────────────
ADULT_EQUIVALENT = {
    "adult": 1.00,      # 18–59
    "teen": 1.00,       # 12–17
    "kid": 0.65,        # 7–11
    "kid_small": 0.40,  # 1–6
    "elderly": 0.85,    # 60+
}

# ── Распределение калорий по приёмам пищи ───────────────────────────────
MEAL_SPLIT = {
    "three": {"breakfast": 0.25, "lunch": 0.40, "dinner": 0.35},
    "four": {"breakfast": 0.25, "lunch": 0.35, "dinner": 0.30, "snack": 0.10},
}


def should_add_snack(prefs: dict | None) -> bool:
    """Включать ли 4-й приём (перекус)."""
    p = prefs or {}
    tags = p.get("familyTags") or {}
    if tags.get("kids_small"):
        return True
    if tags.get("kids"):
        return True
    if (p.get("targetKcal") or 0) > 2200:
        return True
    return False


# ── Допуски ─────────────────────────────────────────────────────────────
TOLERANCE = {
    "day": {"kcal": 0.10, "protein": 0.15, "fat": 0.15, "carbs": 0.15},
    "week": {"kcal": 0.05},
}

# ── Hard-constraints (Роспотребнадзор) ──────────────────────────────────
HEALTH_CONSTRAINTS = {
    "fish": {"minPerWeek": 2, "preferDays": [2, 4]},  # среда, пятница
    "vegetables": {"minDaysWithVeg": 5},
}

# ── Batch cooking (готовка на неделю по выходным) ───────────────────────
BATCH_PATTERNS = {
    "good": re.compile(
        r"(плов|рагу|тушён|тушен|жарко́е|жаркое|карри|чили|лазань|мусак|болоньез|подлив|солянк|борщ|щи|харчо|бефстрог|гуляш|запеканк|тефтел|ёжик|голубц|перц(ы)?\s*фарширован|долм|чахохбили|сациви|чанахи|оджахур|рассольник|шурп|лагман|холодец|студен|жульен|фрикасе|каперонад|казан|кускус|пшен(?:к|н)|перлов|гречн|рис(\s*с|\s*в|ов)|пюре|чакапул|капустн\s*рулет|мясн\s*рулет|курин\s*рулет|карбонад|пицц\s*на\s*противн|шницел|зраз|капустн|маринован|прованс|кишь|курица в|курица под|курица с)",
        re.IGNORECASE,
    ),
    "bad": re.compile(
        r"(салат|роллы|суши|сашими|тартар|карпачч|севиче|поке|боул(?!\s*кашей)|сэндвич|бутерброд|тост|омлет|глазун|яичниц|пашот|оладь|сырник|блин|вафл|смузи|молочн\s*коктейл|свежевыжат|свежезаварен|шашлык|стейк|жареная\s*рыб|жареная\s*грудк|жареные\s*яйц|свежий|свежая|свеже-|тёпл(ый|ая)\s*салат|тёпл(ая|ый)\s*закуск|закуск|нарезк|канапе|брускетт|круассан|хачапур|хинкал(?!и под)|чебурек|пельмен(?!и под|и в кастрюл|и с)|вареник(?!и в|и с)|пирожк|эклер|тирамису|чизкейк|мусс|желе|меренг|безе|капкейк|маффин|кекс|круг(?:лые)?\s*сырник|тарт(\s|$)|пицц(?!\s*на\s*противн)|пиц(?:а|у|е))",
        re.IGNORECASE,
    ),
}

BATCH_FRIENDLY_CATEGORIES = frozenset({
    "супы", "суп", "горячее", "мясо", "птица", "каши", "паста",
})

BATCH_UNFRIENDLY_CATEGORIES = frozenset({
    "салаты", "салат", "завтраки", "завтрак", "десерты", "десерт",
    "снеки", "перекус", "выпечка", "напитки",
})


def _recipe_batch_text(recipe: dict) -> str:
    """Собирает текст рецепта для regex-матчинга batch-пригодности."""
    if not recipe:
        return ""
    tags = " ".join(recipe.get("tags") or [])
    ings = " ".join((i.get("n") or i.get("name") or "") for i in (recipe.get("ings") or recipe.get("ingredients") or []))
    return f"{recipe.get('name') or ''} {tags} {ings} {recipe.get('desc') or ''} {recipe.get('category') or ''}".lower()


def is_batch_suitable(recipe: dict) -> bool:
    """Подходит ли рецепт для batch-cooking (готовится раз, хранится 4–5 дней)."""
    if not recipe:
        return False

    cat = str(recipe.get("category") or "").lower().strip()
    if cat in BATCH_UNFRIENDLY_CATEGORIES:
        return False

    text = _recipe_batch_text(recipe)
    if BATCH_PATTERNS["bad"].search(text):
        return False

    if cat in BATCH_FRIENDLY_CATEGORIES:
        return True
    if BATCH_PATTERNS["good"].search(text):
        return True

    t = recipe.get("type") or recipe.get("meal_type")
    if t in ("breakfast", "snack"):
        return False
    if t in ("lunch", "dinner"):
        return True

    return False


def is_batch_mode(prefs: dict | None) -> bool:
    """Включён ли batch-режим. Ключи 'once_week' (онбординг) и 'weekends' (профиль)."""
    p = prefs or {}
    f = p.get("cookFreq")
    return f == "once_week" or f == "weekends" or p.get("isBatchMode") is True


# ── Hero-ingredients (главные продукты-герои) ───────────────────────────
HERO_INGREDIENTS = [
    "курица", "курин", "индейк",
    "говядин", "говяж",
    "свинин", "свин",
    "рыб", "лосос", "тунец", "треск", "минтай", "сёмг", "семг", "форель",
    "фарш", "котлет",
    "творог", "творож",
    "яйц", "яиц",
]

# ── Веса скоринга ───────────────────────────────────────────────────────
SCORING_WEIGHTS = {
    "kcalProximity": 30,
    "proteinProximity": 10,
    "fatProximity": 10,
    "carbsProximity": 10,
    "liked": 25,
    "cuisineMatch": 15,
    "timePenalty": 20,
    "diversityPenalty": 30,
    "heroPenalty": 15,
    "constraintBonus": 25,
    "randomNoise": 5,
}

# ── Уровни смягчения фильтров ───────────────────────────────────────────
MIN_POOL_SIZE = 3

RELAXATION_LEVELS = [
    {"level": 0, "label": "все ограничения соблюдены", "drops": []},
    {"level": 1, "label": "увеличено время приготовления", "drops": ["cookTime"]},
    {"level": 2, "label": "расширены кулинарные предпочтения", "drops": ["cookTime", "cuisines"]},
    {"level": 3, "label": "смягчены нелюбимые продукты", "drops": ["cookTime", "cuisines", "dislikedProducts"]},
    {"level": 4, "label": "оставлены только аллергии и диета", "drops": ["cookTime", "cuisines", "dislikedProducts", "budget"]},
]

NEVER_RELAX = ["nuts", "lactose", "gluten", "seafood", "pork", "halal", "veg", "vegan"]

# ── Регексы текстового матчинга ─────────────────────────────────────────
ALLERGEN_PATTERNS = {
    "nuts": re.compile(r"(орех|миндал|фундук|кешью|арахис|пекан|фисташ|пралине|нугат)", re.IGNORECASE),
    "lactose": re.compile(r"(молок|сыр|творог|сметан|сливк|йогурт|кефир|ряженк|масло сливоч|сгущ)", re.IGNORECASE),
    "gluten": re.compile(r"(мука пшен|пшениц|хлеб|паст(ы|а|у)|макарон|лапш|сухар|булк|круассан|манка|кускус|булгур)", re.IGNORECASE),
    "seafood": re.compile(r"(креветк|кальмар|мидии|устриц|осьмин|морепродукт|краб|лангуст|омар|гребешк)", re.IGNORECASE),
    "pork": re.compile(r"(свинин|свиной|свиная|бекон|сал[ао]|шпик|корейк|карбонад|ветчин|буженин)", re.IGNORECASE),
    "halal": re.compile(r"(свинин|свиной|свиная|бекон|сал[ао]|вино|алкогол|конья|водк|пиво|шампанск|ром)", re.IGNORECASE),
    "meat": re.compile(r"(курица|курин|говядин|говяж|свинин|свиной|телятин|баранин|индейк|фарш мясн|бекон|ветчин|колбас|сосиск|шашлык|рыб|лосос|тунец|сёмг|семг|форель|треск|минтай|судак|щук|окун|карп|скумбри|сельд|креветк|кальмар|мидии|устриц|осьмин|морепродукт|краб|омар|гребешк)", re.IGNORECASE),
    "fish": re.compile(r"(рыб|лосос|тунец|сёмг|семг|форель|треск|минтай|судак|щук|окун|карп|скумбри|сельд)", re.IGNORECASE),
    "animal": re.compile(r"(курица|курин|говядин|свинин|телятин|баранин|индейк|фарш мясн|бекон|ветчин|колбас|сосиск|рыб|лосос|тунец|сёмг|форель|треск|минтай|креветк|кальмар|молок|сыр|творог|сметан|сливк|йогурт|кефир|яйц|яиц|мёд)", re.IGNORECASE),
    "veggies": re.compile(r"(салат|овощ|зелен|капуст|морков|помидор|огурц|перец|шпинат|брокколи|кабачк|баклажан|свёкл|тыкв|редис|сельдер|лук-порей)", re.IGNORECASE),
}

CUISINE_PATTERNS = {
    "italian": re.compile(r"(итальян|паст(ы|а|у)|пицц|ризотт|лазань|тирамису|равиол)", re.IGNORECASE),
    "russian": re.compile(r"(русск|борщ|щи|пельмен|оливье|селёдк|винегрет|сырник|блин|каш(а|и))", re.IGNORECASE),
    "asian": re.compile(r"(азиатск|японск|китайск|корейск|тайск|вьетнам|вок|суши|роллы|рамен|удон|том ям|пад тай|сёгу)", re.IGNORECASE),
    "caucasian": re.compile(r"(кавказ|грузин|армян|шашлык|хинкал|хачапур|долма|чахохбили|сациви|лобио)", re.IGNORECASE),
    "mediterranean": re.compile(r"(средиземн|греческ|испанск|оливк|паэль|табуле|хумус|фалафел)", re.IGNORECASE),
    "pp": re.compile(r"(пп|правильн|здоров|низкокалор|диетич|фитнес)", re.IGNORECASE),
    "fast": re.compile(r"(быстр|за\s*1[05]\s*мин|перекус|без готовки)", re.IGNORECASE),
}
