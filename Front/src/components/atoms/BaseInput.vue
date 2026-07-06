<script setup>
import { ref, computed, useId } from 'vue'

// В Vue 3.4+ это самый чистый способ работы с v-model
const modelValue = defineModel()

const props = defineProps({
  type: { type: String, default: 'text' },         // text, number, email, search, tel
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },

  // Может быть Boolean (просто красная рамка) или String (выведет текст ошибки)
  error: { type: [Boolean, String], default: false },

  // Уникальный ID для связи с <label> (a11y)
  id: { type: String, default: null },

  // Обязательно для скринридеров, если нет видимого <label>
  ariaLabel: { type: String, default: null }
})

// useId() — SSR-стабильный уникальный ID (Vue 3.5+)
const _generatedId = useId()
const fieldId = computed(() => props.id || _generatedId)

// Отслеживаем фокус для стилизации обёртки
const isFocused = ref(false)
</script>

<template>
  <div class="base-input-wrapper">
    <div
      class="input-container"
      :class="{
        'is-focused': isFocused,
        'is-disabled': disabled,
        'has-error': error,
        'has-suffix': $slots.suffix,
      }"
    >
      <!-- Слот для иконки слева (например, лупа поиска) -->
      <span v-if="$slots.prefix" class="icon-slot prefix" aria-hidden="true">
        <slot name="prefix" />
      </span>

      <!-- Сам инпут -->
      <input
        :id="fieldId"
        v-model="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel || placeholder"
        :aria-invalid="!!error"
        class="base-input"
        @focus="isFocused = true"
        @blur="isFocused = false"
        v-bind="$attrs"
      />
      
      <!-- Слот для иконки справа (например, очистка или кнопка "Ок") -->
      <span v-if="$slots.suffix" class="icon-slot suffix">
        <slot name="suffix" />
      </span>
    </div>
    
    <!-- Текст ошибки (WCAG: aria-live озвучит ошибку при её появлении) -->
    <span v-if="typeof error === 'string'" class="error-text" aria-live="polite">
      {{ error }}
    </span>
  </div>
</template>

<style scoped>
.base-input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* ─── КОНТЕЙНЕР (Выглядит как инпут, Брендбук стр. 12) ─── */
.input-container {
  display: flex;
  align-items: center;
  height: 44px; /* Apple HIG: минимальный touch target */
  border-radius: 12px;
  background: var(--surf2); /* #F0F5F1 */
  border: 1.5px solid transparent;
  transition: border-color 0.2s var(--ease-out), background 0.2s var(--ease-out);
  overflow: hidden;
}

/* Состояния */
.input-container.is-focused {
  border-color: var(--g);
  background: var(--surf);
}

.input-container.has-error {
  border-color: var(--coral);
  background: var(--coralp);
}

.input-container.is-disabled {
  opacity: 0.6;
  pointer-events: none;
  background: var(--bg);
}

/* ─── САМ ИНПУТ (Прозрачный) ─── */
.base-input {
  flex: 1;
  min-width: 0; /* Предотвращает overflow во flexbox */
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 14px;
  
  font-family: inherit;
  font-size: 16px; /* ВАЖНО: 16px предотвращает авто-зум на iOS Safari */
  color: var(--t1);
  font-weight: 500;
}

.base-input::placeholder {
  color: var(--t-dis);
  font-weight: 400;
}

/* Корректировка отступов текста, если есть иконки */
.prefix + .base-input {
  padding-left: 8px;
}
.input-container.has-suffix .base-input {
  padding-right: 8px;
}

/* ─── ИКОНКИ (Слоты) ─── */
.icon-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--t-dis);
  flex-shrink: 0;
}

.icon-slot.prefix { padding-left: 14px; }
.icon-slot.suffix { padding-right: 8px; } /* Меньше, т.к. кнопки обычно имеют свой паддинг */

/* ─── ТЕКСТ ОШИБКИ ─── */
.error-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--coral);
  margin-top: 6px;
  margin-left: 4px;
}
</style>