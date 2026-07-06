<script setup>
import { useRecipeEditorStore } from '@/stores/recipeEditor'
import BaseButton from '@/components/atoms/BaseButton.vue'

const store = useRecipeEditorStore()

const availableDietTags = [
  { label: '🥦 Вегетарианское', value: 'vegetarian' },
  { label: '🌾 Без глютена', value: 'gluten-free' },
  { label: '🥛 Без лактозы', value: 'dairy-free' },
  { label: '🍬 Без сахара', value: 'sugar-free' }
]
</script>

<template>
  <div class="step-container" aria-labelledby="step4-title">
    <h2 id="step4-title" class="step-title">Как готовить?</h2>
    <p class="step-subtitle">Опишите процесс по шагам.</p>

    <div class="steps-list" role="list">
      <div v-for="(step, idx) in store.form.steps" :key="idx" class="step-row" role="listitem">

        <div class="step-number" aria-hidden="true">{{ idx + 1 }}</div>

        <div class="step-content">
          <label :for="'step-text-'+idx" class="sr-only">Описание шага {{ idx + 1 }}</label>
          <textarea
            :id="'step-text-'+idx"
            v-model="store.form.steps[idx]"
            class="base-textarea"
            :placeholder="idx === 0 ? 'Напр: Абрикосы промойте, разрежьте пополам...' : 'Что делаем дальше?'"
            rows="3"
          ></textarea>
        </div>

        <BaseButton
          v-if="store.form.steps.length > 1"
          variant="icon"
          class="remove-step-btn"
          @click="store.form.steps.splice(idx, 1)"
          :aria-label="`Удалить шаг ${idx + 1}`"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </BaseButton>
      </div>
    </div>

    <BaseButton variant="secondary" class="add-btn" @click="store.form.steps.push('')">
      + Добавить шаг
    </BaseButton>

    <div class="diet-tags-section">
      <h3 class="diet-title">Особенности блюда</h3>
      <div class="diet-pills" role="group" aria-label="Диетические теги блюда">
        <!--
          v-model биндится на store.form.tags, а не на несуществующее
          diet_tags. Раньше было `v-model="store.form.diet_tags"` — поле
          в сторе не объявлено, Vue v-model на чекбоксе с массивом
          требует, чтобы привязанное значение было массивом, а здесь оно
          undefined. Из-за этого все 4 чекбокса делили общее
          булево-состояние и переключались вместе.
        -->
        <label v-for="tag in availableDietTags" :key="tag.value" class="diet-pill">
          <input type="checkbox" :value="tag.value" v-model="store.form.tags" class="sr-only" />
          <span class="pill-ui">{{ tag.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-container { animation: fadeIn 0.3s var(--ease-out) forwards; padding-bottom: 32px; }
.step-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 800; color: var(--t1); margin-bottom: 4px; }
.step-subtitle { font-size: 0.9rem; color: var(--t3); margin-bottom: 28px; }

.steps-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
.step-row { display: flex; gap: 12px; align-items: flex-start; }

.step-number {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(140deg, var(--g), var(--gd)); /* gradient из брендбука */
  color: var(--surf);
  font-weight: 800; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 8px; box-shadow: var(--sh1); font-size: 0.85rem;
}

.step-content { flex: 1; min-width: 0; }

/* FIX 5: base-textarea — правильный focus-visible (WCAG 2.1 AA) */
.base-textarea {
  width: 100%; background: var(--surf2); border: 1.5px solid transparent; border-radius: 12px;
  padding: 12px 14px; color: var(--t1); font-size: 16px; /* WCAG: минимум 16px */
  font-family: inherit; font-weight: 500;
  transition: border-color 0.2s, background 0.2s;
  resize: vertical;
  min-height: 80px;
}
.base-textarea::placeholder { color: var(--t-dis); font-weight: 400; }
.base-textarea:hover { background: var(--surf); }
.base-textarea:focus { border-color: var(--g); background: var(--surf); }
.base-textarea:focus:not(:focus-visible) { outline: none; }
.base-textarea:focus-visible { outline: 3px solid var(--g); outline-offset: 2px; }

.remove-step-btn {
  margin-top: 4px;
  flex-shrink: 0;
  color: var(--t-dis) !important;
  transition: color 0.15s, background 0.15s;
}
.remove-step-btn:hover { color: var(--coral) !important; background: var(--coralp) !important; }
.remove-step-btn:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }

.add-btn { width: 100%; border-style: dashed; }

/* Диетические теги — Pill компонент из брендбука */
.diet-tags-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--bdr); }
.diet-title { font-size: 0.95rem; font-weight: 700; color: var(--t1); margin-bottom: 12px; }
.diet-pills { display: flex; flex-wrap: wrap; gap: 8px; }

.diet-pill {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.pill-ui {
  display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 20px;
  background: var(--surf2); border: 1.5px solid transparent; color: var(--t2); font-size: 0.85rem;
  font-weight: 600; transition: all 0.2s var(--ease-out);
  /* Минимальный touch target: padding компенсирует, но добавим vertical */
  min-height: 36px;
}
.diet-pill input:checked + .pill-ui {
  background: var(--gp); border-color: var(--gd); color: var(--gd); box-shadow: var(--sh1);
}
/* FIX 5: правильный focus-visible для pill-чекбоксов */
.diet-pill input:focus-visible + .pill-ui {
  outline: 3px solid var(--g);
  outline-offset: 2px;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .step-container { animation: none; }
  .pill-ui { transition: none; }
}
</style>