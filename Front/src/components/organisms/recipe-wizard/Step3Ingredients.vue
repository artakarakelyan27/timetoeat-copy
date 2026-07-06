<script setup>
import { useRecipeEditorStore } from '@/stores/recipeEditor'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const store = useRecipeEditorStore()
</script>

<template>
  <div class="step-container" aria-labelledby="step3-title">
    <h2 id="step3-title" class="step-title">Ингредиенты</h2>
    <p class="step-subtitle">Что понадобится для приготовления?</p>

    <div class="ingredients-list" role="list">
      <div
        v-for="(ing, idx) in store.form.ingredients"
        :key="idx"
        class="ingredient-row"
        role="listitem"
      >
        <div class="ing-col name-col">
          <label :for="'ing-name-'+idx" class="sr-only">Название ингредиента {{ idx + 1 }}</label>
          <BaseInput :id="'ing-name-'+idx" v-model="ing.name" placeholder="Продукт" />
        </div>

        <div class="ing-col amount-col">
          <label :for="'ing-amount-'+idx" class="sr-only">Количество ингредиента {{ idx + 1 }}</label>
          <BaseInput :id="'ing-amount-'+idx" type="number" v-model.number="ing.amount" placeholder="0" />
        </div>

        <div class="ing-col unit-col select-wrapper">
          <label :for="'ing-unit-'+idx" class="sr-only">Единица измерения ингредиента {{ idx + 1 }}</label>
          <select :id="'ing-unit-'+idx" v-model="ing.unit" class="base-select">
            <option>г</option><option>кг</option><option>мл</option>
            <option>л</option><option>шт.</option><option>ст. л.</option>
            <option>ч. л.</option><option>по вкусу</option>
          </select>
          <svg class="select-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>

        <BaseButton
          v-if="store.form.ingredients.length > 1"
          variant="icon"
          class="remove-ing-btn"
          @click="store.form.ingredients.splice(idx, 1)"
          :aria-label="`Удалить ингредиент ${ing.name || idx + 1}`"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </BaseButton>
      </div>
    </div>

    <BaseButton
      variant="secondary"
      class="add-btn"
      @click="store.form.ingredients.push({ name: '', amount: null, unit: 'г' })"
    >
      + Добавить ингредиент
    </BaseButton>
  </div>
</template>

<style scoped>
.step-container { animation: fadeIn 0.3s var(--ease-out) forwards; }
.step-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 800; color: var(--t1); margin-bottom: 4px; }
.step-subtitle { font-size: 0.9rem; color: var(--t3); margin-bottom: 28px; }

.ingredients-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.ingredient-row { display: flex; gap: 8px; align-items: center; }

.name-col { flex: 2; min-width: 0; }
.amount-col { flex: 0.9; min-width: 0; }
.unit-col { flex: 1.1; min-width: 0; }

.select-wrapper { position: relative; display: flex; align-items: center; }
.base-select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  background: var(--surf2);
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 0 28px 0 10px;
  height: var(--touch); /* 44px — Apple HIG touch target */
  color: var(--t1);
  font-size: 16px; /* WCAG: минимум 16px */
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.base-select:hover { background: var(--surf); }

/* FIX 5: убираем outline:none — заменяем на корректный focus-visible (WCAG 2.1 AA) */
.base-select:focus { border-color: var(--g); background: var(--surf); }
.base-select:focus:not(:focus-visible) { outline: none; } /* убираем outline только при клике мышью */
.base-select:focus-visible { outline: 3px solid var(--g); outline-offset: 2px; border-color: var(--g); }

.select-icon { position: absolute; right: 8px; color: var(--t-dis); pointer-events: none; flex-shrink: 0; }

.remove-ing-btn {
  color: var(--coral) !important;
  background: var(--coralp) !important;
  flex-shrink: 0;
}
.remove-ing-btn:hover { background: #FEE2E2 !important; }
.remove-ing-btn:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }

.add-btn {
  width: 100%;
  border-style: dashed;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .step-container { animation: none; }
}
</style>