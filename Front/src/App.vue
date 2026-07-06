<script setup>
/**
 * App.vue — «Время Есть» v1.2
 */
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AppTopbar        from '@/components/organisms/AppTopbar.vue'
import BottomNav        from '@/components/organisms/BottomNav.vue'
import InstallPrompt    from '@/components/InstallPrompt.vue'
import SplashScreen     from '@/components/organisms/SplashScreen.vue'

const route = useRoute()
const auth  = useAuthStore()

const splashVisible = ref(!!auth.token)
const splashDone    = ref(false)

// 1. Выносим фикс iOS в отдельную функцию
function fixIosSafeArea() {
  const isIosPwa = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (isIosPwa) {
    // Ждем один тик, пока Vue отрендерит BottomNav
    setTimeout(() => {
      document.body.style.paddingBottom = '0.1px';
      document.body.offsetHeight; // Форсируем перерисовку DOM
      document.body.style.paddingBottom = '';
      window.dispatchEvent(new Event('resize'));
    }, 50); 
  }
}

function onSplashDone() {
  splashDone.value    = true
  splashVisible.value = false
  
  // 2. Идеальный момент для фикса! 
  // Сплэш ушел, BottomNav прямо сейчас появится в DOM. Пинаем Safari:
  fixIosSafeArea()
}

const showNav = computed(() => {
  if (splashVisible.value) return false
  if (!route?.name) return true
  return !['home', 'onboarding', 'auth'].includes(route.name)
})

onMounted(() => {
  // 3. Если сплэш не показывается изначально (например, юзер не авторизован),
  // то вызываем фикс сразу при загрузке приложения.
  if (!splashVisible.value) {
    fixIosSafeArea()
  }

  // Защищаем ваш остальной код (онбординг и т.д. не прервут фикс)
  if (!auth.token) return 
  
})
</script>

<template>
  <div class="app-layout">
    <!-- Splash -->
    <Transition name="splash-fade">
      <SplashScreen
        v-if="splashVisible"
        @done="onSplashDone"
      />
    </Transition>

    <!-- Основной интерфейс -->
    <template v-if="!splashVisible || splashDone">
      <AppTopbar v-if="showNav" />
      
      <!-- ДОБАВЛЕН ДИНАМИЧЕСКИЙ КЛАСС :class="{ 'has-nav': showNav }" -->
      <main class="page-container" :class="{ 'has-nav': showNav }" id="main-content">
        <router-view />
      </main>
      
      <BottomNav v-if="showNav" />
    </template>

    <InstallPrompt />
  </div>
</template>

<style>

.page-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  /* Запрещаем внутренние отступы, которые могут двоиться */
  padding-bottom: 0; 
}

.page-container.has-nav {
  /* Мы резервируем место ровно под высоту навигации */
  padding-bottom: var(--nav-total-h) !important;
}

/* Transition для SplashScreen */
.splash-fade-leave-active { transition: opacity 0.38s ease; }
.splash-fade-leave-to     { opacity: 0; }
</style>