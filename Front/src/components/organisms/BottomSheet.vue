<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

// Управляем видимостью через v-model
const isOpen = defineModel({ type: Boolean, default: false })

const props = defineProps({
  title: { type: String, default: '' },
  // Если true, модалку нельзя закрыть свайпом или кликом по фону (например, при загрузке)
  persistent: { type: Boolean, default: false } 
})

const emit = defineEmits(['close'])

// Ссылки на DOM
const sheetRef = ref(null)
const scrollableRef = ref(null)

// ─── ЛОКАЛЬНЫЙ СТЕЙТ ДЛЯ СВАЙПОВ (TOUCH GESTURES) ───
const isDragging = ref(false)
const startY = ref(0)
const currentY = ref(0)
const dragOffset = ref(0)

// ─── ЛОГИКА БЛОКИРОВКИ СКРОЛЛА BODY ───
watch(isOpen, async (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    // Фокус для скринридеров и доступности
    await nextTick()
    const closeBtn = document.getElementById('sheet-close-btn')
    if (closeBtn) closeBtn.focus()
  } else {
    document.body.style.overflow = ''
    dragOffset.value = 0 // Сбрасываем сдвиг при закрытии
  }
})

// ─── ЛОГИКА ЗАКРЫТИЯ ───
function closeSheet() {
  if (props.persistent) return
  isOpen.value = false
  emit('close')
}

function handleBackdropClick() {
  closeSheet()
}

function handleKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) closeSheet()
}

// ─── ЖЕСТЫ СВАЙПА (Touch Events) ───
// Свайп работает только на header-зоне (handle + заголовок)
// или на content-зоне когда скролл в самом верху
function onTouchStart(e) {
  if (props.persistent) return
  isDragging.value = true
  startY.value = e.touches[0].clientY
  currentY.value = startY.value
  dragOffset.value = 0
}

function onTouchMove(e) {
  if (!isDragging.value) return

  // Если контент прокручен — не перехватываем, даём скроллиться
  if (scrollableRef.value && scrollableRef.value.scrollTop > 0) {
    isDragging.value = false
    dragOffset.value = 0
    return
  }

  currentY.value = e.touches[0].clientY
  const delta = currentY.value - startY.value

  // Свайп только вниз
  if (delta > 0) {
    dragOffset.value = delta
    // Блокируем скролл страницы только при свайпе-закрытии
    if (e.cancelable) e.preventDefault()
  } else {
    // Свайп вверх — сбрасываем drag, отдаём контролю скроллу
    isDragging.value = false
    dragOffset.value = 0
  }
}

function onTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false

  // Если свайпнули вниз больше чем на 100px — закрываем
  if (dragOffset.value > 100) {
    closeSheet()
  } else {
    // Иначе возвращаем обратно (пружиним)
    dragOffset.value = 0
  }
}

// ─── ЖИЗНЕННЫЙ ЦИКЛ ───
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = '' // Страховка при уничтожении компонента
})
</script>

<template>
  <!-- Teleport переносит модалку в корень <body>, избегая проблем с z-index и overflow -->
  <Teleport to="body">
    <Transition name="fade">
      <!-- ФОН (Backdrop) -->
      <div 
        v-if="isOpen" 
        class="sheet-backdrop" 
        aria-hidden="true"
        @click="handleBackdropClick"
      ></div>
    </Transition>

    <Transition name="slide-up">
      <!-- САМА МОДАЛКА -->
      <div 
        v-if="isOpen"
        ref="sheetRef"
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'sheet-title' : null"
        :class="{ 'is-dragging': isDragging }"
        :style="dragOffset > 0 ? { '--drag-y': dragOffset + 'px' } : {}"
      >
        <!-- ЗОНА ДЛЯ СВАЙПА И ШАПКА -->
        <div 
          class="sheet-header-area"
          @touchstart.passive="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- Ручка для перетаскивания (Handle) -->
          <div class="sheet-handle" aria-hidden="true"></div>

          <!-- Шапка (Заголовок + кнопка Закрыть) -->
          <div class="sheet-header">
            <div class="sheet-title-wrapper">
              <slot name="header">
                <h2 v-if="title" id="sheet-title" class="sheet-title">{{ title }}</h2>
              </slot>
            </div>
            
            <BaseButton 
              v-if="!persistent"
              id="sheet-close-btn"
              variant="icon" 
              ariaLabel="Закрыть"
              @click="closeSheet"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </BaseButton>
          </div>
        </div>

        <!-- ПРОКРУЧИВАЕМЫЙ КОНТЕНТ -->
        <!-- Свайп-закрытие НЕ вешаем на content — иначе мешает внутреннему скроллу -->
        <!-- Свайп работает через sheet-header-area (handle + заголовок) -->
        <div 
          ref="scrollableRef" 
          class="sheet-content"
        >
          <slot />
        </div>

        <!-- ФИКСИРОВАННЫЙ ФУТЕР (Например, кнопка "Сохранить") -->
        <div v-if="$slots.footer" class="sheet-footer">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── АНИМАЦИИ VUE TRANSITION ─── */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s var(--ease-out);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.35s var(--ease-out);
}
.slide-up-enter-from, .slide-up-leave-to {
  /* Для десктопа и мобилки трансформ отличается, зададим базовый */
  transform: translateY(100%);
}

@media (min-width: 600px) {
  .slide-up-enter-from, .slide-up-leave-to {
    transform: translate(-50%, 100%); /* На десктопе по центру экрана */
  }
}

/* ─── БЕКДРОП (Фон) ─── */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  /* z-index: 300 — ВЫШЕ BottomNav (90) и AppTopbar (100), 
     чтобы модалка перекрывала навигацию */
  z-index: 300;
  background: rgba(26, 46, 34, 0.48);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ─── САМ BOTTOM SHEET ─── */
.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 301;
  display: flex;
  flex-direction: column;
  background: var(--surf);
  border-radius: 24px 24px 0 0;
  box-shadow: var(--sh3);
  max-height: 90dvh; 
  padding-bottom: var(--sab);
  will-change: transform;
  /* Drag через CSS переменную — не конфликтует с translateX(-50%) на десктопе */
  --drag-y: 0px;
  transform: translateY(var(--drag-y));
  transition: transform 0.35s var(--ease-out);
}

/* При активном перетаскивании — отключаем transition */
.bottom-sheet.is-dragging {
  transition: none;
}

/* На десктопе (Планшеты/ПК) модалка центрируется и не тянется на всю ширину */
@media (min-width: 600px) {
  .bottom-sheet {
    left: 50%;
    right: auto;
    width: 100%;
    max-width: 520px;
    /* translateX(-50%) для центрирования + translateY для drag */
    transform: translateX(-50%) translateY(var(--drag-y));
  }
  
  /* Vue Transition enter/leave — нужно учитывать X смещение */
  .slide-up-enter-from, .slide-up-leave-to {
    transform: translate(-50%, 100%);
  }
  .slide-up-enter-to, .slide-up-leave-from {
    transform: translateX(-50%) translateY(0px);
  }
}

/* ─── ЗОНА СВАЙПА И ШАПКА ─── */
.sheet-header-area {
  flex-shrink: 0;
  background: var(--surf);
  border-radius: 24px 24px 0 0;
  touch-action: pan-y; /* Важно для корректного свайпа */
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--bdr2);
  border-radius: 2px;
  margin: 12px auto 0;
  cursor: grab;
}

.sheet-handle:active {
  cursor: grabbing;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 12px;
  min-height: 56px;
  border-bottom: 1px solid var(--bdr);
}

.sheet-title-wrapper {
  flex: 1;
  min-width: 0;
}

.sheet-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--t1);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── КОНТЕНТ ─── */
.sheet-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  /* Убираем скроллбар для красоты (Mac/iOS) */
  scrollbar-width: none; 
}
.sheet-content::-webkit-scrollbar {
  display: none;
}

/* ─── ФУТЕР ─── */
.sheet-footer {
  padding: 16px 16px calc(16px + var(--sab));
  background: var(--surf);
  border-top: 1px solid var(--bdr);
  flex-shrink: 0;
}

/* ─── ОТКЛЮЧЕНИЕ АНИМАЦИЙ ─── */
@media (prefers-reduced-motion: reduce) {
  .slide-up-enter-active, .slide-up-leave-active, 
  .fade-enter-active, .fade-leave-active {
    transition: none;
  }
}
</style>