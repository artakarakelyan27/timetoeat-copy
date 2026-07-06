<script setup>
/**
 * BaseButton.vue — атом «Время Есть»
 *
 * Варианты: primary | secondary | pill | icon | text | danger | outline
 * Размеры:  sm | md | lg | xl  (только для variant="icon")
 *
 * ИЗМЕНЕНИЯ v1.1 (Этап 1):
 * ✓ FIX-05 — удалён дублированный блок .variant-icon (строки 178-190 vs 213-233)
 *            Оставлен один: с размерами .size-*, с hover и flex-центрированием.
 * ✓ FIX-06 — .variant-danger переведён на CSS-токены (--coral, --coralp, --coral-border, --coral-hover)
 *            вместо хардкода #FEF2F2, #C94040, #FCA5A5, #FEE2E2, #F87171.
 * ✓ FIX-07 — добавлен variant="outline" (нужен SavedView — кнопка «Добавить рецепт»)
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  variant: {
    type:    String,
    default: 'primary',
    validator: (v) =>
      ['primary', 'secondary', 'pill', 'icon', 'text', 'danger', 'outline'].includes(v),
  },
  size: {
    type:    String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v),
  },
  to:        { type: [String, Object], default: null },  // Vue Router link
  href:      { type: String,           default: null },  // External link
  disabled:  { type: Boolean,          default: false },
  loading:   { type: Boolean,          default: false },
  isActive:  { type: Boolean,          default: false }, // Для pill-фильтров
  ariaLabel: { type: String,           default: null },
})

// Выбираем HTML-тег динамически
const componentTag = computed(() => {
  if (props.to)   return RouterLink
  if (props.href) return 'a'
  return 'button'
})

// Динамические атрибуты в зависимости от тега
const bindings = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) {
    const isExternal = /^https?:\/\//.test(props.href)
    return isExternal
      ? { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
      : { href: props.href }
  }
  return {
    type:        'button',
    disabled:    props.disabled || props.loading,
    'aria-busy': props.loading ? 'true' : null,
  }
})
</script>

<template>
  <component
    :is="componentTag"
    v-bind="bindings"
    class="base-button"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      { 'is-loading': loading, 'is-active': isActive },
    ]"
    :aria-label="ariaLabel"
  >
    <!-- Спиннер загрузки -->
    <svg
      v-if="loading"
      class="spinner"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
              stroke-linecap="round" stroke-dasharray="16 32"/>
    </svg>

    <!-- Контент (скрывается при загрузке чтобы сохранить ширину) -->
    <span class="content" :class="{ invisible: loading }">
      <slot />
    </span>
  </component>
</template>

<style scoped>
/* ─── БАЗОВЫЕ СТИЛИ ─────────────────────────────────── */
.base-button {
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  gap:             8px;
  font-family:     inherit;
  font-weight:     700;
  text-decoration: none;
  cursor:          pointer;
  border:          none;
  position:        relative;
  transition:
    transform   0.18s var(--ease-spring),
    box-shadow  0.15s,
    background  0.15s,
    border-color 0.15s,
    color        0.15s;
  user-select:                none;
  -webkit-tap-highlight-color: transparent;
  min-height: var(--touch); /* Touch target ≥ 44px (Apple HIG + WCAG 2.5.5) */
}

.base-button:active:not(:disabled) {
  transform: scale(0.96) translateY(0);
}

.base-button:disabled {
  opacity:        0.5;
  pointer-events: none;
  box-shadow:     none !important;
}

/* ─── КОНТЕНТ ────────────────────────────────────────── */
.content {
  display:         inline-flex;
  align-items:     center;
  gap:             inherit;
  width:           100%;
  justify-content: center;
}
.invisible {
  opacity:    0;
  visibility: hidden;
}

/* ─── СПИННЕР ────────────────────────────────────────── */
.spinner {
  position:    absolute;
  left:        50%;
  top:         50%;
  width:       20px;
  height:      20px;
  margin-left: -10px;
  margin-top:  -10px;
  animation:   spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── ВАРИАНТЫ (Брендбук стр. 11) ────────────────────── */

/* 1. Primary (CTA) */
.variant-primary {
  background:    linear-gradient(140deg, var(--g), var(--gd));
  color:         var(--surf);
  border-radius: 15px;
  height:        50px;
  width:         100%;
  box-shadow:    var(--sh-cta);
  font-size:     1rem;
}
.variant-primary:hover:not(:disabled) {
  transform:  translateY(-1px);
  box-shadow: 0 6px 20px rgba(69, 174, 107, 0.4);
}

/* 2. Secondary */
.variant-secondary {
  background:    var(--gp);
  color:         var(--gd);
  border:        1.5px solid var(--gpp);
  border-radius: 15px;
  height:        var(--touch);
  width:         100%;
  font-size:     0.9rem;
}
.variant-secondary:hover:not(:disabled) {
  background: var(--gpp);
}

/* 3. Outline (FIX-07: новый вариант для SavedView) */
.variant-outline {
  background:    transparent;
  color:         var(--gd);
  border:        1.5px dashed var(--bdr2);
  border-radius: 15px;
  height:        var(--touch);
  width:         100%;
  font-size:     0.9rem;
}
.variant-outline:hover:not(:disabled) {
  background:    var(--gp);
  border-color:  var(--g);
}

/* 4. Pill / Filter */
.variant-pill {
  background:    var(--surf2);
  color:         var(--t2);
  border-radius: 22px;
  height:        44px;
  min-height:    44px;
  padding:       0 16px;
  font-size:     0.85rem;
  font-weight:   600;
  border:        1px solid transparent;
}
.variant-pill:hover:not(:disabled) {
  background: var(--bdr);
}
.variant-pill.is-active {
  background:   var(--g);
  color:        var(--surf);
  box-shadow:   0 2px 8px rgba(69, 174, 107, 0.3);
  border-color: var(--gd);
}

/* 5. Icon button
   FIX-05: объединён в ОДИН блок (раньше было два конфликтующих)
   Размеры через .size-* модификаторы */
.variant-icon {
  background:    transparent;
  color:         var(--t3);
  border-radius: 50%;
  padding:       0;
  display:       flex;
  align-items:   center;
  justify-content: center;
}
/* Размеры (FIX-05: убран дублирующий блок без размеров) */
.variant-icon.size-sm { width: 36px; height: 36px; }
.variant-icon.size-md { width: 48px; height: 48px; } /* Стандарт Apple HIG */
.variant-icon.size-lg { width: 64px; height: 64px; }
.variant-icon.size-xl { width: 72px; height: 72px; }

.variant-icon:hover:not(:disabled) {
  background: var(--surf2);
  color:      var(--t1);
}

/* 6. Text button */
.variant-text {
  background: transparent;
  color:      var(--gd);
  height:     auto;
  min-height: auto;
  padding:    4px 8px;
  font-size:  0.9rem;
}
.variant-text:hover:not(:disabled) {
  color:           var(--t1);
  text-decoration: underline;
}

/* 7. Danger (FIX-06: хардкод → токены)  */
.variant-danger {
  background:    var(--coralp);         /* было: #FEF2F2  */
  color:         var(--coral);          /* было: #C94040  */
  border:        1.5px solid var(--coral-border); /* было: #FCA5A5  */
  border-radius: 16px;
  height:        50px;
  width:         100%;
  font-size:     1rem;
  transition:    background 0.15s, border-color 0.15s;
}
.variant-danger:hover:not(:disabled) {
  background:   var(--coral-hover);  /* было: #FEE2E2  */
  border-color: var(--coral);        /* было: #F87171  */
}

/* ─── REDUCED MOTION ─────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
  .base-button {
    transition: none;
  }
  .base-button:active:not(:disabled) {
    transform: none;
  }
}
</style>
