<script setup>
/**
 * CreateRecipeView.vue — «Время Есть»
 *
 * v1.2 (Этап 2):
 * ✓ submitAll реализован — POST /user-recipes с авторизацией
 * ✓ handleExit идёт назад через router.back() (или на /saved если history пуст),
 *   а не на '/', что приводило к редиректу на /menu для авторизованных
 * ✓ Состояния submitting/error для блокировки кнопки и показа ошибки
 *
 * v1.1 (Этап 1):
 * ✓ FIX-14 — добавлены CSS-стили для .wizard-header, .progress-container,
 *            .step-label, .progress-bar, .progress-fill, .close-btn
 * ✓ FIX-15 — .wizard-content min-height: 0 для корректного overflow в flex
 * ✓ FIX-16 — учтён safe-area-inset-top для .wizard-header (iPhone notch/island)
 */
import { ref } from 'vue'
import { useRecipeEditorStore } from '@/stores/recipeEditor'
import { useMenuStore }         from '@/stores/menuStore'
import { useRouter }            from 'vue-router'
import Step1Base        from '@/components/organisms/recipe-wizard/Step1Base.vue'
import Step2Time        from '@/components/organisms/recipe-wizard/Step2Time.vue'
import Step3Ingredients from '@/components/organisms/recipe-wizard/Step3Ingredients.vue'
import Step4Steps       from '@/components/organisms/recipe-wizard/Step4Steps.vue'
import BaseButton       from '@/components/atoms/BaseButton.vue'
import { useTrack } from '@/composables/useTrack'
const { track, EVENT } = useTrack()

const API_URL = import.meta.env.VITE_API_URL || '/api'

const store     = useRecipeEditorStore()
const menuStore = useMenuStore()
const router    = useRouter()

const submitting = ref(false)
const errorMsg   = ref('')
// Какой режим сабмита сейчас в полёте: 'private' | 'public' | null.
// Нужен чтобы показать «Сохранение…» только на нажатой кнопке, а не на обеих.
const submitMode = ref(null)
// Инлайн-панель успеха — мягче нативного alert(), вписывается в тон бренда.
// После показа автоматически уходит назад через router.back().
const successMsg = ref('')

function handleAction() {
  if (submitting.value) return

  // На промежуточных шагах — обычная валидация и переход вперёд.
  // Финальный сабмит (Сохранить/Опубликовать) обрабатывается через handleSubmit().
  if (validateCurrentStep()) {
    errorMsg.value = ''
    store.nextStep()
  }
}

/**
 * Финальное действие. visibility: 'private' (только в ЛК) или 'public'
 * (на модерацию → после активации в общую ленту).
 */
function handleSubmit(visibility) {
  if (submitting.value) return
  if (!validateCurrentStep()) return
  errorMsg.value = ''

  const recipe = store.recipe
  track(EVENT.RECIPE_CREATE_COMPLETE, {
    visibility,
    category: recipe.category,
    ingredientsCount: recipe.ingredients?.length || 0,
    stepsCount: recipe.steps?.length || 0,
  })

  submitAll(visibility)
}

/**
 * Валидация текущего шага. Возвращает true если данные корректны.
 * Выделена в отдельную функцию, потому что используется и в `Далее`,
 * и в обоих финальных действиях (Сохранить/Опубликовать).
 */
function validateCurrentStep() {
  const f = store.form
  if (store.step === 1) {
    if (!f.title?.trim() || !f.description?.trim() || !f.category || !f.cuisine?.trim()) {
      errorMsg.value = 'Заполните все поля (название, описание, категория, кухня).'
      return false
    }
  } else if (store.step === 2) {
    if (!f.servings || f.prep_time_min == null || f.cook_time_min == null || f.prep_time_min <= 0 || f.cook_time_min <= 0) {
      errorMsg.value = 'Укажите корректное время подготовки и готовки (больше 0).'
      return false
    }
  } else if (store.step === 3) {
    if (!f.ingredients || f.ingredients.length === 0) {
      errorMsg.value = 'Добавьте хотя бы один ингредиент.'
      return false
    }
    const hasEmpty = f.ingredients.some(i => {
      const missingName = !i.name?.trim()
      const missingAmount = i.unit !== 'по вкусу' && (!i.amount || i.amount <= 0)
      return missingName || missingAmount
    })
    if (hasEmpty) {
      errorMsg.value = 'Укажите название и количество для всех ингредиентов (или выберите единицу "по вкусу").'
      return false
    }
  } else if (store.step === 4) {
    if (!f.steps || f.steps.length === 0) {
      errorMsg.value = 'Добавьте хотя бы один шаг приготовления.'
      return false
    }
    if (f.steps.some(s => !s?.trim())) {
      errorMsg.value = 'Опишите каждый шаг или удалите пустые строки.'
      return false
    }
  }
  return true
}

// Оборачиваем шаг назад, чтобы сбрасывать текст ошибки
function goBack() {
  errorMsg.value = ''
  store.prevStep()
}

function handleExit() {
  if (!confirm('Данные не сохранятся. Выйти?')) return
  store.resetForm()
  // Идём назад в истории. Если истории нет (юзер открыл прямо ссылку) —
  // на /saved (там и так есть кнопка «Создать рецепт»). Раньше был router.push('/'),
  // но для авторизованного '/' редиректит обратно на '/menu' через beforeEach.
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/saved')
  }
}

async function submitAll(visibility = 'private') {
  errorMsg.value = ''
  const token = localStorage.getItem('token')
  if (!token) {
    errorMsg.value = 'Нужно войти, чтобы создавать свои рецепты'
    return
  }

  // Чистим payload: пустые ингредиенты и шаги отбрасываем
  const f = store.form
  const ingredients = (f.ingredients || [])
    .filter(i => i?.name && i.name.trim())
    .map(i => ({
      name: i.name.trim(),
      amount: i.amount ?? null,
      unit: i.unit ?? null,
    }))
  const steps = (f.steps || []).map(s => (s || '').trim()).filter(Boolean)

  if (!f.title || !f.title.trim()) {
    errorMsg.value = 'Укажите название рецепта'
    return
  }

  submitting.value = true
  submitMode.value = visibility
  try {
    const res = await fetch(`${API_URL}/user-recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: f.title.trim(),
        description: f.description || null,
        image_url: f.image_url || null,
        category: f.category || null,
        cuisine: f.cuisine || null,
        prep_time_min: f.prep_time_min ?? null,
        cook_time_min: f.cook_time_min ?? null,
        servings: f.servings ?? null,
        ingredients,
        steps,
        tags: Array.isArray(f.tags) ? f.tags : [],
        // visibility: 'private' — рецепт виден только автору в «Мои рецепты».
        // visibility: 'public' — отправляется на модерацию; после одобрения
        // (is_active=True на стороне бэка) попадает в общую ленту /api/recipes.
        // Бэку также передаётся is_public для совместимости с разными неймингами.
        visibility,
        is_public: visibility === 'public',
      }),
    })

    if (!res.ok) {
      const txt = await res.text()
      // FastAPI 422 возвращает {detail: [...]}, 400/403/500 — {detail: "..."}
      let parsed = {}
      try { parsed = JSON.parse(txt) } catch {}
      errorMsg.value = typeof parsed.detail === 'string'
        ? parsed.detail
        : `Не удалось создать рецепт (код ${res.status})`
      return
    }

    await res.json()
    store.resetForm()

    // Обновляем список «Мои рецепты», чтобы только что созданный рецепт
    // появился в SavedView сразу после возврата (а не только при следующем
    // монтировании). fire-and-forget: ошибки не блокируют UI.
    if (typeof menuStore.fetchCreatedRecipes === 'function') {
      menuStore.fetchCreatedRecipes()
    }

    // Инлайн-успех вместо нативного alert(): мягче, в тоне «заботливой подруги».
    successMsg.value = visibility === 'public'
      ? 'Рецепт отправлен на модерацию. После активации он появится в общей ленте.'
      : 'Рецепт сохранён в «Мои рецепты» ✓'

    setTimeout(() => {
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push('/saved')
      }
    }, 1800)
  } catch (e) {
    console.error('[CreateRecipe] submit error', e)
    errorMsg.value = 'Сервер недоступен. Попробуй ещё раз.'
  } finally {
    submitting.value = false
    submitMode.value = null
  }
}
</script>

<template>
  <div class="create-recipe-view">

    <!-- Шапка визарда -->
    <header class="wizard-header">

      <!-- Кнопка закрытия: touch target ≥ 44px через variant="icon" -->
      <BaseButton
        variant="icon"
        size="md"
        class="close-btn"
        ariaLabel="Закрыть и выйти"
        @click="handleExit"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
             aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </BaseButton>

      <!-- Прогресс -->
      <div class="progress-container">
        <span class="step-label">Шаг {{ store.step }} из 4</span>
        <div
          class="progress-bar"
          role="progressbar"
          :aria-valuenow="store.step"
          aria-valuemin="1"
          aria-valuemax="4"
          :aria-label="`Шаг ${store.step} из 4`"
        >
          <div
            class="progress-fill"
            :style="{ width: (store.step / 4 * 100) + '%' }"
          ></div>
        </div>
      </div>

    </header>

    <!-- Контент шага -->
    <main class="wizard-content">
      <Step1Base        v-if="store.step === 1" />
      <Step2Time        v-if="store.step === 2" />
      <Step3Ingredients v-if="store.step === 3" />
      <Step4Steps       v-if="store.step === 4" />

      <!-- Сообщение об ошибке (если есть) -->
      <div v-if="errorMsg" class="error-msg" role="alert">
        {{ errorMsg }}
      </div>

      <!-- Инлайн-успех — мягкая зелёная плашка вместо нативного alert. -->
      <div v-if="successMsg" class="success-msg" role="status" aria-live="polite">
        <span class="success-ico" aria-hidden="true">✓</span>
        <span>{{ successMsg }}</span>
      </div>

      <!-- Кнопки навигации -->
      <div class="action-buttons" :class="{ 'is-last-step': store.isLastStep }">
        <BaseButton
          v-if="store.step > 1"
          variant="secondary"
          class="btn-back"
          :disabled="submitting || !!successMsg"
          @click="goBack"
        >
          Назад
        </BaseButton>

        <!-- Финальный шаг: две независимые кнопки сабмита -->
        <template v-if="store.isLastStep">
          <BaseButton
            variant="secondary"
            class="btn-submit"
            :disabled="submitting || !!successMsg"
            @click="handleSubmit('private')"
          >
            {{ submitting && submitMode === 'private' ? 'Сохранение…' : 'Сохранить' }}
          </BaseButton>
          <BaseButton
            variant="primary"
            class="btn-submit"
            :disabled="submitting || !!successMsg"
            @click="handleSubmit('public')"
          >
            {{ submitting && submitMode === 'public' ? 'Отправка…' : 'Опубликовать' }}
          </BaseButton>
        </template>

        <!-- Промежуточные шаги: одна кнопка «Далее» -->
        <BaseButton
          v-else
          variant="primary"
          :disabled="submitting"
          @click="handleAction"
        >
          Далее
        </BaseButton>
      </div>
    </main>

  </div>
</template>

<style scoped>
/* ─── ROOT LAYOUT ────────────────────────────────────────── */
.create-recipe-view {
  display:         flex;
  flex-direction:  column;
  height:          100%;
  overflow:        hidden;
  background:      var(--bg);
}

/* ─── ШАПКА ВИЗАРДА (FIX-14) ──────────────────────────── */
.wizard-header {
  flex-shrink:   0;
  display:       flex;
  align-items:   center;
  gap:           12px;
  padding:       calc(12px + var(--sat)) var(--sp-lg) 12px;
  background:    var(--surf);
  border-bottom: 1px solid var(--bdr);
  box-shadow:    var(--sh1);
}

.close-btn {
  flex-shrink: 0;
}

.progress-container {
  flex:            1;
  display:         flex;
  flex-direction:  column;
  gap:             6px;
  min-width:       0;
}

.step-label {
  font-size:      0.78rem;
  font-weight:    700;
  color:          var(--t3);
  letter-spacing: 0.02em;
}

.progress-bar {
  height:        6px;
  background:    var(--surf2);
  border-radius: 6px;
  overflow:      hidden;
}

.progress-fill {
  height:        100%;
  background:    linear-gradient(90deg, var(--g), var(--gl));
  border-radius: 6px;
  transition:    width 0.45s var(--ease-out);
}

/* ─── КОНТЕНТ ШАГА (FIX-15) ───────────────────────────── */
.wizard-content {
  flex:            1;
  min-height:      0;
  padding:         var(--sp-xl) var(--sp-lg);
  overflow-y:      auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  display:         flex;
  flex-direction:  column;
  gap:             0;
}
.wizard-content::-webkit-scrollbar { display: none; }

/* Сообщение об ошибке */
.error-msg {
  margin-top:    var(--sp-md, 12px);
  padding:       10px 14px;
  background:    var(--err-bg, #FFF1F0);
  color:         var(--err, #C53030);
  border-radius: 10px;
  font-size:     0.9rem;
  font-weight:   500;
}

/* Инлайн-успех — соответствует тону «заботливой подруги»: тёплая зелёная
   плашка, без alert-окон. Появляется на 1.8 секунды перед автонавигацией. */
.success-msg {
  margin-top:    var(--sp-md, 12px);
  padding:       12px 14px;
  background:    var(--gp);
  color:         var(--gd);
  border:        1px solid var(--gpp);
  border-radius: 10px;
  font-size:     0.92rem;
  font-weight:   500;
  display:       flex;
  align-items:   flex-start;
  gap:           10px;
  animation:     successIn 0.25s var(--ease-out);
}
.success-ico {
  display:        inline-flex;
  align-items:    center;
  justify-content:center;
  flex-shrink:    0;
  width:          22px;
  height:         22px;
  border-radius:  50%;
  background:     var(--g);
  color:          #fff;
  font-weight:    800;
  font-size:      0.85rem;
  line-height:    1;
}
@keyframes successIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Кнопки навигации прижаты к низу внутри wizard-content */
.action-buttons {
  margin-top:  auto;
  padding-top: var(--sp-xl);
  display:     flex;
  gap:         10px;
}

/* Финальный шаг: три кнопки. На узких экранах "Назад" уезжает на свою
   строку, два сабмита остаются в ряд (flex: 1 1 140px) — это даёт
   ≥44px touch target и читаемые лейблы даже на 360-px экранах. */
.action-buttons.is-last-step {
  flex-wrap: wrap;
}
.action-buttons.is-last-step .btn-back {
  flex: 0 0 auto;
}
.action-buttons.is-last-step .btn-submit {
  flex: 1 1 140px;
  min-width: 0;
}

@media (max-width: 380px) {
  /* На совсем узких экранах "Назад" — на отдельной строке во всю ширину,
     чтобы две главные кнопки получили максимум места. */
  .action-buttons.is-last-step .btn-back {
    flex: 1 1 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill { transition: none; }
}
</style>