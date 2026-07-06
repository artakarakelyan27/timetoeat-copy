<script setup>
/**
 * RecipeDetailSheet.vue — «Время Есть» v1.0
 *
 * Универсальный поп-ап (BottomSheet) с деталями рецепта.
 * Эталон взят из MenuView sheets.recipe (.recipe-body, .recipe-hero, .rchip,
 * .recipe-desc, .recipe-section-label, .ing-list, .step-list).
 *
 * ИСПОЛЬЗУЕТСЯ В:
 *   • MenuView   — открытие рецепта из меню недели и picker
 *   • SavedView  — открытие сохранённого / созданного рецепта
 *   • RecipesView — открытие рецепта из Tinder-стека и поиска
 *
 * СТРУКТУРА (по брендбуку «Время Есть»):
 *   • Hero 16:9 — фото или эмодзи на цветном фоне (recipe.bg)
 *   • Чипы pill — время · ккал · Б/Ж/У · вег / быстро
 *   • Описание (опц.) — recipe.desc
 *   • Секция «ИНГРЕДИЕНТЫ» с разделителями-линиями
 *   • Секция «ПРИГОТОВЛЕНИЕ» с зелёными квадратиками номеров шагов
 *   • Footer (slot) — кастомные CTA-кнопки
 *
 * SLOTS:
 *   • footer — кнопки внизу. По дефолту: «🛒 Добавить ингредиенты в список»
 *
 * EVENTS:
 *   • update:modelValue (через v-model)
 *   • add-to-shop(recipe) — клик по дефолтной кнопке footer'а
 *   • close
 *
 * НОРМАЛИЗАЦИЯ ПОЛЕЙ РЕЦЕПТА:
 *   Поддерживаются разные форматы: ings/ingredients, n/name, q/amount, kcal/calories.
 *   Это даёт совместимость со всеми тремя view без миграции данных.
 */
import { computed } from 'vue'
import BaseButton  from '@/components/atoms/BaseButton.vue'
import BottomSheet from '@/components/organisms/BottomSheet.vue'

const isOpen = defineModel({ type: Boolean, default: false })

const props = defineProps({
  recipe:    { type: Object, default: null },
  // Можно скрыть кнопку по умолчанию, если используется кастомный слот footer
  // (по факту достаточно подставить свой слот — дефолт перезаписывается)
})

const emit = defineEmits(['add-to-shop', 'close'])

// ─── НОРМАЛИЗАЦИЯ ПОЛЕЙ ────────────────────────────────────
const ings = computed(() => props.recipe?.ings || props.recipe?.ingredients || [])
const steps = computed(() => props.recipe?.steps || [])
const kcal = computed(() => props.recipe?.kcal || props.recipe?.calories || 0)
const protein = computed(() => props.recipe?.protein || 0)
const fat     = computed(() => props.recipe?.fat || 0)
const carbs   = computed(() => props.recipe?.carbs || 0)

function ingName(ing) { return ing.n || ing.name || '' }
function ingQty(ing) {
  const q = ing.q || ing.amount || ing.quantity || ''
  const u = ing.unit ? ' ' + ing.unit : ''
  return `${q}${u}`.trim()
}

function onAddToShop() {
  emit('add-to-shop', props.recipe)
}

function onClose() {
  emit('close')
}
</script>

<template>
  <BottomSheet
    v-model="isOpen"
    :title="recipe?.name || ''"
    @close="onClose"
  >
    <div v-if="recipe" class="recipe-body">
      <!-- HERO: фото или эмодзи на цветном фоне -->
      <div class="recipe-hero" :style="{ background: recipe.bg || 'var(--gp)' }">
        <img
          v-if="recipe.image"
          :src="recipe.image"
          :alt="recipe.name"
          class="recipe-hero-img"
          loading="lazy"
        />
        <span v-else class="recipe-hero-emoji" aria-hidden="true">
          {{ recipe.emoji || '🍽️' }}
        </span>
      </div>

      <!-- ЧИПЫ: КБЖУ и метки -->
      <div class="recipe-chips">
        <span class="rchip" v-if="recipe.time">⏱ {{ recipe.time }} мин</span>
        <span class="rchip" v-if="kcal">🔥 {{ kcal }} ккал</span>
        <span class="rchip green" v-if="protein">💪 Б {{ protein }}г</span>
        <span class="rchip" v-if="fat">🧈 Ж {{ fat }}г</span>
        <span class="rchip" v-if="carbs">🌾 У {{ carbs }}г</span>
        <span class="rchip green" v-if="recipe.isVeg">🥦 Вег</span>
        <span class="rchip amber" v-if="recipe.isFast">⚡ Быстро</span>
      </div>

      <!-- ОПИСАНИЕ -->
      <p v-if="recipe.desc" class="recipe-desc">{{ recipe.desc }}</p>

      <!-- ИНГРЕДИЕНТЫ -->
      <template v-if="ings.length">
        <div class="recipe-section-label">Ингредиенты</div>
        <div class="ing-list">
          <div
            v-for="(ing, idx) in ings"
            :key="ingName(ing) + idx"
            class="ing-row"
          >
            <span class="ing-name">{{ ingName(ing) }}</span>
            <span class="ing-qty">{{ ingQty(ing) }}</span>
          </div>
        </div>
      </template>

      <!-- ПРИГОТОВЛЕНИЕ -->
      <template v-if="steps.length">
        <div class="recipe-section-label recipe-section-label--mt">Приготовление</div>
        <div class="step-list">
          <div
            v-for="(step, i) in steps"
            :key="i"
            class="step-row"
          >
            <div class="step-n">{{ i + 1 }}</div>
            <div class="step-t">{{ step }}</div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <slot name="footer" :recipe="recipe" :addToShop="onAddToShop">
        <!-- Дефолтный CTA — как в эталонном MenuView -->
        <BaseButton variant="primary" @click="onAddToShop">
          🛒 Добавить ингредиенты в список
        </BaseButton>
      </slot>
    </template>
  </BottomSheet>
</template>

<style scoped>
.recipe-body {
  padding-bottom: 8px;
}

/* ─── HERO 16:9 ─── */
.recipe-hero {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  margin-bottom: 14px;
  overflow: hidden;
  position: relative;
}

.recipe-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.recipe-hero-emoji {
  line-height: 1;
}

/* ─── ЧИПЫ ─── */
.recipe-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 12px;
}

.rchip {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--surf2);
  color: var(--t2);
  border: 1px solid var(--bdr);
  font-variant-numeric: tabular-nums;
}

.rchip.green {
  background: var(--gp);
  color: var(--gd);
  border-color: var(--gpp);
}

.rchip.amber {
  background: var(--ambp);
  color: var(--amb);
  border-color: var(--ambp);
}

/* ─── ОПИСАНИЕ ─── */
.recipe-desc {
  font-size: 0.9rem;
  color: var(--t2);
  line-height: 1.6;
  margin-bottom: 16px;
}

/* ─── ЛЕЙБЛ СЕКЦИИ ─── */
.recipe-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--t3);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recipe-section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--bdr);
}

.recipe-section-label--mt {
  margin-top: 18px;
}

/* ─── ИНГРЕДИЕНТЫ ─── */
.ing-list {
  display: flex;
  flex-direction: column;
}

.ing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid var(--bdr);
  gap: 12px;
}

.ing-row:last-child {
  border-bottom: none;
}

.ing-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--t1);
}

.ing-qty {
  font-size: 0.84rem;
  color: var(--t3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ─── ШАГИ ─── */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-n {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 8px;
  background: var(--gp);
  border: 1.5px solid var(--gpp);
  color: var(--gd);
  font-size: 0.78rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.step-t {
  font-size: 0.88rem;
  color: var(--t2);
  line-height: 1.55;
  padding-top: 3px;
}
</style>