<script setup>
import { computed } from 'vue'

const props = defineProps({
  recipe: {
    type: Object,
    required: true
  },
  // 'breakfast', 'lunch', 'dinner', 'snack'
  mealType: {
    type: String,
    required: true
  }
})

// Отправляем ID рецепта и тип приёма пищи наверх
const emit = defineEmits(['click'])

// Цвета и локализация из Брендбука (Раздел 09: Цветовая система приёмов пищи)
const mealMeta = computed(() => {
  const map = {
    breakfast: { label: 'Завтрак', bg: 'var(--breakfast-bg)', fg: 'var(--breakfast-fg)' },
    lunch:     { label: 'Обед',    bg: 'var(--lunch-bg)',     fg: 'var(--lunch-fg)' },
    dinner:    { label: 'Ужин',    bg: 'var(--dinner-bg)',    fg: 'var(--dinner-fg)' },
    snack:     { label: 'Перекус', bg: 'var(--snack-bg)',     fg: 'var(--snack-fg)' }
  }
  return map[props.mealType] || map.dinner
})

// Строка для скринридеров (a11y)
const ariaLabel = computed(() => {
  const r = props.recipe
  const t = mealMeta.value.label
  let txt = `${t}. ${r.name}. `
  if (r.time) txt += `Время: ${r.time} мин. `
  if (r.kcal) txt += `${r.kcal} калорий.`
  return txt
})
</script>

<template>
  <div
    class="meal-row"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    @click="emit('click', recipe.id, mealType)"
    @keydown.enter.space.prevent="emit('click', recipe.id, mealType)"
  >
    <!-- Иконка блюда с фоном приёма пищи -->
    <div class="meal-ico" :style="{ background: mealMeta.bg }" aria-hidden="true">
      {{ recipe.emoji || '🍽️' }}
    </div>
    
    <!-- Текстовая информация -->
    <div class="meal-info">
      <div class="meal-type" :style="{ color: mealMeta.fg }">
        {{ mealMeta.label }}
      </div>
      <div class="meal-name" :title="recipe.name">{{ recipe.name }}</div>
      
      <div class="meal-meta" aria-hidden="true">
        <span v-if="recipe.time">{{ recipe.time }} мин</span>
        <span v-if="recipe.time && recipe.kcal" class="separator">·</span>
        <span v-if="recipe.kcal">{{ recipe.kcal }} ккал</span>
      </div>
    </div>

    <!-- Иконка перетаскивания (Drag Handle) -->
    <div class="drag-handle" aria-hidden="true" title="Перетащить блюдо">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
      </svg>
    </div>

    <!-- Иконка-шеврон (переход к деталям) -->
    <div class="meal-chevron" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </div>
  </div>

</template>

<style scoped>
/* ─── КАРТОЧКА СТРОКИ ─── */
.meal-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--surf);
  cursor: pointer;
  min-height: 64px; /* Apple HIG: С запасом перекрывает 44px */
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s var(--ease-out), box-shadow 0.15s;
}

.meal-row:not(:last-child) {
  border-bottom: 1px solid var(--bdr);
}

/* Состояния наведения и фокуса */
.meal-row:hover, .meal-row:focus-visible {
  background: var(--bg);
}

.meal-row:active {
  background: var(--gp); /* При тапе легкая зелёная заливка */
}

/* ─── ИКОНКА (Эмодзи) ─── */
.meal-ico {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

/* ─── ИНФОРМАЦИЯ ─── */
.meal-info {
  flex: 1;
  min-width: 0; /* Фикс переполнения текста во flexbox */
}

.meal-type {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 2px;
}

.meal-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--t1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* Обрезает длинные названия: "Суп с..." */
}

.meal-meta {
  font-size: 0.76rem;
  color: var(--t3);
  margin-top: 1px;
}

.separator {
  margin: 0 4px;
  opacity: 0.5;
}

/* ─── ШЕВРОН (Навигация) ─── */
.meal-chevron {
  color: var(--t-dis);
  flex-shrink: 0;
  transition: transform 0.18s var(--ease-spring), color 0.15s;
}

.meal-row:hover .meal-chevron,
.meal-row:focus-visible .meal-chevron {
  transform: translateX(4px);
  color: var(--g);
}

/* ─── ИКОНКА ПЕРЕТАСКИВАНИЯ (Drag & Drop) ─── */
.drag-handle {
  position: absolute;
  right: 44px; /* Стоит перед шевроном */
  top: 50%;
  transform: translateY(-50%);
  color: var(--t-dis);
  padding: 8px; /* Расширяем touch-зону */
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Показываем ручку перетаскивания только при hover (для десктопа) */
.meal-row:hover .drag-handle,
.meal-row:focus-visible .drag-handle {
  opacity: 1;
}
.drag-handle:hover {
  color: var(--gd);
}

/* ─── СОСТОЯНИЯ DRAG & DROP ─── */
/* Класс, который родитель повесит при перетаскивании (.is-dragging) */
.meal-row.is-dragging {
  opacity: 0.4;
  background: var(--surf2);
}

/* Класс, когда над элементом зависли (.drag-over) */
.meal-row.drag-over {
  background: var(--gp) !important;
  box-shadow: inset 0 0 0 2px var(--g);
  border-radius: 12px;
  border-bottom: transparent;
  z-index: 2; /* Чтобы box-shadow не перекрывался соседями */
}

/* Адаптация для мобильных: ручку перетаскивания видно всегда, так как hover нет */
@media (hover: none) {
  .drag-handle {
    opacity: 1;
  }
}
</style>