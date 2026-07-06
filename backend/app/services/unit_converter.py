"""Конвертация единиц измерения к базовой единице продукта.

Используется при агрегации списка покупок:
  «1 стакан муки» + «200 г муки» → «450 г муки» (250мл * 0.6 г/мл + 200г)
"""

from pathlib import Path

import yaml

from app.models.canonical_food import CanonicalFood

_UNIT_FILE = Path(__file__).resolve().parents[1] / "data" / "unit_aliases.yaml"

with open(_UNIT_FILE, encoding="utf-8") as _f:
    _UNIT_DATA = yaml.safe_load(_f)

UNIT_ALIASES: dict[str, str] = _UNIT_DATA.get("aliases", {})
_CONV = _UNIT_DATA.get("conversions", {})

# Объёмные меры в миллилитрах
_VOL_ML = {
    "cup": float(_CONV.get("cup_ml", 250)),
    "tbsp": float(_CONV.get("tbsp_ml", 15)),
    "tsp": float(_CONV.get("tsp_ml", 5)),
}


def normalize_unit(unit: str) -> str:
    """Нормализует единицу к стандартному обозначению."""
    return UNIT_ALIASES.get(unit.lower().strip(), unit.lower().strip())


def to_base_units(
    amount: float,
    unit: str,
    food: CanonicalFood,
) -> float:
    """Конвертирует amount в base_unit продукта.

    Бросает ValueError если конвертация невозможна без данных о продукте.

    Примеры:
        to_base_units(0.5, "кг", food_мука)  → 500.0  (g)
        to_base_units(2, "шт", food_яйцо)   → 120.0  (g, piece_weight_g=60)
        to_base_units(1, "стакан", food_мука)→ 150.0  (g, density=0.6)
    """
    unit = normalize_unit(unit)
    base = food.base_unit

    # ── Прямое совпадение ─────────────────────────────────────────────
    if unit == base:
        return amount

    # ── Масса: кг → г ────────────────────────────────────────────────
    if unit == "kg" and base == "g":
        return amount * 1000.0
    if unit == "g" and base == "g":
        return amount

    # ── Объём: л → мл ───────────────────────────────────────────────
    if unit == "l" and base == "ml":
        return amount * 1000.0
    if unit == "ml" and base == "ml":
        return amount

    # ── Штуки → граммы ───────────────────────────────────────────────
    if unit == "piece" and base == "g":
        if food.piece_weight_g:
            return amount * food.piece_weight_g
        raise ValueError(
            f"Не могу конвертировать {amount} шт → г: "
            f"piece_weight_g не задан для «{food.name}»"
        )

    # ── Объёмные меры → граммы (через density) ───────────────────────
    if unit in _VOL_ML and base == "g":
        if food.density_g_per_ml:
            return amount * _VOL_ML[unit] * food.density_g_per_ml
        raise ValueError(
            f"Не могу конвертировать {amount} {unit} → г: "
            f"density_g_per_ml не задан для «{food.name}»"
        )

    # ── Объёмные меры → мл ───────────────────────────────────────────
    if unit in _VOL_ML and base == "ml":
        return amount * _VOL_ML[unit]

    raise ValueError(
        f"Нет правила конвертации: {amount} {unit!r} → {base!r} "
        f"для «{food.name}»"
    )


def try_to_base_units(
    amount: float,
    unit: str,
    food: CanonicalFood,
) -> tuple[float | None, str]:
    """Безопасная обёртка. Возвращает (value, base_unit) или (None, original_unit)."""
    try:
        return to_base_units(amount, unit, food), food.base_unit
    except (ValueError, TypeError):
        return None, unit
