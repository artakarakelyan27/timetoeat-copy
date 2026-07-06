/**
 * router/index.js — «Время Есть» v1.3
 *
 * ИЗМЕНЕНИЯ v1.3 (миграция к Nuxt SEO-зоне на /):
 * ✓ Корень / больше не рендерит Onboarding — его обслуживает Nuxt SEO-лендинг.
 *   В SPA на / приходим только если уже внутри приложения (например, deep-link
 *   или клик внутри Vue). Тогда redirect-функция решает куда отправить:
 *     - авторизованный → /menu
 *     - гость         → /onboarding
 * ✓ Новый маршрут /onboarding — отдельная страница для SPA Onboarding.vue.
 * ✓ В beforeEach защищённый маршрут для гостя теперь редиректит на /onboarding,
 *   а не на /home как раньше.
 *
 * ВАЖНО: package.json указывает "vue-router": "^5.0.4".
 * vue-router v5 предназначен для Vue 3 и API-совместим с v4.
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    // Корневой маршрут SPA — никогда не отдаётся nginx'ом (там Nuxt-лендинг),
    // но если пользователь как-то попадёт на / уже внутри SPA — редиректим.
    path: '/',
    name: 'home',
    redirect: (to) => {
      try {
        const auth = useAuthStore()
        return auth.token ? { name: 'menu' } : { name: 'onboarding' }
      } catch {
        // Если store недоступен (например при HMR) — гостевой путь.
        return { name: 'onboarding' }
      }
    },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('../Onboarding.vue'),
    meta: { guestOnly: true }, // авторизованные уйдут на /menu
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../views/AuthView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('../views/MenuView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/recipes',
    name: 'recipes',
    component: () => import('../views/RecipesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/prices',
    name: 'prices',
    component: () => import('../views/PricesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/saved',
    name: 'saved',
    component: () => import('../views/SavedView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/recipes/create',
    name: 'create-recipe',
    component: () => import('../views/CreateRecipeView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const isAuth = !!auth.token

  // Авторизованный открывает гостевой маршрут (/onboarding, /auth) → /menu
  if (to.meta.guestOnly && isAuth) return { name: 'menu' }

  // Гость открывает защищённый маршрут → /onboarding
  if (to.meta.requiresAuth && !isAuth) return { name: 'onboarding' }
})

export default router
