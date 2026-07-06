<script setup>
import { useRecipeEditorStore } from '@/stores/recipeEditor'
import BaseInput from '@/components/atoms/BaseInput.vue'

const store = useRecipeEditorStore()
</script>

<template>
  <div class="step-container" aria-labelledby="step2-title">
    <h2 id="step2-title" class="step-title">Тайминги и порции</h2>
    <p class="step-subtitle">Сколько времени займёт и на сколько человек рассчитано.</p>

    <div class="counter-card">
      <div class="counter-info">
        <div class="counter-title">Количество порций</div>
        <div class="counter-sub">Хватит на всю семью?</div>
      </div>
      <div class="counter-actions" role="group" aria-label="Изменить количество порций">
        <button
          class="cnt-btn"
          @click="store.form.servings = Math.max(1, store.form.servings - 1)"
          aria-label="Уменьшить количество порций"
          :disabled="store.form.servings <= 1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
        <div class="cnt-val" aria-live="polite" aria-atomic="true">{{ store.form.servings }}</div>
        <button
          class="cnt-btn"
          @click="store.form.servings++"
          aria-label="Увеличить количество порций"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>

    <div class="time-grid">
      <div class="form-group">
        <label for="prep-time" class="form-label">Подготовка (мин) <span aria-hidden="true" style="color: var(--coral)">*</span></label>
        <BaseInput id="prep-time" type="number" v-model.number="store.form.prep_time_min" placeholder="15" />
      </div>
      <div class="form-group">
        <label for="cook-time" class="form-label">Готовка (мин) <span aria-hidden="true" style="color: var(--coral)">*</span></label>
        <BaseInput id="cook-time" type="number" v-model.number="store.form.cook_time_min" placeholder="25" />
      </div>
    </div>

    <div
      v-if="store.form.prep_time_min || store.form.cook_time_min"
      class="total-time-hint"
      aria-live="polite"
    >
      Общее время: <strong>{{ (store.form.prep_time_min || 0) + (store.form.cook_time_min || 0) }} мин</strong>
    </div>
  </div>
</template>

<style scoped>
.step-container { animation: fadeIn 0.3s var(--ease-out) forwards; }
.step-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 800; color: var(--t1); margin-bottom: 4px; }
.step-subtitle { font-size: 0.9rem; color: var(--t3); margin-bottom: 28px; }

.form-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; overflow: hidden; }
.form-label { font-size: 0.85rem; font-weight: 700; color: var(--t2); padding-left: 4px; }

.counter-card {
  background: var(--surf);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  box-shadow: var(--sh1);
  border: 1px solid var(--bdr);
}
.counter-title { font-weight: 700; color: var(--t1); margin-bottom: 2px; font-size: 0.95rem; }
.counter-sub { font-size: 0.8rem; color: var(--t3); }

.counter-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--surf2);
  border-radius: 12px;
  padding: 4px;
  border: 1.5px solid var(--bdr);
}

/* FIX 4: cnt-btn полностью стилизована под брендбук — border: none, cursor, touch target */
.cnt-btn {
  width: var(--touch);  /* 44px touch target (Apple HIG) */
  height: var(--touch);
  border-radius: 10px;
  border: none;
  background: var(--surf);
  color: var(--t1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sh1);
  transition: transform 0.1s var(--ease-spring), background 0.15s, box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.cnt-btn:hover:not(:disabled) {
  background: var(--gp);
  color: var(--gd);
  box-shadow: var(--sh2);
}
.cnt-btn:active:not(:disabled) {
  transform: scale(0.92);
  box-shadow: none;
}
.cnt-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}
/* WCAG 2.1 AA: focus-visible для клавиатурной навигации */
.cnt-btn:focus-visible {
  outline: 3px solid var(--g);
  outline-offset: 2px;
}

.cnt-val {
  font-weight: 800;
  font-size: 1.1rem;
  min-width: 32px;
  text-align: center;
  color: var(--t1);
  font-variant-numeric: tabular-nums;
}

.time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 0; }

.total-time-hint {
  margin-top: 16px;
  padding: 12px;
  background: var(--gp);
  color: var(--gd);
  border-radius: 12px;
  text-align: center;
  font-size: 0.9rem;
  border: 1px dashed var(--gpp);
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .step-container { animation: none; }
  .cnt-btn { transition: none; }
}
@media (max-width: 360px) {
  .time-grid {
    grid-template-columns: 1fr;
  }
}
</style>