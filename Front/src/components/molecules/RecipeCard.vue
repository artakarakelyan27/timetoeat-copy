<script setup>
import { computed } from 'vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'

const props = defineProps({
  recipe: { type: Object, required: true },
  // ДОБАВЛЕН 'compact' для меню и списков
  layout: { 
    type: String, 
    default: 'compact', 
    validator: v => ['feed', 'stack', 'compact'].includes(v) 
  }
})

const emit = defineEmits(['click'])

const mealTypeLabel = computed(() => {
  const map = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус' }
  return map[props.recipe.type] || 'Блюдо'
})

const ariaLabel = computed(() => {
  const r = props.recipe
  let label = `Рецепт: ${r.name}. `
  if (r.time) label += `Время: ${r.time} минут. `
  if (r.kcal) label += `${r.kcal} калорий. `
  return label
})
</script>

<template>
  <button
    type="button"
    class="recipe-card"
    :class="`layout-${layout}`"
    :aria-label="ariaLabel"
    @click="emit('click', recipe.id)"
  >
    <!-- ЗОНА ИЗОБРАЖЕНИЯ -->
    <div class="card-image-wrap">
      <img v-if="recipe.image" :src="recipe.image" :alt="recipe.name" class="card-image" loading="lazy" />
      <div v-else class="card-placeholder" :style="{ backgroundColor: recipe.bg || 'var(--gp)' }" aria-hidden="true">
        <span class="placeholder-emoji">{{ recipe.emoji || '🍽️' }}</span>
      </div>
      <slot name="overlays" />
    </div>

    <!-- ТЕЛО КАРТОЧКИ -->
    <div class="card-body">
      <!-- Теги скрываем в компактном виде для экономии места -->
      <div v-if="layout !== 'compact'" class="card-tags">
        <BaseBadge :variant="recipe.type" shape="rect" size="sm">{{ mealTypeLabel }}</BaseBadge>
        <BaseBadge v-if="recipe.isVeg" variant="green" shape="rect" size="sm">🥦 Вег</BaseBadge>
        <BaseBadge v-if="recipe.isFast" variant="amber" shape="rect" size="sm">⚡ до 30 мин</BaseBadge>
      </div>

      <h3 class="card-title">{{ recipe.name }}</h3>
      
      <!-- Описание показываем только в свайпах или крупном feed -->
      <p v-if="recipe.desc && layout !== 'compact'" class="card-desc">{{ recipe.desc }}</p>

      <div class="card-meta">
        <!-- В компактном виде добавляем бейдж типа приема пищи сюда -->
        <span v-if="layout === 'compact'" class="meta-item type-badge">
          {{ mealTypeLabel }}
        </span>
        <span v-if="layout === 'compact'" class="meta-dot">·</span>

        <span v-if="recipe.time" class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {{ recipe.time }} мин
        </span>
        
        <span v-if="recipe.time && recipe.kcal" class="meta-dot">·</span>

        <span v-if="recipe.kcal" class="meta-item kcal-item">
          <!-- Исправлена иконка на настоящий огонь (flame) -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
          {{ recipe.kcal }} ккал
        </span>
      </div>

      <div v-if="$slots.footer" class="card-footer"><slot name="footer" /></div>
    </div>
  </button>
</template>

<style scoped>
.recipe-card {
  display: flex;
  background: var(--surf);
  border-radius: 16px; /* Чуть увеличил скругление по M3 */
  box-shadow: var(--sh1);
  border: 1px solid var(--bdr);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), border-color 0.2s;
  user-select: none; 
  -webkit-tap-highlight-color: transparent;
}

.recipe-card:active { transform: scale(0.98); }
.recipe-card:focus-visible { outline: 2px solid var(--g); outline-offset: 2px; }

/* ── 1. COMPACT LAYOUT (НОВЫЙ - Для списков меню) ── */
.layout-compact {
  flex-direction: row; /* Картинка слева, текст справа */
  align-items: center;
  padding: 12px;
  gap: 12px;
}
.layout-compact .card-image-wrap {
  width: 72px; 
  height: 72px;
  border-radius: 12px;
  flex-shrink: 0;
}
.layout-compact .placeholder-emoji { font-size: 2.2rem; }
.layout-compact .card-body { padding: 0; min-width: 0; justify-content: center; }
.layout-compact .card-title { font-size: 1rem; margin-bottom: 6px; -webkit-line-clamp: 2; }
.layout-compact .card-meta { margin-top: 0; font-size: 0.75rem; color: var(--t3); gap: 4px; }


/* ── 2. FEED LAYOUT (Вертикальная, но не огромная) ── */
.layout-feed {
  flex-direction: column;
}
.layout-feed .card-image-wrap {
  aspect-ratio: 16 / 9;
}
.layout-feed .placeholder-emoji { font-size: 3.5rem; }
.layout-feed .card-body { padding: 12px 14px 14px; }
.layout-feed .card-title { font-size: 1.15rem; -webkit-line-clamp: 2; }
.layout-feed .card-desc { font-size: 0.85rem; -webkit-line-clamp: 2; margin-bottom: 12px; }


/* ── 3. STACK LAYOUT (Свайпы Tinder) ── */
.layout-stack {
  flex-direction: column;
  height: 100%;
}
.layout-stack .card-image-wrap { height: 50%; }
.layout-stack .placeholder-emoji { font-size: 6rem; }
.layout-stack .card-body { padding: 16px 20px; overflow-y: auto; scrollbar-width: none; }
.layout-stack .card-body::-webkit-scrollbar { display: none; }
.layout-stack .card-title { font-size: 1.4rem; -webkit-line-clamp: initial; }
.layout-stack .card-desc { font-size: 0.95rem; -webkit-line-clamp: initial; }


/* ── ОБЩИЕ СТИЛИ (IMAGE & BODY) ── */
.card-image-wrap { position: relative; background: var(--surf2); overflow: hidden; }
.card-image { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.card-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none; }

.card-body { display: flex; flex-direction: column; flex: 1; }

.card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }

.card-title {
  font-family: 'Playfair Display', serif;
  font-weight: 800;
  color: var(--t1);
  line-height: 1.25;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc { color: var(--t3); line-height: 1.4; }

.card-meta {
  display: flex; align-items: center; flex-wrap: wrap;
  margin-top: auto; font-weight: 600; 
}

.meta-item { display: inline-flex; align-items: center; gap: 4px; }
.meta-item svg { color: var(--t-dis); }
.kcal-item svg { color: var(--amb); }
.meta-dot { color: var(--bdr2); margin: 0 2px; }
.type-badge { color: var(--gd); background: var(--gp); padding: 2px 6px; border-radius: 6px; font-size: 0.7rem;}
</style>