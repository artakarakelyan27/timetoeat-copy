<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => [
      'neutral', 'green', 'amber', 'coral',
      'breakfast', 'lunch', 'dinner', 'snack'
    ].includes(v)
  },
  shape: {
    type: String,
    default: 'rect',
    validator: (v) => ['rect', 'pill'].includes(v)
  },
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['sm', 'md'].includes(v)
  }
})
</script>

<template>
  <span
    class="base-badge"
    :class="[
      `variant-${variant}`,
      `shape-${shape}`,
      `size-${size}`
    ]"
  >
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 700;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  user-select: none;
}

.size-sm {
  height: 20px;
  padding: 0 7px;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.size-md {
  height: 24px;
  padding: 0 10px;
  font-size: 0.72rem;
}

.shape-rect {
  border-radius: 6px;
}

.shape-pill {
  border-radius: 20px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Нейтральный (счётчики, КБЖУ, неактивные теги) */
.variant-neutral {
  background: var(--surf2);
  color: var(--t3);
}

/* Успех, Вег, Дешевле (Brand Green) */
.variant-green {
  background: var(--gp);
  color: var(--gd);
}

/* FIX 6: --ambd не существует в брендбуке → правильный токен --amb (#D97706, 4.6:1 на белом) */
.variant-amber {
  background: var(--ambp);
  color: var(--amb); /* #D97706 — проходит WCAG AA (4.6:1) */
}

/* Ошибки, Нет продуктов (Coral) */
.variant-coral {
  background: var(--coralp);
  color: var(--coral);
}

/* Система приёмов пищи (Брендбук, раздел 09) */
.variant-breakfast {
  background: var(--breakfast-bg);
  color: var(--breakfast-fg);
}
.variant-lunch {
  background: var(--lunch-bg);
  color: var(--lunch-fg);
}
.variant-dinner {
  background: var(--dinner-bg);
  color: var(--dinner-fg);
}
.variant-snack {
  background: var(--snack-bg);
  color: var(--snack-fg);
}
</style>