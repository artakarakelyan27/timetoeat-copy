import sys, os, json, argparse
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
import app.models
Base.metadata.create_all(bind=engine)
from app.models.recipe import Recipe, Ingredient

CATEGORY_TO_MEAL_TYPE = {
    'завтраки':'breakfast','завтрак':'breakfast','каши':'breakfast','омлеты':'breakfast',
    'супы':'lunch','борщи':'lunch','салаты':'lunch','закуски':'lunch','первые блюда':'lunch',
    'вторые блюда':'dinner','горячее':'dinner','паста':'dinner','пицца':'dinner',
    'мясо':'dinner','птица':'dinner','рыба':'dinner','морепродукты':'dinner',
    'овощи':'dinner','грибы':'dinner',
    'десерты':'snack','выпечка':'snack','торты':'snack','напитки':'snack',
}
EMOJI = {
    'завтраки':'🥞','завтрак':'🥞','каши':'🥣','супы':'🍲','борщи':'🍲',
    'салаты':'🥗','вторые блюда':'🍖','горячее':'🍖','паста':'🍝','пицца':'🍕',
    'мясо':'🥩','птица':'🍗','рыба':'🐟','десерты':'🍰','выпечка':'🥐','напитки':'🥤',
}
BG = {
    'завтраки':'#FFF5E0','завтрак':'#FFF5E0','каши':'#FFF5E0',
    'супы':'#FFF0E0','борщи':'#FFF0E0','салаты':'#E4F5EA','овощи':'#E4F5EA',
    'вторые блюда':'#FFF0E0','горячее':'#FFF0E0','паста':'#E4F5EA',
    'мясо':'#FFF0E0','птица':'#FFF5E0','рыба':'#E3F2FD',
    'десерты':'#FCE4EC','выпечка':'#FFF5E0','напитки':'#E3F2FD',
}
ING_CAT = {
    'молок':'🥛 Молочное','сметан':'🥛 Молочное','сыр':'🥛 Молочное','йогурт':'🥛 Молочное',
    'кефир':'🥛 Молочное','масло слив':'🥛 Молочное','яйц':'🥛 Молочное','творог':'🥛 Молочное',
    'говядин':'🥩 Мясо','свинин':'🥩 Мясо','фарш':'🥩 Мясо','бекон':'🥩 Мясо',
    'курин':'🍗 Птица','индейк':'🍗 Птица',
    'рыб':'🐟 Рыба','сёмга':'🐟 Рыба','лосос':'🐟 Рыба','креветк':'🐟 Рыба',
    'картофел':'🥦 Овощи','картошк':'🥦 Овощи','морковь':'🥦 Овощи','лук':'🥦 Овощи',
    'чеснок':'🥦 Овощи','помидор':'🥦 Овощи','огурц':'🥦 Овощи','капуст':'🥦 Овощи',
    'свекл':'🥦 Овощи','гриб':'🥦 Овощи','шампиньон':'🥦 Овощи',
    'мука':'🌾 Бакалея','рис':'🌾 Бакалея','макарон':'🌾 Бакалея','спагетт':'🌾 Бакалея',
    'хлеб':'🌾 Бакалея','сахар':'🌾 Бакалея','масло раст':'🌾 Бакалея','масло олив':'🌾 Бакалея',
    'соль':'🧂 Специи','перец':'🧂 Специи',
}

def ing_cat(name):
    n = name.lower()
    for k, v in ING_CAT.items():
        if k in n: return v
    return '📦 Прочее'

def map_r(d):
    cat = (d.get('category') or '').lower().strip()
    if not d.get('ingredients') or not d.get('steps'): return None
    qty = lambda i: f"{i['amount']:g} {i['unit']}".strip() if i.get('amount') else (i.get('unit') or '')
    return {
        'slug': d['id'], 'name': d['title'],
        'emoji': EMOJI.get(cat,'🍽️'), 'bg_color': BG.get(cat,'#E4F5EA'),
        'description': d.get('description',''), 'meal_type': CATEGORY_TO_MEAL_TYPE.get(cat,'dinner'),
        'cuisine': d.get('cuisine',''), 'time_minutes': d.get('total_time_min'),
        'kcal': int(d['calories']) if d.get('calories') else None,
        'proteins': d.get('protein'), 'fats': d.get('fat'), 'carbs': d.get('carbs'),
        'is_vegetarian': 'vegetarian' in (d.get('diet_tags') or []),
        'is_fast': (d.get('total_time_min') or 999) <= 30,
        'is_gluten_free': 'gluten-free' in (d.get('diet_tags') or []),
        'is_lactose_free': 'lactose-free' in (d.get('diet_tags') or []),
        'steps': d.get('steps',[]), 'image_url': d.get('image_url'),
        'ingredients': [{'name':i['name'],'quantity':qty(i),'category':ing_cat(i['name'])} for i in d['ingredients']],
    }

def run(folder, limit):
    files = [f for f in os.listdir(folder) if f.endswith('.json')][:limit]
    print(f"Файлов: {len(files)}, импортируем...")
    db = SessionLocal()
    try:
        existing = set(r.slug for r in db.query(Recipe.slug).all())
        added = skipped = errors = 0
        for i, fname in enumerate(files):
            if i % 500 == 0: print(f"  {i}/{len(files)} ({added} добавлено)")
            try:
                with open(os.path.join(folder, fname), encoding='utf-8') as f:
                    d = json.load(f)
                if d['id'] in existing: skipped += 1; continue
                m = map_r(d)
                if not m: skipped += 1; continue
                ings = m.pop('ingredients')
                r = Recipe(**m)
                db.add(r); db.flush()
                for o, ing in enumerate(ings): db.add(Ingredient(recipe_id=r.id, order=o, **ing))
                existing.add(d['id']); added += 1
                if added % 100 == 0: db.commit()
            except Exception as e:
                errors += 1
                if errors <= 3: print(f"  Ошибка {fname}: {e}")
        db.commit()
        print(f"\n✓ Добавлено: {added}, пропущено: {skipped}, ошибок: {errors}")
    finally:
        db.close()

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('folder')
    p.add_argument('--limit', type=int, default=9000)
    a = p.parse_args()
    run(a.folder, a.limit)
