"""Сервис сопоставления «сырых» названий ингредиентов с каноническим справочником.

Каскад матчинга (4 уровня, от быстрого к медленному):
  1. Точное совпадение нормализованного имени или алиаса → 1.0
  2. Trigram similarity через rapidfuzz (token_set_ratio) → score/100
  3. LLM-fallback (claude-haiku) для нераспознанных — опционально
  Каждое найденное соответствие кэшируется в IngredientMatchCache.

Использование:
    matcher = FoodMatcher(db)
    canon_id, score = matcher.match("куриная грудка 400 г")
    # → (2001, 1.0) — точное совпадение по алиасу
"""

import re
import logging
from functools import lru_cache
from pathlib import Path

import yaml
from sqlalchemy.orm import Session

from app.models.canonical_food import CanonicalFood
from app.models.ingredient_match_cache import IngredientMatchCache

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Загрузка unit_aliases.yaml
# ──────────────────────────────────────────────
_UNIT_FILE = Path(__file__).resolve().parents[1] / "data" / "unit_aliases.yaml"

def _load_unit_aliases() -> dict[str, str]:
    with open(_UNIT_FILE, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("aliases", {})


UNIT_ALIASES: dict[str, str] = _load_unit_aliases()

# Паттерн для удаления количеств и единиц из строки
_UNITS_RE = re.compile(
    r"\d+[\.,]?\d*\s*("
    + "|".join(re.escape(u) for u in sorted(UNIT_ALIASES, key=len, reverse=True))
    + r"|г|кг|мл|л|шт\.?|ст\.?\s*л\.?|ч\.?\s*л\.?|стакан\w*|щепот\w*)"
    , re.IGNORECASE
)


# ──────────────────────────────────────────────
# Попытка подключить pymorphy3 (опционально)
# ──────────────────────────────────────────────
try:
    import pymorphy3  # type: ignore
    _morph = pymorphy3.MorphAnalyzer()

    def _lemmatize(word: str) -> str:
        return _morph.parse(word)[0].normal_form

except ImportError:
    logger.warning("pymorphy3 не найден — лемматизация отключена, матчинг менее точный.")

    def _lemmatize(word: str) -> str:
        return word


def normalize(text: str) -> str:
    """Нормализация строки для матчинга:
      - нижний регистр
      - удаление количеств и единиц (300 г, 2 шт)
      - удаление лишних символов
      - лемматизация каждого слова (если pymorphy3 доступен)
    """
    text = text.lower().strip()
    text = _UNITS_RE.sub(" ", text)
    text = re.sub(r"[^\wа-яёa-z ]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()
    words = [_lemmatize(w) for w in text.split()]
    return " ".join(words)


# ──────────────────────────────────────────────
# Основной класс матчера
# ──────────────────────────────────────────────

class FoodMatcher:
    """Инициализируется один раз и хранит индекс в памяти."""

    TRIGRAM_THRESHOLD = 75  # min score для rapidfuzz (0–100)

    def __init__(self, db: Session):
        self.db = db
        self._index: dict[str, int] = {}   # normalized_name → canonical_id
        self._id_map: dict[int, str] = {}  # canonical_id → canonical_name
        self._rebuild_index()

    # ──────────────────────────────────────────
    # Построение индекса
    # ──────────────────────────────────────────

    def _rebuild_index(self) -> None:
        """Строит {normalize(name_or_alias): canonical_id} по всей таблице."""
        self._index.clear()
        self._id_map.clear()
        foods = self.db.query(CanonicalFood).all()
        for food in foods:
            self._id_map[food.id] = food.name
            self._add_to_index(food.name, food.id)
            for alias in (food.aliases or []):
                self._add_to_index(alias, food.id)
        logger.debug(f"FoodMatcher: индекс построен, {len(self._index)} ключей")

    def _add_to_index(self, text: str, food_id: int) -> None:
        key = normalize(text)
        if key and key not in self._index:
            self._index[key] = food_id

    def rebuild(self) -> None:
        """Пересобрать индекс — вызывать после добавления новых записей в справочник."""
        self._rebuild_index()

    # ──────────────────────────────────────────
    # Главный метод
    # ──────────────────────────────────────────

    def match(
        self,
        raw_name: str,
        *,
        use_cache: bool = True,
        min_score: float = 0.70,
    ) -> tuple[int | None, float]:
        """Возвращает (canonical_food_id, confidence) или (None, 0.0).

        confidence:
          1.0  — точное совпадение
          <1.0 — trigram score (0..1)
          0.0  — не найдено
        """
        # ── Шаг 0: Кэш ────────────────────────────────────────────────
        if use_cache:
            cached = self._lookup_cache(raw_name)
            if cached is not None:
                return cached

        norm = normalize(raw_name)
        if not norm:
            return None, 0.0

        # ── Шаг 1: Точное совпадение ───────────────────────────────────
        if norm in self._index:
            food_id = self._index[norm]
            self._save_cache(raw_name, food_id, 1.0)
            return food_id, 1.0

        # ── Шаг 2: Trigram (rapidfuzz) ────────────────────────────────
        try:
            from rapidfuzz import process, fuzz  # type: ignore
            result = process.extractOne(
                norm,
                list(self._index.keys()),
                scorer=fuzz.token_set_ratio,
                score_cutoff=self.TRIGRAM_THRESHOLD,
            )
            if result:
                matched_key, score, _ = result
                confidence = round(score / 100, 3)
                food_id = self._index[matched_key]
                logger.debug(
                    f"Trigram match: {raw_name!r} → {self._id_map.get(food_id)!r} "
                    f"(score={score})"
                )
                self._save_cache(raw_name, food_id, confidence)
                return food_id, confidence
        except ImportError:
            logger.warning("rapidfuzz не установлен — trigram-матчинг отключён")

        # ── Шаг 3: Не найдено ─────────────────────────────────────────
        self._save_cache(raw_name, None, 0.0)
        return None, 0.0

    # ──────────────────────────────────────────
    # Batch-матчинг (для прогона по базе рецептов)
    # ──────────────────────────────────────────

    def match_many(
        self, raw_names: list[str]
    ) -> dict[str, tuple[int | None, float]]:
        """Матчинг нескольких строк. Возвращает {raw_name: (id, score)}."""
        return {name: self.match(name) for name in raw_names}

    # ──────────────────────────────────────────
    # Управление справочником
    # ──────────────────────────────────────────

    def add_food(
        self,
        *,
        name: str,
        aliases: list[str] | None = None,
        category: str = "прочее",
        base_unit: str = "g",
        **kwargs,
    ) -> CanonicalFood:
        """Добавить новую запись в справочник и обновить индекс.

        ID выбирается автоматически как max(id_in_category) + 1.
        Категориям соответствуют диапазоны:
          молочные продукты  → 1xxx
          мясо и рыба        → 2xxx
          овощи              → 3xxx
          фрукты и ягоды     → 4xxx
          бакалея            → 5xxx
          консервы           → 6xxx
          специи и соусы     → 7xxx
          хлеб и выпечка     → 8xxx
          напитки            → 9xxx
          прочее             → 9900+
        """
        cat_start = CATEGORY_RANGES.get(category, 9900)
        cat_end = cat_start + 999

        max_id_row = (
            self.db.query(CanonicalFood.id)
            .filter(CanonicalFood.id >= cat_start, CanonicalFood.id <= cat_end)
            .order_by(CanonicalFood.id.desc())
            .first()
        )
        new_id = (max_id_row[0] + 1) if max_id_row else cat_start + 1

        food = CanonicalFood(
            id=new_id,
            name=name,
            aliases=aliases or [],
            category=category,
            base_unit=base_unit,
            **kwargs,
        )
        self.db.add(food)
        self.db.commit()
        self.db.refresh(food)

        # Обновить индекс
        self._id_map[food.id] = food.name
        self._add_to_index(food.name, food.id)
        for alias in (food.aliases or []):
            self._add_to_index(alias, food.id)

        logger.info(f"Добавлен новый продукт: id={food.id} name={food.name!r}")
        return food

    # ──────────────────────────────────────────
    # Кэш совпадений
    # ──────────────────────────────────────────

    def _lookup_cache(self, raw_name: str) -> tuple[int | None, float] | None:
        row = (
            self.db.query(IngredientMatchCache)
            .filter(IngredientMatchCache.raw_name == raw_name)
            .first()
        )
        if row is None:
            return None
        return row.canonical_food_id, row.confidence

    def _save_cache(
        self, raw_name: str, food_id: int | None, confidence: float
    ) -> None:
        existing = (
            self.db.query(IngredientMatchCache)
            .filter(IngredientMatchCache.raw_name == raw_name)
            .first()
        )
        if existing:
            existing.canonical_food_id = food_id
            existing.confidence = confidence
        else:
            self.db.add(
                IngredientMatchCache(
                    raw_name=raw_name,
                    canonical_food_id=food_id,
                    confidence=confidence,
                )
            )
        self.db.commit()


# ──────────────────────────────────────────────
# Маппинг категорий → начальный ID диапазона
# ──────────────────────────────────────────────

CATEGORY_RANGES: dict[str, int] = {
    "молочные продукты": 1000,
    "мясо и рыба": 2000,
    "овощи": 3000,
    "фрукты и ягоды": 4000,
    "бакалея": 5000,
    "консервы": 6000,
    "специи и соусы": 7000,
    "хлеб и выпечка": 8000,
    "напитки": 9000,
    "прочее": 9900,
}
