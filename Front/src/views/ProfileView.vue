<script setup>
/**
 * ProfileView.vue — «Время Есть» v2.0
 *
 * Ключевые изменения:
 * ✓ Добавлен блок «Моя цель» — пол, возраст, вес, рост, целевой вес
 * ✓ Живой пересчёт BMR / TDEE / targetKcal / макро при изменении данных
 * ✓ Расширены ограничения до 8 вариантов (как в онбординге)
 * ✓ Расширен cookFreq — три варианта + batch mode индикатор
 * ✓ Добавлено поле «Не люблю» для нелюбимых продуктов
 * ✓ Добавлены теги «дети до 7» + «пожилые»
 * ✓ FIX-21, FIX-22 сохранены
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter }    from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import BaseButton       from '@/components/atoms/BaseButton.vue'
import { useTrack } from '@/composables/useTrack'
const { track, EVENT } = useTrack()

const router = useRouter()
const auth   = useAuthStore()

const initialSnapshot = ref(null)

// Делаем глубокую копию текущих настроек при загрузке страницы
onMounted(() => {
  if (auth.preferences) {
    initialSnapshot.value = JSON.parse(JSON.stringify(auth.preferences))
  }
})

// ─── ДАННЫЕ АККАУНТА ─────────────────────────────────────────
const name            = ref(auth.user?.name || '')
const currentPassword = ref('')
const newPassword     = ref('')
const error           = ref('')
const success         = ref('')
const loading         = ref(false)

// ─── ПРОФИЛЬ ИЗ ОНБОРДИНГА ──────────────────────────────────
const p = auth.preferences || {}

// Семья
const familySize = ref(p.familySize || 2)
const familyTags = reactive({
  kids_small: p.familyTags?.kids_small || false,
  kids:       p.familyTags?.kids       || false,
  teens:      p.familyTags?.teens      || false,
  elderly:    p.familyTags?.elderly    || false,
})

// Физиология
const gender     = ref(p.gender     || 'female')
const age        = ref(p.age        || 30)
const weight     = ref(p.weight     || 65)
const height     = ref(p.height     || 165)
const goalWeight = ref(p.goalWeight || null)

// Цель и ритм
const goal          = ref(p.goal          || 'health')
const activityLevel = ref(p.activityLevel || 'light')
// FIX-BATCH-07: нормализуем ключ — онбординг исторически пишет 'once_week',
// профиль пишет 'weekends'. Оба означают «готовлю один раз на всю неделю».
// Без нормализации пользователь, прошедший онбординг, открывал профиль и
// не видел подсвеченной кнопки batch-режима.
const cookFreq      = ref(p.cookFreq === 'once_week' ? 'weekends' : (p.cookFreq || 'daily'))
const cookTime      = ref(p.cookTime      || 30)
const budget        = ref(p.budget        || 'mid')

// Ограничения / кухни
const restrictions = reactive({
  veg:     p.restrictions?.veg     || false,
  vegan:   p.restrictions?.vegan   || false,
  gluten:  p.restrictions?.gluten  || false,
  lactose: p.restrictions?.lactose || false,
  nuts:    p.restrictions?.nuts    || false,
  seafood: p.restrictions?.seafood || false,
  pork:    p.restrictions?.pork    || false,
  halal:   p.restrictions?.halal   || false,
})
const cuisines = reactive({
  russian:       p.cuisines?.russian       || true,
  italian:       p.cuisines?.italian       || true,
  asian:         p.cuisines?.asian         || false,
  caucasian:     p.cuisines?.caucasian     || false,
  mediterranean: p.cuisines?.mediterranean || false,
  pp:            p.cuisines?.pp            || false,
  fast:          p.cuisines?.fast          || false,
})
const dislikedProducts = ref(p.dislikedProducts || '')

// ─── РАСЧЁТ КБЖУ (Миффлин-Сан Жеор) ─────────────────────────
const ACTIVITY_COEFF = { sedentary:1.2, light:1.375, moderate:1.55, high:1.725, very_high:1.9 }

const bmr = computed(() => {
  const w = weight.value, h = height.value, a = age.value
  if (gender.value === 'female') return Math.round(10*w + 6.25*h - 5*a - 161)
  return Math.round(10*w + 6.25*h - 5*a + 5)
})

const tdee = computed(() =>
  Math.round(bmr.value * (ACTIVITY_COEFF[activityLevel.value] || 1.375))
)

const targetKcal = computed(() => {
  if (goal.value === 'lose')   return Math.round(tdee.value * 0.82)
  if (goal.value === 'gain')   return Math.round(tdee.value * 1.12)
  return tdee.value
})

const macros = computed(() => {
  const kcal = targetKcal.value, w = weight.value
  const proteinG = Math.round(w * (goal.value === 'lose' ? 2.0 : 1.7))
  const fatG     = Math.round(w * 0.9)
  const carbsG   = Math.max(50, Math.round((kcal - proteinG*4 - fatG*9) / 4))
  return { protein: proteinG, fat: fatG, carbs: carbsG }
})

const bmi = computed(() => {
  const h = height.value / 100
  return (weight.value / (h * h)).toFixed(1)
})
const bmiLabel = computed(() => {
  const b = parseFloat(bmi.value)
  if (b < 18.5) return 'Дефицит массы'
  if (b < 25)   return 'Норма'
  if (b < 30)   return 'Избыточная масса'
  return 'Ожирение'
})

const isBatchMode = computed(() => ['weekends'].includes(cookFreq.value))

// ─── СЕМЬЯ ────────────────────────────────────────────────────
const FAM_PL = ['человек','человека','человека','человека','человек','человек']
const FAM_EM = ['👩','👨','👧','👦','👵','👴']
const FAM_BG = ['#E4F5EA','#FFF0E0','#E3F2FD','#FFF5E0','#EDE7F6','#FCE4EC']

const famAvatars = computed(() =>
  Array.from({ length: familySize.value }, (_, i) => ({
    bg: FAM_BG[i % FAM_BG.length], em: FAM_EM[i % FAM_EM.length],
  }))
)

// ─── КОНСТАНТЫ UI ─────────────────────────────────────────────
const GOALS = [
  { key:'lose',   icon:'📉', label:'Похудеть' },
  { key:'health', icon:'💚', label:'Здоровье' },
  { key:'gain',   icon:'📈', label:'Набрать массу' },
]
const ACTIVITIES = [
  { key:'sedentary', icon:'💺', label:'Сидячая',   sub:'Офис, без спорта' },
  { key:'light',     icon:'🚶', label:'Лёгкая',    sub:'1–2 тренировки' },
  { key:'moderate',  icon:'🏃', label:'Умеренная', sub:'3–5 тренировок' },
  { key:'high',      icon:'🏋️', label:'Высокая',   sub:'6–7 тренировок' },
]
const COOK_FREQS = [
  { key:'daily',     icon:'🍳', label:'Каждый день',  sub:'Готовлю ежедневно',         batch:false },
  { key:'weekends',  icon:'📦', label:'По выходным',  sub:'Готовлю один раз на всю неделю', batch:true  },
  // { key:'once_week', icon:'🫙', label:'Раз в неделю', sub:'Готовлю впрок',              batch:true  },
]
const COOK_TIMES = [
  { val:15, label:'15 мин' }, { val:30, label:'30 мин' },
  { val:60, label:'1 час'  }, { val:90, label:'1,5 ч+' },
]
const RESTRICTIONS_LIST = [
  { key:'veg',     icon:'🥦', label:'Вегетарианство' },
  { key:'vegan',   icon:'🌱', label:'Веганство' },
  { key:'gluten',  icon:'🌾', label:'Без глютена' },
  { key:'lactose', icon:'🥛', label:'Без лактозы' },
  { key:'nuts',    icon:'🥜', label:'Без орехов' },
  { key:'seafood', icon:'🦐', label:'Без морепродуктов' },
  { key:'pork',    icon:'🐷', label:'Без свинины' },
  { key:'halal',   icon:'☪️',  label:'Халяль' },
]
const CUISINES_LIST = [
  { key:'russian',       icon:'🫕', label:'Русская' },
  { key:'italian',       icon:'🍝', label:'Итальянская' },
  { key:'asian',         icon:'🍜', label:'Азиатская' },
  { key:'caucasian',     icon:'🥩', label:'Кавказская' },
  { key:'mediterranean', icon:'🫒', label:'Средиземноморская' },
  { key:'pp',            icon:'💪', label:'Правильное питание' },
  { key:'fast',          icon:'⚡', label:'Быстрые блюда' },
]

// ─── СОХРАНЕНИЕ ───────────────────────────────────────────────
async function save() {
  error.value   = ''
  success.value = ''
  loading.value = true

  // --- АНАЛИТИКА: Проверка изменений ---
  const changedFields = []
  const snap = initialSnapshot.value || {}
  
  if (snap.goal !== goal.value) changedFields.push('goal')
  if (snap.budget !== budget.value) changedFields.push('budget')
  if (snap.familySize !== familySize.value) changedFields.push('familySize')
  if (snap.activityLevel !== activityLevel.value) changedFields.push('activityLevel')
  if (snap.weight !== weight.value) changedFields.push('weight')
  
  // Отправляем событие обновления профиля
  track(EVENT.PROFILE_UPDATED, {
    changedFields, // Список измененных полей (напр. ['goal', 'weight'])
    newGoal: goal.value,
    newBudget: budget.value,
    bmi: bmi.value // Дополнительно полезно знать текущий ИМТ
  })

  try {
    auth.savePreferences({
      // семья
      familySize: familySize.value,
      familyTags:   { ...familyTags },
      // физиология
      gender:     gender.value,
      age:        age.value,
      weight:     weight.value,
      height:     height.value,
      goalWeight: goalWeight.value,
      // цель
      goal:           goal.value,
      activityLevel:  activityLevel.value,
      cookFreq:       cookFreq.value,
      cookTime:       cookTime.value,
      budget:         budget.value,
      // ограничения
      restrictions:   { ...restrictions },
      cuisines:       { ...cuisines },
      dislikedProducts: dislikedProducts.value,
      // рассчитанные значения (чтобы MenuView подхватил без перерасчёта)
      targetKcal:    targetKcal.value,
      targetProtein: macros.value.protein,
      targetFat:     macros.value.fat,
      targetCarbs:   macros.value.carbs,
      isBatchMode:   isBatchMode.value,
    })

    if (auth.token) {
      const body = { name: name.value || null, family_size: familySize.value, preferences: auth.preferences }
      if (newPassword.value) {
        body.current_password = currentPassword.value
        body.new_password     = newPassword.value
      }
      const res  = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${auth.token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Ошибка сохранения')
      auth.setUser({ ...auth.user, ...data })
    }
    initialSnapshot.value = JSON.parse(JSON.stringify(auth.preferences))
    success.value         = 'Изменения сохранены'
    currentPassword.value = ''
    newPassword.value     = ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function logout() {
  // Фиксируем событие выхода
  track(EVENT.AUTH_LOGOUT, {})
  
  auth.logout()
  router.push('/auth') // Или '/', смотря куда ты редиректишь
}
</script>

<template>
  <div class="profile-wrap">
    <div class="profile-body">

      <!-- ── АВАТАР ──────────────────────────────────── -->
      <div class="avatar-block">
        <div class="avatar-big" aria-hidden="true">
          {{ auth.user?.name ? auth.user.name[0].toUpperCase() : (auth.user?.email?.[0] || '?').toUpperCase() }}
        </div>
        <div class="avatar-name">{{ auth.user?.name || 'Пользователь' }}</div>
        <div class="avatar-email">{{ auth.user?.email }}</div>
      </div>

      <!-- ── КБЖУ ЦЕЛЬ — живой пересчёт ──────────────── -->
      <section class="profile-card card-goal">
        <h2 class="section-title">🎯 Моя цель КБЖУ</h2>

        <!-- Итоговые цифры -->
        <div class="kcal-grid">
          <div class="kcal-box main">
            <div class="kcal-val">{{ targetKcal.toLocaleString('ru') }}</div>
            <div class="kcal-lbl">ккал/день</div>
          </div>
          <div class="kcal-box">
            <div class="kcal-val green">{{ macros.protein }}г</div>
            <div class="kcal-lbl">Белки</div>
          </div>
          <div class="kcal-box">
            <div class="kcal-val">{{ macros.fat }}г</div>
            <div class="kcal-lbl">Жиры</div>
          </div>
          <div class="kcal-box">
            <div class="kcal-val">{{ macros.carbs }}г</div>
            <div class="kcal-lbl">Углев.</div>
          </div>
        </div>

        <!-- BMR → TDEE строка -->
        <div class="bmr-row">
          <div class="bmr-item">
            <span class="bmr-val">{{ bmr.toLocaleString('ru') }}</span>
            <span class="bmr-lbl">BMR (покой)</span>
          </div>
          <span class="bmr-arrow">→</span>
          <div class="bmr-item">
            <span class="bmr-val">{{ tdee.toLocaleString('ru') }}</span>
            <span class="bmr-lbl">TDEE (с активностью)</span>
          </div>
          <span class="bmr-arrow">→</span>
          <div class="bmr-item">
            <span class="bmr-val" :class="{ 'val-ok': parseFloat(bmi) < 25 }">{{ bmi }}</span>
            <span class="bmr-lbl">ИМТ ({{ bmiLabel }})</span>
          </div>
        </div>

        <div class="kcal-formula-note">
          Формула Миффлина-Сан Жеора · Обновляется при изменении данных
        </div>
      </section>

      <!-- ── ПОЛ И АНТРОПОМЕТРИЯ ───────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">📏 Физиологические данные</h2>

        <!-- Пол -->
        <div class="field-group">
          <div class="field-label">Пол</div>
          <div class="gender-row">
            <button class="gender-btn" :class="{ active: gender==='female' }" @click="gender='female'">
              <span>👩</span> Женщина
            </button>
            <button class="gender-btn" :class="{ active: gender==='male' }" @click="gender='male'">
              <span>👨</span> Мужчина
            </button>
          </div>
        </div>

        <!-- Возраст -->
        <div class="field-group">
          <div class="slider-head">
            <div class="field-label">Возраст</div>
            <div class="slider-badge">{{ age }} лет</div>
          </div>
          <input type="range" min="16" max="75" :value="age" step="1"
                 @input="age = +$event.target.value"
                 :style="{ background: `linear-gradient(to right, var(--g) ${((age-16)/59)*100}%, var(--surf2) ${((age-16)/59)*100}%)` }">
          <div class="slider-minmax"><span>16</span><span>75</span></div>
        </div>

        <!-- Вес -->
        <div class="field-group">
          <div class="slider-head">
            <div class="field-label">Текущий вес</div>
            <div class="slider-badge">{{ weight }} кг</div>
          </div>
          <input type="range" min="40" max="150" :value="weight" step="1"
                 @input="weight = +$event.target.value"
                 :style="{ background: `linear-gradient(to right, var(--g) ${((weight-40)/110)*100}%, var(--surf2) ${((weight-40)/110)*100}%)` }">
          <div class="slider-minmax"><span>40 кг</span><span>150 кг</span></div>
        </div>

        <!-- Рост -->
        <div class="field-group">
          <div class="slider-head">
            <div class="field-label">Рост</div>
            <div class="slider-badge">{{ height }} см</div>
          </div>
          <input type="range" min="140" max="210" :value="height" step="1"
                 @input="height = +$event.target.value"
                 :style="{ background: `linear-gradient(to right, var(--g) ${((height-140)/70)*100}%, var(--surf2) ${((height-140)/70)*100}%)` }">
          <div class="slider-minmax"><span>140 см</span><span>210 см</span></div>
        </div>

        <!-- Желаемый вес -->
        <div class="field-group">
          <div class="field-label">Желаемый вес (необязательно)</div>
          <input type="number" class="field-input compact"
                 :value="goalWeight" @input="goalWeight = +$event.target.value || null"
                 min="40" max="150" placeholder="кг — можно пропустить">
        </div>
      </section>

      <!-- ── ЦЕЛЬ ─────────────────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">🎯 Цель питания</h2>
        <div class="selector-grid cols-3">
          <button v-for="g in GOALS" :key="g.key"
                  class="selector-opt" :class="{ active: goal===g.key }"
                  role="radio" :aria-checked="goal===g.key" @click="goal=g.key">
            <span class="sel-ico">{{ g.icon }}</span>
            <span class="sel-name">{{ g.label }}</span>
          </button>
        </div>
      </section>

      <!-- ── АКТИВНОСТЬ ──────────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">🏃 Уровень активности</h2>
        <div class="activity-list">
          <button v-for="a in ACTIVITIES" :key="a.key"
                  class="activity-opt" :class="{ active: activityLevel===a.key }"
                  @click="activityLevel=a.key">
            <span class="act-ico">{{ a.icon }}</span>
            <div class="act-info">
              <span class="act-label">{{ a.label }}</span>
              <span class="act-sub">{{ a.sub }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- ── РИТМ ГОТОВКИ ────────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">🍳 Ритм готовки</h2>
        <div class="selector-grid cols-2">
          <button v-for="f in COOK_FREQS" :key="f.key"
                  class="selector-opt" :class="{ active: cookFreq===f.key, 'batch-active': f.batch && cookFreq===f.key }"
                  role="radio" :aria-checked="cookFreq===f.key" @click="cookFreq=f.key">
            <span class="sel-ico">{{ f.icon }}</span>
            <span class="sel-name">{{ f.label }}</span>
            <span class="sel-sub">{{ f.sub }}</span>
          </button>
        </div>

        <!-- Batch mode индикатор
        <div v-if="isBatchMode" class="batch-info">
          <span class="batch-info-ico">📦</span>
          <span>Batch cooking включён — меню будет содержать блюда для разогрева в будни</span>
        </div> -->

        <div class="field-group" style="margin-top:4px">
          <div class="field-label">Макс. время на готовку в день</div>
          <div class="cooktime-row">
            <button v-for="t in COOK_TIMES" :key="t.val"
                    class="cooktime-btn" :class="{ active: cookTime===t.val }"
                    @click="cookTime=t.val">{{ t.label }}</button>
          </div>
        </div>
      </section>

      <!-- ── СОСТАВ СЕМЬИ ────────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">👥 Состав семьи</h2>
        <div class="fam-avatars" aria-label="Члены семьи">
          <div v-for="(a, i) in famAvatars" :key="i" class="fam-av" :style="{ background: a.bg }">{{ a.em }}</div>
        </div>
        <div class="fam-counter">
          <button class="fam-btn" @click="familySize = Math.max(1, familySize-1)" aria-label="Уменьшить">−</button>
          <div class="fam-center">
            <div class="fam-num" aria-live="polite">{{ familySize }}</div>
            <div class="fam-label">{{ FAM_PL[familySize-1] }} в семье</div>
          </div>
          <button class="fam-btn" @click="familySize = Math.min(6, familySize+1)" aria-label="Увеличить">+</button>
        </div>
        <div class="field-group">
          <div class="field-label">Особенности состава</div>
          <div class="tags-wrap">
            <BaseButton variant="pill" :isActive="familyTags.kids_small" @click="familyTags.kids_small = !familyTags.kids_small">👶 Дети до 7</BaseButton>
            <BaseButton variant="pill" :isActive="familyTags.kids"       @click="familyTags.kids       = !familyTags.kids">👧 Дети 7–12</BaseButton>
            <BaseButton variant="pill" :isActive="familyTags.teens"      @click="familyTags.teens      = !familyTags.teens">🧑 Подростки</BaseButton>
            <BaseButton variant="pill" :isActive="familyTags.elderly"    @click="familyTags.elderly    = !familyTags.elderly">👴 Пожилые</BaseButton>
          </div>
        </div>
      </section>

      <!-- ── ОГРАНИЧЕНИЯ ─────────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">🚫 Ограничения в питании</h2>
        <div class="tags-wrap">
          <BaseButton v-for="r in RESTRICTIONS_LIST" :key="r.key"
                      variant="pill" :isActive="restrictions[r.key]"
                      @click="restrictions[r.key] = !restrictions[r.key]">
            {{ r.icon }} {{ r.label }}
          </BaseButton>
        </div>
      </section>

      <!-- ── ЛЮБИМЫЕ КУХНИ ───────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">🍽️ Любимые кухни</h2>
        <div class="tags-wrap">
          <BaseButton v-for="c in CUISINES_LIST" :key="c.key"
                      variant="pill" :isActive="cuisines[c.key]"
                      @click="cuisines[c.key] = !cuisines[c.key]">
            {{ c.icon }} {{ c.label }}
          </BaseButton>
        </div>
        <div class="field-group" style="margin-top:4px">
          <div class="field-label">Не люблю (необязательно)</div>
          <textarea class="field-input textarea" v-model="dislikedProducts" rows="2"
                    placeholder="Например: кинза, баклажан, ливер…"></textarea>
          <p class="field-hint">Алгоритм постарается не включать это в меню</p>
        </div>
      </section>

      <!-- ── БЮДЖЕТ ───────────────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">💰 Бюджет на продукты в неделю</h2>
        <div class="selector-grid cols-3">
          <button class="selector-opt" :class="{ active: budget==='low' }"
                  role="radio" :aria-checked="budget==='low'" @click="budget='low'">
            <span class="sel-ico">🪙</span>
            <span class="sel-name">до 3 000 ₽</span>
            <span class="sel-sub">Эконом</span>
          </button>
          <button class="selector-opt" :class="{ active: budget==='mid' }"
                  role="radio" :aria-checked="budget==='mid'" @click="budget='mid'">
            <span class="sel-ico">💳</span>
            <span class="sel-name">3–6 000 ₽</span>
            <span class="sel-sub">Средний</span>
          </button>
          <button class="selector-opt" :class="{ active: budget==='high' }"
                  role="radio" :aria-checked="budget==='high'" @click="budget='high'">
            <span class="sel-ico">✨</span>
            <span class="sel-name">без лимита</span>
            <span class="sel-sub">Премиум</span>
          </button>
        </div>
      </section>

      <!-- ── ДАННЫЕ АККАУНТА ─────────────────────────── -->
      <section class="profile-card">
        <h2 class="section-title">👤 Данные аккаунта</h2>
        <div class="field">
          <label class="field-label" for="profile-name">Имя</label>
          <input id="profile-name" v-model="name" type="text"
                 class="field-input" placeholder="Ваше имя" autocomplete="name" />
        </div>
        <div class="section-divider">Сменить пароль</div>
        <div class="field">
          <label class="field-label" for="profile-cur-pass">Текущий пароль</label>
          <input id="profile-cur-pass" v-model="currentPassword" type="password"
                 class="field-input" placeholder="········" autocomplete="current-password" />
        </div>
        <div class="field">
          <label class="field-label" for="profile-new-pass">Новый пароль</label>
          <input id="profile-new-pass" v-model="newPassword" type="password"
                 class="field-input" placeholder="········" minlength="6" autocomplete="new-password" />
        </div>
      </section>

      <!-- СТАТУС -->
      <div v-if="error"   class="msg msg-error"   role="alert">⚠️ {{ error }}</div>
      <div v-if="success" class="msg msg-success"  role="status">✓ {{ success }}</div>

      <!-- КНОПКИ -->
      <BaseButton variant="primary" :loading="loading" @click="save">
        Сохранить изменения
      </BaseButton>
      <BaseButton variant="danger" @click="logout">
        Выйти из аккаунта
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
/* ── ОБЁРТКА ────────────────────────────────────────────── */
.profile-wrap { background:var(--bg); display:flex; flex-direction:column; overflow:hidden; height:100%; }
.profile-body {
  flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none;
  padding:20px 16px calc(var(--nav-total-h,80px) + 24px);
  display:flex; flex-direction:column; gap:12px;
  width:100%; max-width:540px; margin:0 auto; box-sizing:border-box;
}
.profile-body::-webkit-scrollbar { display:none; }

/* ── АВАТАР ─────────────────────────────────────────────── */
.avatar-block { display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 0 4px; }
.avatar-big {
  width:76px; height:76px; border-radius:50%;
  background:linear-gradient(140deg,var(--g),var(--gd)); color:var(--surf);
  font-size:2rem; font-weight:800;
  display:flex; align-items:center; justify-content:center; box-shadow:var(--sh2);
}
.avatar-name  { font-size:1rem; font-weight:700; color:var(--t1); }
.avatar-email { font-size:.82rem; color:var(--t3); }

/* ── КАРТОЧКИ ────────────────────────────────────────────── */
.profile-card {
  background:var(--surf); border-radius:20px; border:1px solid var(--bdr);
  padding:18px 16px; display:flex; flex-direction:column; gap:14px;
}
.card-goal { background:linear-gradient(135deg,var(--gp),#D8F2E5); border-color:var(--gpp); }
.section-title {
  font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--t3); margin:0;
}

/* ── КБЖУ ЦЕЛЬ ───────────────────────────────────────────── */
.kcal-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 8px; 
}
.kcal-box {
  background:rgba(255,255,255,.7); border-radius:12px; padding:9px 6px;
  text-align:center; display:flex; flex-direction:column; gap:2px;
  border:1px solid var(--gpp);
}
.kcal-box.main { 
  grid-column: 1 / -1; 
  background: rgba(255, 255, 255, 0.9); 
}
.kcal-val { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:900; color:var(--t1); }
.kcal-box.main .kcal-val { font-size:1.5rem; color:var(--gd); }
.green { color:var(--gd) !important; }
.kcal-lbl { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--t2); }
.bmr-row {
  display:flex; align-items:center; gap:6px; flex-wrap:wrap;
  background:rgba(255,255,255,.6); border-radius:10px; padding:10px 12px;
  border:1px solid var(--gpp);
}
.bmr-item { text-align:center; flex:1; }
.bmr-val { display:block; font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:900; color:var(--t1); }
.val-ok  { color:var(--gd); }
.bmr-lbl { display:block; font-size:.58rem; color:var(--t2); font-weight:600; margin-top:1px; }
.bmr-arrow { color:var(--gpp); font-size:1rem; flex-shrink:0; }
.kcal-formula-note { font-size:.72rem; color:var(--t3); text-align:center; }

/* ── СЛАЙДЕРЫ ────────────────────────────────────────────── */
.slider-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.slider-badge {
  font-size:.88rem; font-weight:800; color:var(--gd);
  background:var(--gp); border:1.5px solid var(--gpp);
  padding:2px 10px; border-radius:20px;
}
input[type=range] {
  -webkit-appearance:none; appearance:none; width:100%; height:6px;
  border-radius:6px; background:var(--surf2); border:none; outline:none; cursor:pointer; display:block;
}
input[type=range]:focus-visible { outline:3px solid var(--g); outline-offset:4px; border-radius:8px; }
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance:none; width:28px; height:28px; border-radius:50%;
  background:linear-gradient(140deg,var(--g),var(--gd));
  border:3px solid #fff; box-shadow:0 2px 8px rgba(69,174,107,.4); cursor:grab;
}
input[type=range]::-moz-range-thumb {
  width:28px; height:28px; border-radius:50%;
  background:linear-gradient(140deg,var(--g),var(--gd));
  border:3px solid #fff; cursor:grab;
}
.slider-minmax { display:flex; justify-content:space-between; margin-top:6px; font-size:.72rem; color:var(--t3); }

/* ── ПОЛ ─────────────────────────────────────────────────── */
.gender-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.gender-btn {
  height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; gap:8px;
  border:1.5px solid var(--bdr); background:var(--surf); color:var(--t2);
  font-size:.9rem; font-weight:700; font-family:inherit; cursor:pointer; transition:all .18s;
}
.gender-btn:hover { border-color:var(--g); background:var(--gp); color:var(--gd); }
.gender-btn.active { border-color:var(--g); background:var(--gp); color:var(--gd); }

/* ── ЦЕЛЬ ────────────────────────────────────────────────── */
.selector-grid { display:grid; gap:8px; }
.selector-grid.cols-3 { grid-template-columns:repeat(3,1fr); }
.selector-grid.cols-2 { grid-template-columns:repeat(2,1fr); }
.selector-opt {
  border-radius:14px; padding:12px 8px; text-align:center;
  border:1.5px solid var(--bdr); background:var(--surf);
  cursor:pointer; transition:all .18s;
  display:flex; flex-direction:column; align-items:center; gap:3px; font-family:inherit;
}
.selector-opt:hover { border-color:var(--g); background:var(--gp); }
.selector-opt.active { border-color:var(--g); background:var(--gp); box-shadow:0 0 0 1px var(--g); }
.selector-opt.active .sel-name { color:var(--gd); }
.selector-opt.batch-active { border-color:var(--amb); background:var(--ambp); }
.selector-opt.batch-active .sel-name { color:var(--amb); }
.sel-ico  { font-size:1.5rem; line-height:1; }
.sel-name { font-size:.78rem; font-weight:800; color:var(--t1); margin-top:2px; }
.sel-sub  { font-size:.62rem; color:var(--t3); line-height:1.3; }

/* ── АКТИВНОСТЬ ──────────────────────────────────────────── */
.activity-list { display:flex; flex-direction:column; gap:7px; }
.activity-opt {
  display:flex; align-items:center; gap:12px; padding:11px 14px;
  border-radius:14px; border:1.5px solid var(--bdr); background:var(--surf);
  cursor:pointer; font-family:inherit; transition:all .18s;
}
.activity-opt:hover { border-color:var(--g); background:var(--gp); }
.activity-opt.active { border-color:var(--g); background:var(--gp); }
.activity-opt.active .act-label { color:var(--gd); }
.act-ico   { font-size:1.3rem; flex-shrink:0; width:26px; text-align:center; }
.act-info  { display:flex; flex-direction:column; gap:1px; }
.act-label { font-size:.9rem; font-weight:700; color:var(--t1); }
.act-sub   { font-size:.74rem; color:var(--t3); }

/* ── BATCH INFO ───────────────────────────────────────────── */
.batch-info {
  display:flex; align-items:flex-start; gap:8px;
  padding:10px 12px; border-radius:12px;
  background:var(--ambp); border:1px solid rgba(217,119,6,.2);
  font-size:.82rem; color:#7C4A03; line-height:1.5;
}
.batch-info-ico { font-size:1rem; flex-shrink:0; margin-top:1px; }

/* ── COOKTIME ─────────────────────────────────────────────── */
.cooktime-row { display:flex; gap:6px; flex-wrap:wrap; }
.cooktime-btn {
  flex:1; min-width:70px; height:36px; border-radius:10px; font-size:.8rem; font-weight:700;
  font-family:inherit; border:1.5px solid var(--bdr); background:var(--surf);
  color:var(--t2); cursor:pointer; transition:all .15s; white-space:nowrap;
}
.cooktime-btn:hover { border-color:var(--g); color:var(--gd); }
.cooktime-btn.active { border-color:var(--g); background:var(--gp); color:var(--gd); }

/* ── СЕМЬЯ ───────────────────────────────────────────────── */
.fam-avatars { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; min-height:48px; }
.fam-av {
  width:44px; height:44px; border-radius:13px;
  display:flex; align-items:center; justify-content:center; font-size:1.3rem;
  border:1.5px solid var(--bdr); transition:transform .2s;
}
.fam-av:last-child { animation:pop-in .25s var(--ease-spring,cubic-bezier(.34,1.56,.64,1)) both; }
@keyframes pop-in { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }
.fam-counter {
  display:flex; align-items:center; justify-content:space-between;
  background:var(--bg); border-radius:14px; padding:8px 12px; border:1.5px solid var(--bdr);
}
.fam-btn {
  width:44px; height:44px; border-radius:12px; border:1.5px solid var(--bdr2);
  background:var(--surf); font-size:1.4rem; font-weight:700; color:var(--t1);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all .15s; flex-shrink:0;
}
.fam-btn:hover  { background:var(--gp); border-color:var(--g); color:var(--gd); }
.fam-btn:active { transform:scale(.92); }
.fam-center { text-align:center; }
.fam-num { font-family:'Playfair Display',serif; font-size:2.2rem; font-weight:900; color:var(--gd); line-height:1; }
.fam-label { font-size:.8rem; color:var(--t2); margin-top:2px; }

/* ── ТЕГИ / ПОЛЯ ─────────────────────────────────────────── */
.field-group { display:flex; flex-direction:column; gap:8px; }
.field-label { font-size:.75rem; font-weight:600; color:var(--t3); }
.tags-wrap   { display:flex; flex-wrap:wrap; gap:8px; }

.field       { display:flex; flex-direction:column; gap:6px; }
.field-input {
  height:48px; border-radius:12px; border:1.5px solid var(--bdr2);
  background:var(--surf2); padding:0 14px; font-size:1rem; color:var(--t1);
  outline:none; transition:all .2s; font-family:inherit; width:100%;
}
.field-input.compact { height:44px; font-size:.95rem; }
.field-input.textarea { height:auto; padding:12px 14px; resize:none; line-height:1.5; }
.field-input:focus { border-color:var(--g); background:var(--surf); }
.field-hint  { font-size:.72rem; color:var(--t3); }

.section-divider {
  font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--t3);
  display:flex; align-items:center; gap:10px;
}
.section-divider::before,.section-divider::after { content:''; flex:1; height:1px; background:var(--bdr); }

/* ── СООБЩЕНИЯ ────────────────────────────────────────────── */
.msg         { padding:12px 16px; border-radius:14px; font-size:.88rem; font-weight:600; }
.msg-error   { background:var(--coralp,#FDF0F0); color:var(--coral,#C94040); }
.msg-success { background:var(--gp); color:var(--gd); }

/* ── АДАПТИВ ─────────────────────────────────────────────── */
@media (max-width:360px) {
  /* В старом коде здесь была сетка 1fr 1fr, теперь оставляем 3 колонки для БЖУ,
     так как 3 цифры отлично влезают на мобилках */
  .selector-grid.cols-3 { grid-template-columns: 1fr; }
  .kcal-grid { grid-template-columns: repeat(3, 1fr); }
  .kcal-box.main { grid-column: 1 / -1; }
}
</style>