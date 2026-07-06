/**
 * src/utils/recipeVisual.js
 *
 * Подбор эмодзи + цвета фона для рецепта на основе его данных
 * (название, ингредиенты, теги, категория, тип приёма пищи).
 *
 * ─── ПРИНЦИПЫ ───────────────────────────────────────────────────────────────
 * 1. Бэк всегда в приоритете. Если у рецепта уже есть нормальный emoji
 *    (не пустой и не дженерик 🍽️), мы его НЕ трогаем. То же про bg_color.
 * 2. Подменяем только когда у бэка пусто или он отдал дженерик-плейсхолдер.
 * 3. Один эмодзи на рецепт (без композитов) — совместимо с текущим UI:
 *    RecipeCard, MealRow, RecipesView, SavedView, MenuView, BottomSheet.
 * 4. Чистая функция: без побочных эффектов, без зависимостей от Vue/Pinia.
 *
 * ─── ВАЖНОЕ ПРО REGEXP ──────────────────────────────────────────────────────
 * В JavaScript `\b` НЕ работает с кириллицей (кириллица не входит в \w).
 * Поэтому для границ слова используем явные lookbehind/lookahead:
 *   _B = (?<![а-яёa-z0-9])  — слева от стема нет «словесного» символа
 *   _E = (?![а-яёa-z0-9])   — справа от стема нет «словесного» символа
 * Lookbehind поддерживается в Chrome ≥ 62, Safari ≥ 16.4, Firefox ≥ 78,
 * Node ≥ 10 — для PWA в 2026 году универсально.
 *
 * ─── ИСПОЛЬЗОВАНИЕ ──────────────────────────────────────────────────────────
 *   import { augmentRecipeVisual } from '@/utils/recipeVisual'
 *
 *   recipes.value = data.map(r => augmentRecipeVisual({
 *     id: String(r.id),
 *     name: r.name,
 *     emoji: r.emoji,        // пусто или '🍽️' — будет дополнено
 *     bg: r.bg_color,        // пусто — будет дополнено
 *     // ...остальные поля
 *   }))
 */

// ─────────────────────────────────────────────────────────────────────────────
// ПАЛИТРА ФОНОВ ПО СЕМЕЙСТВАМ БЛЮД
// ─────────────────────────────────────────────────────────────────────────────
// Цвета согласованы с уже используемой в Onboarding.vue палитрой
// (зелёный = вег/салат, голубой = рыба/напитки, оранжевый = мясо/супы и т.д.).
const FAMILY_BG = {
    soup: '#FFF0E0',
    salad: '#E4F5EA',
    pasta: '#FFF5E0',
    pizza: '#FFE0E0',
    meat: '#FFE5D6',
    poultry: '#FFF5E0',
    fish: '#E3F2FD',
    seafood: '#E3F2FD',
    egg: '#FFF5E0',
    rice: '#FFF5E0',
    grain: '#FFF5E0',
    bread: '#F5E6D3',
    dumpling: '#FFF0E0',
    burger: '#FFE5D6',
    asian: '#EDE7F6',
    sushi: '#E3F2FD',
    mexican: '#FFE5D6',
    pancake: '#FFF5E0',
    dessert: '#FCE4EC',
    drink: '#E3F2FD',
    veg: '#E4F5EA',
    fruit: '#FCE4EC',
    default: '#E4F5EA',
}

// «Дженерик»-эмодзи, которые означают «бэк не смог подобрать» — их подменяем.
// В коде используются обе формы (с U+FE0F и без), см. RecipeCard, MealRow и т.д.
const GENERIC_EMOJI = new Set(['🍽️', '🍽'])

// ─────────────────────────────────────────────────────────────────────────────
// ХЕЛПЕР ДЛЯ ГРАНИЦ СЛОВА (КИРИЛЛИЦА-AWARE)
// ─────────────────────────────────────────────────────────────────────────────
const _B = '(?<![а-яёa-z0-9])'   // нет слова СЛЕВА от стема
const _E = '(?![а-яёa-z0-9])'    // нет слова СПРАВА от стема

// rx — строит RegExp из строки. Подставляет границы слова через __b__:
//   - префиксная (за __b__ сразу буква/группа) → _B
//   - суффиксная (после __b__ конец/'|'/')')   → _E
// Пример:  rx('__b__суп__b__|похлёбк')
//   → /(?<![а-яёa-z0-9])суп(?![а-яёa-z0-9])|похлёбк/
function rx(source) {
    const out = source.replace(/__b__/g, (match, offset, full) => {
        const next = full[offset + match.length]
        if (next === undefined || next === '|' || next === ')') return _E
        return _B
    })
    return new RegExp(out)
}

// ─────────────────────────────────────────────────────────────────────────────
// ШАБЛОНЫ ПОДБОРА (порядок ВАЖЕН — сверху более специфичные)
// ─────────────────────────────────────────────────────────────────────────────
// Каждое правило: { re, emoji, family }.
// re тестируется против haystack (нижний регистр):
//   name + title + tags + ingredients[].name + category + description.
const PATTERNS = [
    // ── ПИЦЦА (выше «теста», т.к. «тесто» встречается в ингредиентах)
    { re: /пицц/, emoji: '🍕', family: 'pizza' },
    { re: /кальцоне/, emoji: '🥟', family: 'pizza' },
    { re: /фокачч/, emoji: '🍞', family: 'bread' },

    // ── СУШИ / ЯПОНСКАЯ
    { re: rx('__b__суш[иеа]'), emoji: '🍣', family: 'sushi' },
    { re: rx('__b__ролл'), emoji: '🍣', family: 'sushi' },
    { re: /сашими|темаки|онигири/, emoji: '🍣', family: 'sushi' },
    { re: /бенто/, emoji: '🍱', family: 'sushi' },
    { re: rx('рамен|том\\s*ям|мисо|удон|__b__соба__b__'), emoji: '🍜', family: 'asian' },
    { re: rx('__b__пхо__b__|__b__фо__b__'), emoji: '🍜', family: 'asian' },
    { re: /пад\s*тай|стир-?фрай/, emoji: '🍜', family: 'asian' },

    // ── МЕКСИКАНСКАЯ
    { re: rx('такос|__b__тако__b__'), emoji: '🌮', family: 'mexican' },
    { re: /буррито|кесадилья/, emoji: '🌯', family: 'mexican' },
    { re: /шаурм|гирос|кебаб|донер/, emoji: '🌯', family: 'mexican' },
    { re: /начос|тортилья|гуакамоле/, emoji: '🌮', family: 'mexican' },
    { re: /фалафел/, emoji: '🧆', family: 'mexican' },
    { re: /хумус/, emoji: '🥙', family: 'mexican' },

    // ── БУРГЕРЫ / СЭНДВИЧИ
    { re: /бургер|чизбургер|гамбургер/, emoji: '🍔', family: 'burger' },
    { re: /сэндвич|сендвич/, emoji: '🥪', family: 'burger' },
    { re: /хот-?дог/, emoji: '🌭', family: 'burger' },
    { re: rx('__b__тост[ыа]?__b__'), emoji: '🍞', family: 'bread' },

    // ── СУПЫ
    { re: /борщ/, emoji: '🍲', family: 'soup' },
    { re: /харчо|солянк|шурп|лагман/, emoji: '🍲', family: 'soup' },
    { re: rx('__b__щи__b__'), emoji: '🥣', family: 'soup' },
    { re: /окрошк|свекольник|гаспачо|холодник/, emoji: '🥣', family: 'soup' },
    { re: rx('__b__уха__b__|__b__ух[иею]__b__'), emoji: '🥣', family: 'soup' },
    { re: /крем-?суп|суп-?пюре/, emoji: '🥣', family: 'soup' },
    { re: rx('__b__бульон'), emoji: '🥣', family: 'soup' },
    { re: rx('__b__суп[аыовe]?__b__|похл[её]бк'), emoji: '🍲', family: 'soup' },

    // ── ПАСТА
    { re: /карбонар|болоньез|альфред|маринара|путанеск/, emoji: '🍝', family: 'pasta' },
    { re: /лазань|каннелон|канелони/, emoji: '🍝', family: 'pasta' },
    { re: /спагетт|феттучин|тальятел|пенне|фарфалле|ригатон|ньокк/, emoji: '🍝', family: 'pasta' },
    { re: /равиол|тортеллини/, emoji: '🥟', family: 'pasta' },
    { re: rx('__b__паст[аыуоe]__b__|вермишел|макарон'), emoji: '🍝', family: 'pasta' },

    // ── РИС / КРУПЫ / ВОСТОЧНАЯ КУХНЯ
    { re: /ризотт/, emoji: '🍚', family: 'rice' },
    { re: /паэль/, emoji: '🥘', family: 'rice' },
    { re: rx('__b__плов__b__'), emoji: '🥘', family: 'rice' },
    { re: /бирьян/, emoji: '🍛', family: 'asian' },
    { re: rx('__b__карри__b__'), emoji: '🍛', family: 'asian' },
    { re: rx('__b__рис[аоумe]?__b__|рисов'), emoji: '🍚', family: 'rice' },
    { re: /гречк|перловк|кускус|булгур|киноа|пшённ|пшенн/, emoji: '🍚', family: 'grain' },

    // ── ПЕЛЬМЕНИ / ВАРЕНИКИ / ХАЧАПУРИ
    { re: /пельмен|вареник|хинкал|манты|чебурек|димсам|баоц|вонтон/, emoji: '🥟', family: 'dumpling' },
    { re: /хачапур/, emoji: '🫓', family: 'bread' },

    // ── САЛАТЫ
    { re: /цезар/, emoji: '🥗', family: 'salad' },
    { re: rx('__b__оливье'), emoji: '🥗', family: 'salad' },
    { re: rx('сель[дёе]?\\s*под\\s*шуб|__b__шуб[ае]__b__'), emoji: '🐟', family: 'fish' },
    { re: /винегрет/, emoji: '🥗', family: 'salad' },
    { re: /греческ/, emoji: '🥗', family: 'salad' },
    { re: /мимоз/, emoji: '🥗', family: 'salad' },
    { re: /крабов/, emoji: '🦀', family: 'seafood' },
    { re: rx('__b__салат'), emoji: '🥗', family: 'salad' },

    // ── ЯЙЦА / ОМЛЕТЫ
    { re: /яичниц|глазун/, emoji: '🍳', family: 'egg' },
    { re: /омлет|скр[ёе]мбл|фриттат|шакшук/, emoji: '🍳', family: 'egg' },
    { re: /бенедикт/, emoji: '🍳', family: 'egg' },

    // ── БЛИНЫ / ОЛАДЬИ / СЫРНИКИ / ЗАВТРАКИ
    { re: /блин|блинчик/, emoji: '🥞', family: 'pancake' },
    { re: /оладь|сырник/, emoji: '🥞', family: 'pancake' },
    { re: /панкейк|pancake/, emoji: '🥞', family: 'pancake' },
    { re: /вафл/, emoji: '🧇', family: 'pancake' },
    { re: rx('овсянк|__b__каш[аиуе]__b__|мюсл|гранол'), emoji: '🥣', family: 'grain' },
    { re: /йогурт/, emoji: '🥛', family: 'pancake' },
    { re: /смузи-?боул|смузи\s+боул/, emoji: '🥣', family: 'pancake' },

    // ── РЫБА (после «селёдки под шубой»)
    { re: /с[её]мг|лосось|форел|тунец|судак|треск|скумбри|сардин|щука|сель[дёе]|сел[её]дк|минтай|палтус/, emoji: '🐟', family: 'fish' },
    { re: rx('__b__карп[аоум]?__b__'), emoji: '🐟', family: 'fish' },
    { re: rx('__b__рыб'), emoji: '🐟', family: 'fish' },

    // ── МОРЕПРОДУКТЫ
    { re: /креветк/, emoji: '🦐', family: 'seafood' },
    { re: /кальмар/, emoji: '🦑', family: 'seafood' },
    { re: /мидии|устриц/, emoji: '🦪', family: 'seafood' },
    { re: /осьминог/, emoji: '🐙', family: 'seafood' },
    { re: rx('__b__краб|лобстер|омар'), emoji: '🦀', family: 'seafood' },
    { re: /морепродукт/, emoji: '🦐', family: 'seafood' },

    // ── МЯСО
    { re: /стейк|ростбиф|медальон/, emoji: '🥩', family: 'meat' },
    { re: /шашлык|люля/, emoji: '🍖', family: 'meat' },
    { re: /р[её]бр[аы]|р[её]брышк/, emoji: '🍖', family: 'meat' },
    { re: /бефстроганов|гуляш|жарк/, emoji: '🍖', family: 'meat' },
    { re: /котлет|тефтел|фрикадел/, emoji: '🍖', family: 'meat' },
    { re: /буженин|карбонад|вырезк|эскалоп|отбивн/, emoji: '🥩', family: 'meat' },
    { re: rx('__b__бекон|ветчин|колбас|сосиск|пастром'), emoji: '🥓', family: 'meat' },
    { re: rx('__b__говяд|__b__свин|телятин|баранин|кролик'), emoji: '🥩', family: 'meat' },
    { re: rx('__b__мяс'), emoji: '🍖', family: 'meat' },

    // ── ПТИЦА
    { re: /крыл/, emoji: '🍗', family: 'poultry' },
    { re: rx('курин|__b__куриц|грудк'), emoji: '🍗', family: 'poultry' },
    { re: /индейк|индюш/, emoji: '🍗', family: 'poultry' },
    { re: rx('__b__утк|__b__утин'), emoji: '🍗', family: 'poultry' },

    // ── ХЛЕБ И НЕСЛАДКАЯ ВЫПЕЧКА
    { re: /круассан/, emoji: '🥐', family: 'bread' },
    { re: /багет/, emoji: '🥖', family: 'bread' },
    { re: /бейгл|багел/, emoji: '🥯', family: 'bread' },
    { re: /крендел/, emoji: '🥨', family: 'bread' },
    { re: rx('__b__пит[аы]__b__|лаваш|тортилья'), emoji: '🫓', family: 'bread' },
    { re: rx('булочк|__b__булк'), emoji: '🍞', family: 'bread' },
    { re: rx('__b__хлеб'), emoji: '🍞', family: 'bread' },

    // ── ДЕСЕРТЫ И СЛАДКОЕ
    { re: /чизкейк|тирамису/, emoji: '🍰', family: 'dessert' },
    { re: rx('__b__торт__b__|тортик'), emoji: '🎂', family: 'dessert' },
    { re: /пирожн|маффин|кекс|капкейк/, emoji: '🧁', family: 'dessert' },
    { re: /эклер|профитрол|пончик|донат|donut/, emoji: '🍩', family: 'dessert' },
    { re: /мороженое|пломбир|сорбет|джелат/, emoji: '🍦', family: 'dessert' },
    { re: /шоколад|трюфел/, emoji: '🍫', family: 'dessert' },
    { re: /печень?е|cookie|меренг/, emoji: '🍪', family: 'dessert' },
    { re: rx('__b__мусс__b__|крем-?брюле|__b__желе__b__|пудинг|панна-?котт'), emoji: '🍮', family: 'dessert' },
    { re: /зефир|пастил|мармелад|карамел|конфет|нуга|халва/, emoji: '🍬', family: 'dessert' },
    { re: /штрудел|штрудль/, emoji: '🥧', family: 'dessert' },
    { re: rx('пирог|шарлотк|__b__тарт[аы]?__b__|клафути|__b__киш__b__'), emoji: '🥧', family: 'dessert' },

    // ── НАПИТКИ
    { re: /смузи/, emoji: '🥤', family: 'drink' },
    { re: /коктейл|мохито/, emoji: '🍹', family: 'drink' },
    { re: /лимонад/, emoji: '🥤', family: 'drink' },
    { re: rx('__b__сок__b__|свежевыжат'), emoji: '🧃', family: 'drink' },
    { re: rx('латте|капучин|эспрессо|__b__раф__b__|__b__кофе'), emoji: '☕', family: 'drink' },
    { re: rx('__b__ча[йяею]__b__|__b__матч[аи]__b__'), emoji: '🍵', family: 'drink' },
    { re: /какао/, emoji: '☕', family: 'drink' },
    { re: /глинтвейн|пунш|сангри/, emoji: '🍷', family: 'drink' },
    { re: /компот|морс|кисель/, emoji: '🥤', family: 'drink' },

    // ── ОВОЩИ / ГРИБЫ / КАРТОФЕЛЬ
    { re: /ратотуй|ratatouille/, emoji: '🥘', family: 'veg' },
    { re: rx('__b__рагу__b__'), emoji: '🍲', family: 'veg' },
    { re: rx('картоф|картошк|__b__пюре|драник'), emoji: '🥔', family: 'veg' },
    { re: /грибн|шампинь|боров|лисичк|опят|вешенк/, emoji: '🍄', family: 'veg' },
    { re: /кабачк|цукини|баклажан/, emoji: '🍆', family: 'veg' },
    { re: /томат|помидор/, emoji: '🍅', family: 'veg' },
    { re: /авокадо/, emoji: '🥑', family: 'veg' },
    { re: rx('__b__овощ'), emoji: '🥦', family: 'veg' },

    // ── ФРУКТЫ И ЯГОДЫ
    { re: /яблоч|яблок/, emoji: '🍎', family: 'fruit' },
    { re: /клубник|малин|черник|голубик|смородин|вишн|ягод/, emoji: '🍓', family: 'fruit' },
    { re: /банан/, emoji: '🍌', family: 'fruit' },
    { re: rx('апельсин|мандарин|__b__лимон|лайм'), emoji: '🍊', family: 'fruit' },
    { re: /виноград/, emoji: '🍇', family: 'fruit' },
    { re: rx('__b__фрукт'), emoji: '🍎', family: 'fruit' },

    // ── РАЗНОЕ
    { re: rx('__b__лапш'), emoji: '🍜', family: 'asian' },
    { re: rx('__b__сыр__b__|сырн'), emoji: '🧀', family: 'pancake' },
]

// Падение по категории, если шаблоны не сработали.
const CATEGORY_FALLBACK = {
    'напитки': { emoji: '🥤', family: 'drink' },
    'супы': { emoji: '🍲', family: 'soup' },
    'суп': { emoji: '🍲', family: 'soup' },
    'салаты': { emoji: '🥗', family: 'salad' },
    'салат': { emoji: '🥗', family: 'salad' },
    'завтраки': { emoji: '🥞', family: 'pancake' },
    'завтрак': { emoji: '🥞', family: 'pancake' },
    'горячее': { emoji: '🍖', family: 'meat' },
    'выпечка': { emoji: '🥐', family: 'bread' },
    'десерты': { emoji: '🍰', family: 'dessert' },
    'десерт': { emoji: '🍰', family: 'dessert' },
    'паста': { emoji: '🍝', family: 'pasta' },
    'рыба': { emoji: '🐟', family: 'fish' },
    'мясо': { emoji: '🥩', family: 'meat' },
    'птица': { emoji: '🍗', family: 'poultry' },
    'овощи': { emoji: '🥦', family: 'veg' },
    'каши': { emoji: '🥣', family: 'grain' },
    'снеки': { emoji: '🍿', family: 'default' },
    'перекус': { emoji: '🍎', family: 'fruit' },
}

// Падение по типу приёма пищи, если категории нет.
const MEAL_TYPE_FALLBACK = {
    breakfast: { emoji: '🥞', family: 'pancake' },
    lunch: { emoji: '🍲', family: 'soup' },
    dinner: { emoji: '🍖', family: 'meat' },
    snack: { emoji: '🍎', family: 'fruit' },
}

const FINAL_FALLBACK = { emoji: '🍽️', family: 'default' }

// ─────────────────────────────────────────────────────────────────────────────
// ВНУТРЕННЕЕ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Собирает строку «всё про рецепт» в нижнем регистре для regex-теста.
 * Поддерживает оба формата: внутренний (ings, name, desc) и сырой бэковский
 * (ingredients, title, description).
 */
function buildHaystack(recipe) {
    const parts = [
        recipe.name,
        recipe.title,
        recipe.desc,
        recipe.description,
        recipe.category,
        Array.isArray(recipe.tags) ? recipe.tags.join(' ') : '',
    ]

    const ings = recipe.ings || recipe.ingredients
    if (Array.isArray(ings)) {
        for (const ing of ings) {
            if (!ing) continue
            parts.push(ing.n || ing.name || '')
        }
    }

    return parts.filter(Boolean).join(' ').toLowerCase()
}

function findByPattern(haystack) {
    for (const p of PATTERNS) {
        if (p.re.test(haystack)) return { emoji: p.emoji, family: p.family }
    }
    return null
}

function findByCategory(recipe) {
    if (!recipe.category) return null
    const key = String(recipe.category).toLowerCase().trim()
    return CATEGORY_FALLBACK[key] || null
}

function findByMealType(recipe) {
    const t = recipe.type || recipe.meal_type
    return t ? (MEAL_TYPE_FALLBACK[t] || null) : null
}

// ─────────────────────────────────────────────────────────────────────────────
// ПУБЛИЧНОЕ API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Подбирает emoji + цветовое семейство для рецепта.
 * НЕ смотрит на recipe.emoji / recipe.bg — всегда вычисляет с нуля.
 *
 * @param {Object} recipe
 * @returns {{ emoji: string, family: string, bg: string }}
 */
export function pickRecipeVisual(recipe) {
    if (!recipe) return { ...FINAL_FALLBACK, bg: FAMILY_BG.default }

    const haystack = buildHaystack(recipe)
    const match =
        findByPattern(haystack) ||
        findByCategory(recipe) ||
        findByMealType(recipe) ||
        FINAL_FALLBACK

    return { emoji: match.emoji, family: match.family, bg: FAMILY_BG[match.family] }
}

/**
 * Безопасно обогащает рецепт визуальными полями.
 *
 *   - emoji  подменяется ТОЛЬКО если у бэка пусто или дженерик 🍽️ / 🍽
 *   - bg     подменяется ТОЛЬКО если у бэка пусто
 *
 * Если оба поля уже валидны — возвращает исходный объект без изменений
 * (т.е. для уже размеченных рецептов это no-op).
 *
 * @param {Object} recipe — рецепт после маппинга на внутренний формат
 *                          (поля emoji, bg, name, ings, category, type)
 * @returns {Object} новый объект с теми же полями, но с дополненными emoji/bg
 */
export function augmentRecipeVisual(recipe) {
    if (!recipe || typeof recipe !== 'object') return recipe

    const emojiIsGeneric = !recipe.emoji || GENERIC_EMOJI.has(recipe.emoji)
    const bgIsEmpty = !recipe.bg || (typeof recipe.bg === 'string' && !recipe.bg.trim())

    // Бэк отдал всё — выходим без аллокации
    if (!emojiIsGeneric && !bgIsEmpty) return recipe

    const visual = pickRecipeVisual(recipe)
    return {
        ...recipe,
        emoji: emojiIsGeneric ? visual.emoji : recipe.emoji,
        bg: bgIsEmpty ? visual.bg : recipe.bg,
    }
}

// Экспорт для тестов и отладки в консоли.
export const __internals = { PATTERNS, CATEGORY_FALLBACK, MEAL_TYPE_FALLBACK, FAMILY_BG, GENERIC_EMOJI }