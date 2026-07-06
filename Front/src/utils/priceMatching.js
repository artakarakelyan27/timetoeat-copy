/**
 * src/utils/priceMatching.js
 * ─────────────────────────────────────────────────────────────────────
 * Валидация магазинных матчей и пересчёт цены под нужное количество.
 *
 * v2 — ужесточение проверки матчей:
 *   • Категориальная проверка по ПЕРВЫМ 2 СЛОВАМ названия товара
 *     (отсекает «Майонез ... перепелиное яйцо» при ингредиенте «яйцо»,
 *     «Снекиты со вкусом сметана» при ингредиенте «сметана» и т.п. —
 *     случаи, когда ингредиент стоит во вкусовом описателе).
 *   • Расширенный blacklist первого слова (чипсы, снекиты, пирог,
 *     пирожок, котлеты, конфеты — типовые «не-ингредиенты»).
 *   • Простая лемматизация (стемминг) для матчинга словоформ:
 *       яйцо/яйца/яиц    → «яйц»
 *       куриное/курица   → «кури»
 *       картофель/картошка → «карт» (через таблицу синонимов)
 *
 * АЛГОРИТМ (по ТЗ):
 *   1) Проверить название товара и подобрать к ингредиенту рецепта
 *      (validateProductMatch — три уровня проверок).
 *   2) Сравнить количество в рецепте и привести к расфасовке товара
 *      (parseQuantityToBase + computeAdjustedPrice).
 *   3) Только после этого отображать цену с учётом количества.
 *
 * Используется из:
 *   • stores/menuStore.js — enrichShopItemsWithPrices, updateShopItem
 */

import { categorize, FALLBACK_CAT } from './categorize.js'

// ─────────────────────────────────────────────────────────────────────
// 0. НОРМАЛИЗАЦИЯ ИНГРЕДИЕНТОВ
// ─────────────────────────────────────────────────────────────────────

/**
 * Каноническая форма ингредиента — одна строка для всех словоформ и
 * бытовых синонимов одного и того же продукта.
 *
 * Используется ПЕРЕД отправкой запроса в /products/match-batch:
 * у бэка больше шансов найти товар в каталоге по канонической форме,
 * чем по словоформе («Яйца» зачастую ничего не найдёт; «куриное яйцо»
 * найдёт «Куриное яйцо CO 10 шт»).
 *
 * НЕ ТРОГАЕТ имя, отображаемое пользователю — то остаётся таким, как
 * в рецепте. Нормализация — чисто транспортная.
 *
 * Список консервативный: только однозначные синонимы. «Перепелиное
 * яйцо» НЕ нормализуется в куриное (разные виды), «зелёный лук» НЕ
 * нормализуется в репчатый и т.п.
 */
const NORMALIZATION_PATTERNS = [
  // Куриное яйцо: «яйца», «яйцо», «куриное яйцо» → одно и то же
  [/^(?:куриное\s+)?яйц[оаеу]?$/i,                             'куриное яйцо'],
  [/^(?:белок|желток)(?:\s+куриного\s+яйц[аыо])?$/i,          'куриное яйцо'],
  [/^яичный\s+(?:белок|желток)$/i,                             'куриное яйцо'],
  // Картофель / картошка
  [/^картошк[аиу]?$/i,                                          'картофель'],
  // Помидор / помидоры / томаты
  [/^помидор(?:ы|а|чик[аи]?)?$/i,                              'томат'],
]

/**
 * Возвращает каноническое имя ингредиента (для запроса к магазину).
 * Если не нашли точного паттерна — возвращает trimmed оригинал.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeIngredientName(name) {
  if (!name) return name
  const trimmed = String(name).trim()
  for (const [re, canonical] of NORMALIZATION_PATTERNS) {
    if (re.test(trimmed)) return canonical
  }
  return trimmed
}

// ─────────────────────────────────────────────────────────────────────
// 1. ВАЛИДАЦИЯ МАТЧА
// ─────────────────────────────────────────────────────────────────────

/**
 * Слова, которые в начале названия товара означают «это снэк / выпечка
 * / десерт / готовое блюдо», а НЕ сырой ингредиент. Если первое слово
 * товара здесь, и ингредиент сам не содержит это слово — матч считается
 * ошибочным («бекон в чипсах ≠ бекон»).
 */
const NON_INGREDIENT_HEAD_WORDS = new Set([
  // Снэки и сухие закуски
  'чипсы', 'снеки', 'снек', 'снекиты',
  'сухарики', 'сушки', 'попкорн',
  'крекеры', 'крекер', 'хлебцы', 'кириешки',
  // Выпечка / пироги / готовые блюда из теста
  'пирог', 'пироги', 'пирожок', 'пирожки', 'пицца',
  'булочка', 'булочки', 'кекс', 'торт', 'печенье',
  'круассан', 'круассаны', 'багет', 'хачапури',
  'чебурек', 'чебуреки', 'самса', 'самосы',
  // Сладости и десерты
  'конфеты', 'конфета', 'мороженое', 'мармелад', 'зефир',
  'халва', 'нуга', 'десерт', 'вафли', 'вафля',
  'пастила', 'козинаки', 'батончик', 'батончики',
  // Полуфабрикаты и готовые блюда
  'пельмени', 'вареники', 'хинкали', 'манты',
  'котлеты', 'котлета', 'наггетсы', 'нагетсы',
  'голубцы', 'фрикадельки', 'тефтели',
  'шашлык', 'шаурма', 'бургер', 'бургеры', 'роллы',
  'суши', 'сэндвич', 'сэндвичи',
])

/**
 * Канонизация «бытовых» синонимов: разные слова, обозначающие один и
 * тот же продукт. Применяется при стемминге, чтобы рецептный
 * «картофель» матчился с товарным «картошка молодая».
 */
const SYNONYMS = new Map([
  ['картошка',   'картофель'],
  ['картошки',   'картофель'],
  ['картошку',   'картофель'],
  ['картошкой',  'картофель'],
  ['помидор',    'томат'],
  ['помидоры',   'томат'],
  ['помидорчик', 'томат'],
  ['помидорчики','томат'],
  ['свекла',     'свёкла'],
  ['курочка',    'курица'],
  ['курочки',    'курица'],
  ['курочку',    'курица'],
])

/**
 * Разбивает строку на токены (слова), приведённые к нижнему регистру.
 */
function tokenize(s) {
  if (!s) return []
  return String(s)
      .toLowerCase()
      .replace(/[/(),.%]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
}

/**
 * Простая лемматизация: канонизирует слово до короткого «стема», который
 * будет одинаковым у разных словоформ.
 *
 * Шаги:
 *   1) lower-case + удаление не-буквенных символов;
 *   2) подстановка из таблицы SYNONYMS, если слово известный синоним;
 *   3) обрезка до min(4, len-1) символов, но не короче 3.
 *
 * Примеры:
 *   яйцо → «яйц», яйца → «яйц», яиц → «яиц»
 *   куриное → «кури», курица → «кури», курин → «кури»
 *   картофель → «карт» (4 символа из 9)
 *   картошка → канон «картофель» → «карт»
 *   помидоры → канон «томат» → «тома»
 */
function stem(word) {
  if (!word) return ''
  let w = String(word).toLowerCase().replace(/[^а-яёa-z0-9]/g, '')
  if (!w) return ''
  if (SYNONYMS.has(w)) w = SYNONYMS.get(w)
  if (w.length <= 3) return w
  const len = Math.min(4, w.length - 1)
  return w.slice(0, Math.max(3, len))
}

/**
 * Возвращает «значащие» стемы из строки — слова длиной ≥ 4 символа
 * (короткие предлоги и связки отбрасываем).
 */
function meaningfulStems(s) {
  return tokenize(s)
      .filter(w => w.length >= 4)
      .map(stem)
      .filter(Boolean)
}

/**
 * Проверяет, что предложенный магазином товар реально соответствует
 * нужному ингредиенту.
 *
 * Три уровня проверок (любая отсекает плохой матч):
 *
 *   1) Blacklist первого слова товара. Чипсы, снекиты, пироги,
 *      котлеты, конфеты и т.п. почти никогда не выступают в роли
 *      сырого ингредиента. Если первое слово в blacklist'е и
 *      ингредиент сам не содержит это слово — отбрасываем.
 *
 *   2) Категориальная проверка. Категория ингредиента определяется
 *      по полному названию, категория «головы» товара — по ПЕРВЫМ 2
 *      СЛОВАМ. Это режет случаи, когда ингредиент фигурирует во
 *      вкусовом дескрипторе:
 *         «Майонез Провансаль ... перепелиное яйцо» → голова
 *         «майонез провансаль» → Масла и соусы ≠ Яйца → отказ.
 *
 *   3) Стеммерная проверка. Хотя бы один значащий стем ингредиента
 *      должен встретиться в первых 4 словах названия товара. Стемминг
 *      покрывает словоформы (яйцо/яйца, куриное/курица) и канонизирует
 *      синонимы (помидор → томат, картошка → картофель).
 *
 * @param {string} ingredientName
 * @param {string} productName
 * @returns {boolean} true если матч валиден
 */
export function validateProductMatch(ingredientName, productName) {
  if (!ingredientName || !productName) return false

  const ingLower = ingredientName.toLowerCase()
  const prodTokens = tokenize(productName)
  if (prodTokens.length === 0) return false

  // ─── 1) Blacklist в первых 3 словах товара ────────────────────────
  // Маркер «не-ингредиента» (десерт, чипсы, снекиты, пирожок, конфеты…)
  // может стоять не только первым словом, но и вторым/третьим:
  //   «Творожный ДЕСЕРТ Danissimo» — маркер на 2-й позиции
  //   «Со вкусом ЧИПСОВ ...»       — на 3-й
  // Поэтому сканируем первые 3 слова. Если ингредиент сам содержит
  // маркер (напр. ингредиент «Шоколад» + товар «Шоколад Алёнка»),
  // не отбрасываем.
  const headBlacklisted = prodTokens
      .slice(0, 3)
      .find(w => NON_INGREDIENT_HEAD_WORDS.has(w))
  if (headBlacklisted && !ingLower.includes(headBlacklisted)) {
    return false
  }

  // ─── 2) Категориальная проверка (по первым 2 словам товара) ──────
  // Проверка срабатывает ТОЛЬКО когда обе категории известны (≠ Прочее).
  // Если категория головы товара неизвестна — пропускаем эту проверку и
  // полагаемся на blacklist + стеммер. Иначе отвергнем валидные «Курочка
  // деревенская» при ингредиенте «Куриная грудка», т.к. слово «курочка»
  // не входит в регулярки categorize().
  const ingCat = categorize(ingredientName)
  const headCat = categorize(prodTokens.slice(0, 2).join(' '))

  if (ingCat !== FALLBACK_CAT && headCat !== FALLBACK_CAT && headCat !== ingCat) {
    return false
  }

  // ─── 3) Стеммерная проверка токенов ───────────────────────────────
  const ingStems = meaningfulStems(ingredientName)
  if (ingStems.length === 0) return true   // короткие имена («соль», «чай»)

  const headStems = prodTokens.slice(0, 4)
      .filter(w => w.length >= 4)
      .map(stem)
      .filter(Boolean)

  const stemMatched = ingStems.some(s => headStems.includes(s))
  if (!stemMatched) return false

  return true
}

// ─────────────────────────────────────────────────────────────────────
// 2. ПАРСИНГ КОЛИЧЕСТВ И БАЗОВЫЕ ЕДИНИЦЫ
// ─────────────────────────────────────────────────────────────────────

/**
 * Карта единиц измерения → базовая единица того же типа.
 *   type: 'mass'   — база грамм
 *   type: 'volume' — база миллилитр
 *   type: 'count'  — база штука
 */
const UNIT_MAP = {
  // Масса
  'г':       { type: 'mass',   factor: 1 },
  'гр':      { type: 'mass',   factor: 1 },
  'грамм':   { type: 'mass',   factor: 1 },
  'грамма':  { type: 'mass',   factor: 1 },
  'граммов': { type: 'mass',   factor: 1 },
  'кг':      { type: 'mass',   factor: 1000 },
  'килограмм':  { type: 'mass', factor: 1000 },
  'килограмма': { type: 'mass', factor: 1000 },
  'кило':    { type: 'mass',   factor: 1000 },
  // Объём
  'мл':         { type: 'volume', factor: 1 },
  'миллилитр':  { type: 'volume', factor: 1 },
  'л':          { type: 'volume', factor: 1000 },
  'литр':       { type: 'volume', factor: 1000 },
  'литра':      { type: 'volume', factor: 1000 },
  'литров':     { type: 'volume', factor: 1000 },
  // Штучные
  'шт':      { type: 'count', factor: 1 },
  'шт.':     { type: 'count', factor: 1 },
  'штук':    { type: 'count', factor: 1 },
  'штука':   { type: 'count', factor: 1 },
  'штуки':   { type: 'count', factor: 1 },
  'штуку':   { type: 'count', factor: 1 },
  // Упаковка считается за штуку
  'уп':      { type: 'count', factor: 1 },
  'уп.':     { type: 'count', factor: 1 },
  'упаковка':{ type: 'count', factor: 1 },
}

function normalizeUnit(unit) {
  return String(unit || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
}

/**
 * Парсит строку количества в базовые единицы. Поддерживает «+»-сложение:
 *   «4 шт + 8 шт + 4 шт.» → { type: 'count', value: 16 }
 *   «300 г»               → { type: 'mass',  value: 300 }
 *   «1.5 кг»              → { type: 'mass',  value: 1500 }
 *   «по вкусу»            → null
 *
 * @param {string} qStr
 * @returns {{ type: 'mass'|'volume'|'count', value: number } | null}
 */
export function parseQuantityToBase(qStr) {
  if (!qStr) return null
  const parts = String(qStr).split(/\s*\+\s*/)
  let result = null
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^([\d.,/]+)\s*(.*)$/)
    if (!m) continue
    let num
    if (m[1].includes('/')) {
      const [a, b] = m[1].split('/').map(s => parseFloat(s.replace(',', '.')))
      num = (isFinite(a) && isFinite(b) && b !== 0) ? a / b : NaN
    } else {
      num = parseFloat(m[1].replace(',', '.'))
    }
    if (!isFinite(num) || num <= 0) continue

    const unitRaw = normalizeUnit(m[2]) || 'шт'
    const map = UNIT_MAP[unitRaw]
    if (!map) continue

    if (result === null) {
      result = { type: map.type, value: num * map.factor }
    } else if (result.type === map.type) {
      result.value += num * map.factor
    }
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────
// 3. РАСЧЁТ ЦЕНЫ С УЧЁТОМ КОЛИЧЕСТВА
// ─────────────────────────────────────────────────────────────────────

/**
 * Считает фактическую стоимость нужного количества продукта.
 *
 * @param {string} itemQ — количество из рецепта (например «160 г»)
 * @param {{
 *   price: number,
 *   package_size?: number,
 *   package_unit?: string,
 * }} storeProduct
 *
 * @returns {{ totalPrice: number, packagesNeeded: number } | null}
 *
 * Поведение:
 *   • Нет цены → null.
 *   • Нет данных о расфасовке → одна упаковка по цене.
 *   • Не парсится нужное количество → одна упаковка по цене.
 *   • Тип единиц рецепта и упаковки не совпадает → одна упаковка
 *     (плотности не угадываем).
 *   • Иначе — Math.ceil(нужно / упаковка) × цена.
 */
export function computeAdjustedPrice(itemQ, storeProduct) {
  if (!storeProduct || storeProduct.price == null) return null
  const price = Number(storeProduct.price)
  if (!isFinite(price) || price < 0) return null

  const { package_size, package_unit } = storeProduct
  const onePack = { totalPrice: round2(price), packagesNeeded: 1 }

  if (!package_size || !package_unit) return onePack

  const needed = parseQuantityToBase(itemQ)
  const pack = parseQuantityToBase(`${package_size} ${package_unit}`)

  if (!needed || !pack) return onePack
  if (needed.type !== pack.type) return onePack
  if (pack.value <= 0) return onePack

  const packagesNeeded = Math.max(1, Math.ceil(needed.value / pack.value))
  return {
    totalPrice: round2(packagesNeeded * price),
    packagesNeeded,
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}