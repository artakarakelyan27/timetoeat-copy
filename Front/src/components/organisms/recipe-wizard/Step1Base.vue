<script setup>
import { useRecipeEditorStore } from '@/stores/recipeEditor'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const store = useRecipeEditorStore()

// FIX 7: обработчик клавиатуры для photo-upload с role="button"
const handlePhotoKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    // Здесь можно открыть file picker
    document.getElementById('photo-file-input')?.click()
  }
}
</script>

<template>
  <div class="step-container" aria-labelledby="step1-title">
    <h2 id="step1-title" class="step-title">С чего начнём?</h2>
    <p class="step-subtitle">Самое главное — красивое название и фото.</p>

    <!-- FIX 7: добавлены @keydown для Enter/Space — WCAG 2.1 AA (2.1.1 Keyboard) -->
    <div
      class="photo-upload"
      role="button"
      tabindex="0"
      aria-label="Загрузить фото блюда"
      @click="document.getElementById('photo-file-input').click()"
      @keydown="handlePhotoKeydown"
    >
      <!-- Скрытый file input -->
      <input
        id="photo-file-input"
        type="file"
        accept="image/*"
        class="sr-only"
        aria-hidden="true"
        tabindex="-1"
        @change="(e) => {
          const file = e.target.files[0]
          if (file) store.form.image_url = URL.createObjectURL(file)
        }"
      />

      <div v-if="store.form.image_url" class="photo-preview">
        <img :src="store.form.image_url" alt="Предпросмотр фото рецепта" />
        <BaseButton
          variant="icon"
          class="remove-photo"
          @click.stop="store.form.image_url = ''"
          aria-label="Удалить фото"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </BaseButton>
      </div>

      <div v-else class="photo-placeholder">
        <span class="photo-icon" aria-hidden="true">📸</span>
        <span>Добавить фото</span>
      </div>
    </div>

    <div class="form-group">
      <label for="recipe-title" class="form-label">Название блюда <span aria-hidden="true" style="color: var(--coral)">*</span><span class="sr-only">(обязательное поле)</span></label>
      <BaseInput id="recipe-title" v-model="store.form.title" placeholder="Напр: Запеченные котлеты" required autocomplete="off" />
    </div>

    <div class="form-group">
      <label for="recipe-desc" class="form-label">Короткое описание <span aria-hidden="true" style="color: var(--coral)">*</span><span class="sr-only">(обязательное поле)</span></label>
      <textarea id="recipe-desc" v-model="store.form.description" class="base-textarea" placeholder="Пару слов о том, почему это вкусно..." rows="3"></textarea>
    </div>

    <div class="form-row">
      <div class="form-group flex-1">
        <label for="recipe-category" class="form-label">Категория <span aria-hidden="true" style="color: var(--coral)">*</span><span class="sr-only">(обязательное поле)</span></label>
        <div class="select-wrapper">
          <select id="recipe-category" v-model="store.form.category" class="base-select">
            <option value="" disabled>Выберите...</option>
            <option value="завтраки">Завтраки</option>
            <option value="вторые блюда">Вторые блюда</option>
            <option value="супы">Супы</option>
            <option value="десерты">Десерты</option>
            <option value="закуски">Закуски</option>
          </select>
          <svg class="select-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>
      <div class="form-group flex-1">
        <label for="recipe-cuisine" class="form-label">Кухня <span aria-hidden="true" style="color: var(--coral)">*</span><span class="sr-only">(обязательное поле)</span></label>
        <BaseInput id="recipe-cuisine" v-model="store.form.cuisine" placeholder="Напр: русская" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-container { animation: fadeIn 0.3s var(--ease-out) forwards; }
.step-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 800; color: var(--t1); margin-bottom: 4px; }
.step-subtitle { font-size: 0.9rem; color: var(--t3); margin-bottom: 28px; }

.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; min-width: 0; }
.form-label { font-size: 0.85rem; font-weight: 700; color: var(--t2); padding-left: 4px; }

/* FIX 5: textarea — корректный focus-visible */
.base-textarea {
  width: 100%; background: var(--surf2); border: 1.5px solid transparent; border-radius: 12px;
  padding: 12px 14px; color: var(--t1); font-size: 16px; font-family: inherit; font-weight: 500;
  transition: border-color 0.2s, background 0.2s; resize: vertical;
}
.base-textarea::placeholder { color: var(--t-dis); font-weight: 400; }
.base-textarea:hover { background: var(--surf); }
.base-textarea:focus { border-color: var(--g); background: var(--surf); }
.base-textarea:focus:not(:focus-visible) { outline: none; }
.base-textarea:focus-visible { outline: 3px solid var(--g); outline-offset: 2px; }

/* Select */
.select-wrapper { position: relative; display: flex; align-items: center; }
.base-select {
  width: 100%; appearance: none; -webkit-appearance: none;
  background: var(--surf2); border: 1.5px solid transparent; border-radius: 12px;
  padding: 0 36px 0 14px; height: var(--touch); /* 44px */
  color: var(--t1); font-size: 16px; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: all 0.2s;
}
.base-select:hover { background: var(--surf); }
.base-select:focus { border-color: var(--g); background: var(--surf); }
.base-select:focus:not(:focus-visible) { outline: none; }
.base-select:focus-visible { outline: 3px solid var(--g); outline-offset: 2px; }
.select-icon { position: absolute; right: 12px; color: var(--t-dis); pointer-events: none; }

/* Фото */
.photo-upload {
  width: 100%; aspect-ratio: 16/9; background: var(--surf2); border: 2px dashed var(--bdr2);
  border-radius: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; position: relative; transition: border-color 0.2s, background 0.2s;
}
.photo-upload:hover { border-color: var(--g); background: var(--surf); }
/* FIX 7: focus-visible для photo-upload (WCAG 2.1 AA) */
.photo-upload:focus-visible { outline: 3px solid var(--g); outline-offset: 2px; border-color: var(--g); }

.photo-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--t3); font-weight: 600; }
.photo-icon { font-size: 2rem; }
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.remove-photo {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.55); color: #fff; backdrop-filter: blur(4px);
  border-radius: 50%; width: var(--touch); height: var(--touch);
  display: flex; align-items: center; justify-content: center;
}
.remove-photo:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .step-container { animation: none; }
  .photo-upload, .base-textarea, .base-select { transition: none; }
}
</style>