<script setup>
import { ref, computed } from 'vue'
import { categorize } from '@/utils/categorize'

const props = defineProps({
  shopItems: { type: Array, required: true }, //[{ id, n, q, cat, done, storeProduct?, estimatedPrice? }]
  totalPrice: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle', 'delete', 'update', 'add', 'clear', 'rebuild'])

// ── СОСТОЯНИЕ СКРОЛЛА (ДЛЯ СЖАТИЯ ШАПКИ) ──────────────────────
const isScrolled = ref(false)

function handleScroll(e) {
  // Активируем компактный режим, если прокрутили больше 15px
  const scrolled = e.target.scrollTop > 15
  if (isScrolled.value !== scrolled) {
    isScrolled.value = scrolled
  }
}

// ── СТАТИСТИКА ───────────────────────────────────────────────
const total = computed(() => props.shopItems.length)
const done  = computed(() => props.shopItems.filter(i => i.done).length)
const pct   = computed(() => total.value > 0 ? Math.round(done.value / total.value * 100) : 0)

// ── ФИЧА-ФЛАГ: ОТОБРАЖЕНИЕ ЦЕН ───────────────────────────────
// FEATURE-PRICES-OFF: цены сейчас слишком неточные (расхождение с реальной
// расфасовкой магазина, неверные матчи), скрываем их в UI до доработки.
// Когда товары и цены доведём до приличного качества — поменять на true.
// Под этим же флагом скрыта строка «Корзина X ₽» в шапке списка.
const SHOW_PRICES = false

// ── КАТЕГОРИИ ────────────────────────────────────────────────
const CAT_ORDER =[
  '🥩 Мясо и птица', '🐟 Рыба и морепродукты', '🥛 Молочное', '🥚 Яйца',
  '🥦 Овощи', '🍎 Фрукты и ягоды', '🌾 Крупы и макароны', '🍞 Хлеб и выпечка',
  '🥫 Консервы', '🛢️ Масла и соусы', '🧂 Специи и приправы', '🧃 Напитки',
  '🍬 Сладкое', '📦 Прочее',
]

// ── СЛОВАРЬ ДЛЯ АВТО-КАТЕГОРИЗАЦИИ ───────────────────────────
const CAT_KEYWORDS = {
  '🥩 Мясо и птица':['мясо', 'курица', 'говядина', 'свинина', 'фарш', 'филе', 'индейка', 'сосиски', 'колбаса', 'бекон'],
  '🐟 Рыба и морепродукты':['рыба', 'лосось', 'форель', 'креветки', 'кальмар', 'мидии', 'краб', 'икра', 'сельдь'],
  '🥛 Молочное':['молоко', 'сыр', 'творог', 'кефир', 'йогурт', 'сметана', 'масло сливочное', 'сливки'],
  '🥚 Яйца':['яйца', 'яйцо', 'перепелиные'],
  '🥦 Овощи':['картофель', 'картошка', 'морковь', 'лук', 'чеснок', 'капуста', 'помидор', 'томат', 'огурец', 'перец', 'брокколи', 'зелень', 'салат', 'кабачок', 'баклажан', 'свекла'],
  '🍎 Фрукты и ягоды':['яблоко', 'яблоки', 'банан', 'бананы', 'апельсин', 'мандарин', 'лимон', 'ягода', 'клубника', 'малина', 'виноград', 'груша', 'киви', 'авокадо'],
  '🌾 Крупы и макароны':['рис', 'гречка', 'макароны', 'спагетти', 'овсянка', 'пшено', 'чечевица', 'горох', 'фасоль', 'мука', 'крупа', 'булгур', 'кускус'],
  '🍞 Хлеб и выпечка':['хлеб', 'батон', 'булочка', 'лаваш', 'багет', 'пирог', 'печенье', 'сухари'],
  '🥫 Консервы':['тушенка', 'шпроты', 'горошек', 'кукуруза', 'паштет', 'томатная паста', 'оливки', 'маслины', 'тунец'],
  '🛢️ Масла и соусы':['масло', 'майонез', 'кетчуп', 'горчица', 'соевый соус', 'уксус', 'соус'],
  '🧂 Специи и приправы':['соль', 'сахар', 'перец черный', 'приправа', 'корица', 'ванилин', 'дрожжи', 'специи'],
  '🧃 Напитки':['вода', 'сок', 'чай', 'кофе', 'газировка', 'квас', 'пиво', 'вино'],
  '🍬 Сладкое':['конфеты', 'шоколад', 'торт', 'пирожное', 'мороженое', 'мармелад', 'мед', 'варенье', 'сироп', 'сахарозаменитель']
}

function getCategory(item) {
  // FIX-CAT-03: основной источник — категория, проставленная в menuStore.
  // generateShoppingList уже считает её через единый utils/categorize.
  // Старая логика с CAT_KEYWORDS внутри компонента осталась как
  // RESERVE-fallback для ручных правок item.cat и старых элементов в localStorage.
  if (item.cat && CAT_ORDER.includes(item.cat)) return item.cat;

  // Если категория не из CAT_ORDER (пришла из БД с эмодзи-мусором
  // «🥩 Мясо», «🍗 Птица», «🌾 Бакалея»...) или вообще отсутствует —
  // пересчитываем по имени через единый categorize.
  const computed = categorize(item.n || '');
  if (computed && CAT_ORDER.includes(computed)) return computed;

  // Совсем legacy-fallback — на случай если categorize вернул что-то странное.
  const searchStr = ((item.n || '') + ' ' + (item.cat || '')).toLowerCase();
  for (const [catName, keywords] of Object.entries(CAT_KEYWORDS)) {
    if (keywords.some(kw => searchStr.includes(kw))) {
      return catName;
    }
  }
  if (item.cat) {
    const found = CAT_ORDER.find(c => c.toLowerCase().includes(item.cat.toLowerCase().trim()));
    if (found) return found;
  }
  return '📦 Прочее';
}

// ── ФИЛЬТР ПО ОТДЕЛУ ─────────────────────────────────────────
const activeFilter = ref('all')

const presentCats = computed(() => {
  const s = new Set(props.shopItems.map(i => getCategory(i)))
  return CAT_ORDER.filter(c => s.has(c))
})

// ── УМНОЕ СУММИРОВАНИЕ КОЛИЧЕСТВ ─────────────────────────────
const UNIT_ALIASES = {
  'г': 'г', 'гр': 'г', 'грамм': 'г', 'граммов': 'г', 'грамма': 'г',
  'кг': 'кг', 'килограмм': 'кг', 'килограмма': 'кг', 'кило': 'кг',
  'мл': 'мл', 'миллилитр': 'мл',
  'л': 'л', 'литр': 'л', 'литра': 'л', 'литров': 'л',
  'шт': 'шт', 'штук': 'шт', 'штуки': 'шт', 'штука': 'шт',
  'ст. л': 'ст. л.', 'ст.л': 'ст. л.', 'ст.л.': 'ст. л.', 'столовая ложка': 'ст. л.', 'ст. л.': 'ст. л.',
  'ч. л': 'ч. л.', 'ч.л': 'ч. л.', 'ч.л.': 'ч. л.', 'чайная ложка': 'ч. л.', 'ч. л.': 'ч. л.',
  'стакан': 'ст.', 'стакана': 'ст.', 'ст': 'ст.',
  'щепотка': 'щеп.', 'щеп': 'щеп.', 'щеп.': 'щеп.',
}

function parseQty(qStr) {
  if (!qStr) return[]
  const parts = qStr.split(/\s*\+\s*/)
  const result =[]
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^([\d.,/]+)\s*(.*)$/)
    if (m) {
      const num = parseFloat(m[1].replace(',', '.')) || 0
      const rawUnit = m[2].trim().toLowerCase()
      const unit = UNIT_ALIASES[rawUnit] || rawUnit || 'шт'
      result.push({ num, unit })
    } else {
      result.push({ num: null, unit: trimmed })
    }
  }
  return result
}

function mergeQtys(items) {
  const byUnit = new Map()
  const unknowns = new Set()
  for (const item of items) {
    const parsed = parseQty(item.q)
    for (const p of parsed) {
      if (p.num !== null) {
        const key = p.unit
        byUnit.set(key, (byUnit.get(key) || 0) + p.num)
      } else if (p.unit) {
        unknowns.add(p.unit)
      }
    }
  }
  const parts = []
  for (const [unit, num] of byUnit) {
    const display = Number.isInteger(num) ? num : parseFloat(num.toFixed(2))
    parts.push(`${display} ${unit}`)
  }
  for (const u of unknowns) parts.push(u)
  return parts.join(' + ') || ''
}

// ── ГРУППИРОВКА С ОБЪЕДИНЕНИЕМ ДУБЛЕЙ ───────────────────────
const groups = computed(() => {
  const mergedMap = new Map()
  props.shopItems.forEach(item => {
    const key = (item.n || '').toLowerCase().trim()
    if (!mergedMap.has(key)) {
      mergedMap.set(key, { base: item, all: [item] })
    } else {
      mergedMap.get(key).all.push(item)
    }
  })

  const mergedItems = []
  for (const [, { base, all }] of mergedMap) {
    if (all.length === 1) {
      mergedItems.push({
        ...base,
        _ids: [base.id],
        fromRecipes: Array.isArray(base.fromRecipes) ? base.fromRecipes : [],
      })
    } else {
      const mergedQ = mergeQtys(all)
      const allDone = all.every(i => i.done)
      // Объединяем рецепты со всех дублей и убираем повторы
      const recipesSet = new Set()
      for (const it of all) {
        if (Array.isArray(it.fromRecipes)) {
          for (const name of it.fromRecipes) {
            if (name) recipesSet.add(name)
          }
        }
      }
      mergedItems.push({
        ...base,
        q: mergedQ,
        done: allDone,
        _ids: all.map(i => i.id),
        fromRecipes: [...recipesSet],
      })
    }
  }

  const map = {}
  mergedItems.forEach(item => {
    const cat = getCategory(item)
    if (!map[cat]) map[cat] = []
    map[cat].push(item)
  })
  for (const cat in map) {
    map[cat].sort((a, b) => Number(a.done) - Number(b.done))
  }
  let cats = CAT_ORDER.filter(c => map[c])
  if (activeFilter.value !== 'all') cats = cats.filter(c => c === activeFilter.value)
  return cats.map(c => ({ cat: c, items: map[c] }))
})

// ── TOGGLE / DELETE ───────────────────────────────────────────
function handleToggle(item) {
  for (const id of (item._ids || [item.id])) {
    emit('toggle', id)
  }
}

function handleDelete(item) {
  for (const id of (item._ids || [item.id])) {
    emit('delete', id)
  }
}

// ── РЕДАКТИРОВАНИЕ ────────────────────────────────────────────
const editId = ref(null)
const editN  = ref('')
const editQ  = ref('')

function startEdit(item) {
  if (editId.value === item.id) { cancelEdit(); return }
  editId.value = item.id
  editN.value  = item.n
  editQ.value  = item.q || ''
}
function cancelEdit() {
  editId.value = null
  editN.value  = ''
  editQ.value  = ''
}
function saveEdit(item) {
  const name = editN.value.trim()
  if (name) emit('update', { id: item.id, n: name, q: editQ.value.trim() })
  cancelEdit()
}

// ── ИНФО О РЕЦЕПТАХ (всплывашка «ⓘ») ─────────────────────────
// Хранит id строки списка, у которой сейчас раскрыта панель «Используется в…».
// Только одна панель открыта одновременно — повторный тап закрывает.
const openInfoId = ref(null)

function toggleInfo(item) {
  openInfoId.value = openInfoId.value === item.id ? null : item.id
}

// ── ДОБАВЛЕНИЕ ────────────────────────────────────────────────
const newN = ref('')
const newQ = ref('')

function handleAdd() {
  const name = newN.value.trim()
  if (!name) return
  emit('add', { name, qty: newQ.value.trim() || '1 шт.' })
  newN.value = ''
  newQ.value = ''
}

// ── ОЧИСТКА ───────────────────────────────────────────────────
const confirmClear = ref(false)

// ── ФОРМАТИРОВАНИЕ ЦЕНЫ ───────────────────────────────────────
function formatPrice(value) {
  if (value == null) return ''
  const n = Number(value)
  if (!isFinite(n)) return ''
  // Если цена целая — без копеек, иначе 2 знака
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}
</script>

<template>
  <!-- Отменяем сжатие, если открыто подтверждение очистки, чтобы оно не скрылось -->
  <div class="slg" :class="{ 'is-scrolled': isScrolled && !confirmClear }">

    <!-- ── ПРОГРЕСС ── -->
    <div class="slg-header">
      <div class="prog-row">
      <span class="prog-txt">
        {{ done === total && total > 0 ? '✓ Всё куплено!' : `${done} из ${total} куплено` }}
      </span>
        <span class="prog-pct">{{ pct }}%</span>
      </div>
      <div class="prog-track"><div class="prog-fill" :style="{ width: pct + '%' }"></div></div>

      <!-- Итоговая сумма корзины -->
      <div v-if="SHOW_PRICES && totalPrice > 0" class="cart-total-row">
        <span class="cart-total-label">Приблизительная стоимость корзины:</span>
        <span class="cart-total-value">{{ formatPrice(totalPrice) }} ₽</span>
      </div>

      <!-- Обёртка для плавного скрытия кнопок при скролле -->
      <div class="hdr-collapsible">
        <div class="hdr-collapsible-inner">
          <!-- Кнопки -->
          <div class="hdr-btns">
            <button class="hdr-btn" @click="emit('rebuild')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 12a9 9 0 109-9"/><path d="M3 3v5h5"/></svg>
              Обновить из меню
            </button>
            <button class="hdr-btn hdr-danger" @click="confirmClear = true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              Очистить
            </button>
          </div>

          <!-- Подтверждение очистки -->
          <div v-if="confirmClear" class="clear-confirm">
            <span class="cc-txt">Очистить весь список?</span>
            <div class="cc-btns">
              <button class="cc-no" @click="confirmClear = false">Отмена</button>
              <button class="cc-yes" @click="emit('clear'); confirmClear = false">Да</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ФИЛЬТРЫ ПО ОТДЕЛУ (Остаются всегда доступными) ── -->
    <div v-if="presentCats.length > 1" class="filter-scroll">
      <button
          class="fchip"
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'"
      >Все</button>
      <button
          v-for="cat in presentCats"
          :key="cat"
          class="fchip"
          :class="{ active: activeFilter === cat }"
          @click="activeFilter = cat"
      >{{ cat.split(' ')[0] }} {{ cat.split(' ').slice(1).join(' ') }}</button>
    </div>

    <!-- ── СПИСОК (Слушаем скролл тут) ── -->
    <div class="slg-body" @scroll="handleScroll">

      <!-- Пустое состояние -->
      <div v-if="shopItems.length === 0" class="slg-empty">
        <div class="empty-ico">🛒</div>
        <div class="empty-title">Список пуст</div>
        <div class="empty-sub">Сгенерируй меню — список соберётся автоматически</div>
      </div>

      <!-- Группы -->
      <section v-for="group in groups" :key="group.cat" class="cat-group">
        <div class="cat-label">
          <span class="cat-emoji">{{ group.cat.split(' ')[0] }}</span>
          <span class="cat-name">{{ group.cat.split(' ').slice(1).join(' ') }}</span>
          <span class="cat-count">{{ group.items.filter(i=>!i.done).length }}/{{ group.items.length }}</span>
        </div>

        <ul class="items-list">
          <li v-for="item in group.items" :key="item.id" class="item-wrap">

            <div class="shop-item" :class="{ done: item.done }">
              <button
                  class="cb"
                  :class="{ checked: item.done }"
                  type="button"
                  :aria-label="item.done ? 'Отметить как не купленное' : 'Отметить как купленное'"
                  @click.stop="handleToggle(item)"
              >
                <div class="cb-inner">
                  <svg v-if="item.done" width="10" height="10" viewBox="0 0 24 24" fill="none"
                       stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              </button>

              <div class="item-main">
                <span class="item-name">{{ item.n }}</span>
                <div v-if="item.q || (item.fromRecipes && item.fromRecipes.length)" class="qty-row">
                  <span v-if="item.q" class="item-qty">{{ item.q }}</span>
                  <button
                      v-if="item.fromRecipes && item.fromRecipes.length"
                      type="button"
                      class="info-btn"
                      :class="{ open: openInfoId === item.id }"
                      :aria-expanded="openInfoId === item.id"
                      :aria-label="`Используется в ${item.fromRecipes.length} ${item.fromRecipes.length === 1 ? 'рецепте' : 'рецептах'}`"
                      @click.stop="toggleInfo(item)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.2"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9"/>
                      <line x1="12" y1="11" x2="12" y2="16.5"/>
                      <line x1="12" y1="7.5" x2="12" y2="7.6"/>
                    </svg>
                    <span class="info-count">{{ item.fromRecipes.length }}</span>
                  </button>
                </div>
                <!-- Информация о товаре из магазина -->
                <!--
                  FEATURE-PRICES-OFF: пока бэк не научился отдавать
                  точные цены и пакетировку, отображение скрыто (флаг
                  SHOW_PRICES). Когда цены доведём до нормы — поменять на true.
                -->
                <div v-if="SHOW_PRICES && item.storeProduct" class="store-product">
                  <span class="store-product-name">{{ item.storeProduct.name }}</span>
                  <span v-if="item.estimatedPrice != null" class="store-product-price">
                    <span v-if="item.packagesNeeded > 1" class="store-product-pkg"
                          :title="`Нужно ${item.packagesNeeded} упаковок`">
                      {{ item.packagesNeeded }}×
                    </span>
                    {{ formatPrice(item.estimatedPrice) }} ₽
                  </span>
                </div>
                <!-- Раскрывающаяся панель «Используется в…» -->
                <div
                    v-if="openInfoId === item.id && item.fromRecipes && item.fromRecipes.length"
                    class="recipes-panel"
                    role="region"
                    :aria-label="`Рецепты, в которые идёт ${item.n}`"
                >
                  <div class="recipes-panel-title">
                    {{ item.fromRecipes.length === 1
                      ? 'Используется в рецепте:'
                      : `Используется в ${item.fromRecipes.length} рецептах:` }}
                  </div>
                  <ul class="recipes-panel-list">
                    <li v-for="r in item.fromRecipes" :key="r" class="recipe-chip">{{ r }}</li>
                  </ul>
                </div>
              </div>

              <button class="icon-btn" type="button"
                      :class="{ active: editId === item.id }"
                      @click.stop="startEdit(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>

              <button class="icon-btn icon-del" type="button"
                      @click.stop="handleDelete(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            </div>

            <div v-if="editId === item.id" class="edit-panel">
              <input class="edit-input edit-name" v-model="editN"
                     placeholder="Название" @keydown.enter="saveEdit(item)" @keydown.esc="cancelEdit" />
              <input class="edit-input edit-qty" v-model="editQ"
                     placeholder="Кол-во" @keydown.enter="saveEdit(item)" @keydown.esc="cancelEdit" />
              <button class="edit-save" type="button" @click="saveEdit(item)">Сохранить</button>
              <button class="edit-cancel" type="button" @click="cancelEdit">Отмена</button>
            </div>

          </li>
        </ul>
      </section>

      <!-- Добавить продукт -->
      <div class="add-section">
        <input class="add-input" v-model="newN" placeholder="Добавить продукт..."
               @keydown.enter="handleAdd" />
        <input class="add-qty" v-model="newQ" placeholder="Кол-во"
               @keydown.enter="handleAdd" />
        <button class="add-btn" type="button" @click="handleAdd">+</button>
      </div>

      <div class="bottom-gap"></div>
    </div>
  </div>
</template>

<style scoped>
.slg {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
  max-width: 100%;
}

/* ── ШАПКА И ЕЁ АНИМАЦИЯ ── */
/* ── ШАПКА И ЕЁ АНИМАЦИЯ ── */
.slg-header {
  flex-shrink: 0;
  background: var(--surf);
  border-bottom: 1px solid var(--bdr);
  padding: 12px 14px 10px;
  transition: padding 0.3s ease;

  /* ДОБАВЛЕНО: Принудительное GPU-ускорение, чтобы Safari 
     не перерисовывал весь нижний список при сжатии шапки */
  transform: translateZ(0);
  will-change: padding;
}
.is-scrolled .slg-header {
  padding: 8px 14px 6px;
}

.prog-row {
  display: flex;
  justify-content: space-between;
  font-size: .84rem;
  font-weight: 600;
  color: var(--t2);
  margin-bottom: 7px;

  /* ИЗМЕНЕНО: Убрали font-size из transition! Это главный враг плавности в Safari */
  transition: margin-bottom 0.3s ease;
}
.is-scrolled .prog-row {
  margin-bottom: 4px;
  font-size: .75rem; /* Размер изменится сразу, без тяжелой анимации */
}

.prog-pct { color: var(--gd); font-weight: 800; }
.prog-track {
  height: 5px;
  background: var(--surf2);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
  transition: height 0.3s ease, margin-bottom 0.3s ease;

  /* ДОБАВЛЕНО */
  transform: translateZ(0);
}
.is-scrolled .prog-track {
  height: 3px;
  margin-bottom: 0;
}

.prog-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--g), var(--gl));
  border-radius: 5px;
  transition: width .4s ease;
}

/* Обёртка, плавно сворачиваемая при скролле (современный трюк через grid) */
/* ИЗМЕНЕНО: Заменяем grid на max-height для стабильности в iOS */
.hdr-collapsible {
  max-height: 150px; /* Берем с запасом, чтобы влезли кнопки и алерт очистки */
  opacity: 1;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease;

  /* Подсказываем iOS, что эти свойства будут меняться */
  will-change: max-height, opacity;
  transform: translateZ(0);
}

.is-scrolled .hdr-collapsible {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.hdr-collapsible-inner {
  padding-bottom: 4px; /* Небольшой отступ, чтобы у кнопок не срезало бордеры при скрытии */
}

.hdr-btns { display: flex; gap: 8px; }
.hdr-btn {
  height: 32px;
  padding: 11px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: .75rem;
  font-weight: 700;
  font-family: inherit;
  white-space: nowrap;
  border: 1.5px solid var(--bdr);
  background: var(--surf);
  color: var(--t2);
  cursor: pointer;
  transition: all .15s;
}
.hdr-btn:hover { border-color: var(--g); background: var(--gp); color: var(--gd); }
.hdr-danger:hover { border-color: var(--coral) !important; background: var(--coralp) !important; color: var(--coral) !important; }

.clear-confirm {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--ambp);
  border: 1px solid rgba(217,119,6,.22);
  border-radius: 12px;
}
.cc-txt { flex: 1; font-size: .82rem; font-weight: 600; color: #7C4A03; min-width: 80px; }
.cc-btns { display: flex; gap: 7px; }
.cc-no, .cc-yes {
  height: 30px; padding: 0 13px; border-radius: 8px;
  font-size: .78rem; font-weight: 700; font-family: inherit; cursor: pointer;
}
.cc-no  { border: 1.5px solid rgba(217,119,6,.3); background: transparent; color: #7C4A03; }
.cc-yes { border: none; background: var(--coral); color: #fff; }

/* ── ФИЛЬТРЫ ── */
.filter-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 10px 14px;
  flex-shrink: 0;
  transition: padding 0.3s ease;
}
.filter-scroll::-webkit-scrollbar { display: none; }
.is-scrolled .filter-scroll {
  padding: 6px 14px;
}
.fchip {
  display: inline-flex;      /* ДОБАВЛЕНО: для центрирования контента */
  align-items: center;       /* ДОБАВЛЕНО: по вертикали по центру */
  justify-content: center;   /* ДОБАВЛЕНО: по горизонтали по центру */
  height: 34px;
  padding: 0 14px;           /* ИЗМЕНЕНО: убрали отступ по вертикали, оставили только по бокам */
  border-radius: 22px;
  flex-shrink: 0;
  font-size: .76rem;
  font-weight: 700;
  font-family: inherit;
  white-space: nowrap;
  border: 1.5px solid var(--bdr);
  background: var(--surf);
  color: var(--t2);
  cursor: pointer;
  transition: all .15s;
  min-width: 44px;
}
.fchip.active { background: var(--gp); border-color: var(--g); color: var(--gd); }
.fchip:hover:not(.active) { border-color: var(--gpp); color: var(--gd); }

/* ── ТЕЛО ── */
.slg-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 10px 0;
}
.slg-body::-webkit-scrollbar { display: none; }
.bottom-gap { height: 100px; }

/* ── ПУСТОЕ СОСТОЯНИЕ ── */
.slg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 52px 24px;
  text-align: center;
}
.empty-ico { font-size: 2.8rem; }
.empty-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 800; color: var(--t2); }
.empty-sub { font-size: .86rem; color: var(--t3); }

/* ── ГРУППА ── */
.cat-group { margin: 0 14px 18px; }
.cat-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.cat-emoji { font-size: 1rem; line-height: 1; }
.cat-name {
  font-size: .68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--t3);
  flex: 1;
}
.cat-count { font-size: .68rem; color: var(--t-dis); }
.cat-label::after {
  content: '';
  flex: 1;
  min-width: 12px;
  height: 1px;
  background: var(--bdr);
  order: 4;
}

.items-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.item-wrap { display: flex; flex-direction: column; }

/* ── СТРОКА ТОВАРА ── */
.shop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px 9px 12px;
  background: var(--surf);
  border-radius: 12px;
  border: 1px solid var(--bdr);
  min-height: 50px;
}
.shop-item.done { opacity: .55; background: var(--surf2); }

/* ── ЧЕКБОКС ── */
.cb {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 7px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}
.cb-inner {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 2px solid var(--bdr2);
  background: var(--surf2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}
.cb:hover .cb-inner { border-color: var(--g); background: var(--gp); }
.cb.checked .cb-inner { background: var(--g); border-color: var(--gd); }

/* ── ИКОНКИ ── */
.icon-btn {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--t-dis);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .12s, color .12s;
}
.icon-btn:hover { background: var(--surf2); color: var(--t2); }
.icon-btn.active { background: var(--gp); color: var(--gd); }
.icon-del:hover { background: var(--coralp); color: var(--coral); }

/* ── ТЕКСТ ── */
.item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.item-name {
  font-size: .92rem;
  font-weight: 600;
  color: var(--t1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shop-item.done .item-name {
  text-decoration: line-through;
  text-decoration-color: var(--gl);
  color: var(--t3);
}
.item-qty {
  font-size: .76rem;
  color: var(--t3);
  font-weight: 500;
  white-space: normal;
  line-height: 1.3;
}

/* ── СТРОКА КОЛИЧЕСТВА + КНОПКА «ⓘ» ──────────────────────── */
.qty-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.info-btn {
  /* Визуально компактная пилюля, но с увеличенной hit-area
     через padding — соответствует требованию >= 44px от
     Apple HIG (учитывая родительский ряд высотой 50px). */
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  min-width: 22px;
  padding: 0 7px;
  border-radius: 11px;
  border: 1px solid var(--bdr2);
  background: var(--gp);
  color: var(--gd);
  font-family: inherit;
  font-size: .68rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
  /* увеличиваем тачабельную зону без визуального роста */
  position: relative;
}
.info-btn::after {
  content: '';
  position: absolute;
  inset: -11px;
}
.info-btn:hover { background: var(--gpp); border-color: var(--g); }
.info-btn.open  { background: var(--g); color: #fff; border-color: var(--gd); }
.info-btn:focus-visible {
  outline: 3px solid var(--g);
  outline-offset: 2px;
}

.info-count {
  font-variant-numeric: tabular-nums;
  font-size: .7rem;
  font-weight: 800;
}

.shop-item.done .info-btn {
  opacity: .6;
}

/* ── ПАНЕЛЬ «Используется в…» ────────────────────────────── */
.recipes-panel {
  margin-top: 7px;
  padding: 8px 10px 9px;
  background: var(--gp);
  border: 1px solid var(--gpp);
  border-radius: 10px;
  animation: recipesIn .2s var(--ease-out, ease-out);
}
.recipes-panel-title {
  font-family: 'DM Sans', sans-serif;
  font-size: .68rem;
  font-weight: 700;
  color: var(--gd);
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-bottom: 6px;
}
.recipes-panel-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.recipe-chip {
  display: inline-block;
  font-size: .76rem;
  font-weight: 600;
  color: var(--t1);
  background: var(--surf);
  border: 1px solid var(--bdr);
  border-radius: 6px;
  padding: 3px 8px;
  line-height: 1.25;
  max-width: 100%;
  word-break: break-word;
}

@keyframes recipesIn {
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .recipes-panel { animation: none; }
}

/* ── ПАНЕЛЬ РЕДАКТИРОВАНИЯ ── */
.edit-panel {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 8px 10px 10px;
  background: var(--gp);
  border: 1px solid var(--g);
  border-top: none;
  border-radius: 0 0 12px 12px;
  margin-top: -6px;
}
.edit-input {
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--bdr2);
  background: var(--surf);
  color: var(--t1);
  font-size: .88rem;
  font-family: inherit;
  outline: none;
}
.edit-input:focus { border-color: var(--g); }
.edit-name { flex: 1; min-width: 100px; }
.edit-qty  { width: 80px; }
.edit-save {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: var(--g);
  color: #fff;
  font-size: .84rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}
.edit-cancel {
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--bdr2);
  background: transparent;
  color: var(--t2);
  font-size: .84rem;
  font-family: inherit;
  cursor: pointer;
}

/* ── ДОБАВЛЕНИЕ ── */
.add-section {
  display: flex;
  gap: 6px;
  margin: 4px 14px 0;
  padding: 10px 12px;
  background: var(--surf);
  border: 1px dashed var(--bdr2);
  border-radius: 12px;
}
.add-input {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--bdr);
  background: var(--surf2);
  color: var(--t1);
  font-size: .88rem;
  font-family: inherit;
  outline: none;
  min-width: 0;
}
.add-input:focus { border-color: var(--g); background: var(--surf); }
.add-qty {
  width: 72px;
  height: 36px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid var(--bdr);
  background: var(--surf2);
  color: var(--t1);
  font-size: .88rem;
  font-family: inherit;
  outline: none;
}
.add-qty:focus { border-color: var(--g); background: var(--surf); }
.add-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
  border: none;
  background: var(--g);
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-btn:hover { opacity: .88; }

/* ── ТОВАР ИЗ МАГАЗИНА ───────────────────────────────────── */
.store-product {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.store-product-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--t2);
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.store-product-price {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--g);
  flex-shrink: 0;
  white-space: nowrap;
}
.store-product-pkg {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--t3);
  background: var(--surf2);
  padding: 1px 5px;
  border-radius: 4px;
  margin-right: 4px;
  vertical-align: 1px;
}
.shop-item.done .store-product-name,
.shop-item.done .store-product-price {
  opacity: 0.5;
  text-decoration: line-through;
}

/* ── ИТОГОВАЯ СУММА КОРЗИНЫ ──────────────────────────────── */
.cart-total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 14px;
  margin-top: 8px;
  margin-bottom: 8px;
  background: var(--gpp);
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
}
.cart-total-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--t1);
}
.cart-total-value {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--g);
}
.is-scrolled .cart-total-row {
  /* Чуть компактнее в свёрнутом режиме */
  padding: 6px 12px;
  margin-top: 4px;
}
.is-scrolled .cart-total-value {
  font-size: 0.95rem;
}

@media (prefers-reduced-motion: reduce) {
  .prog-fill, .cb, .hdr-collapsible { transition-duration: .01ms !important; }
}
</style>