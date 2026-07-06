import { useAnalytics } from './useAnalytics'

/**
 * Список событий, которые отправляются в Yandex Metrika как goals.
 * Метрика индексирует не больше 200 целей — отправляем только бизнес-критичные.
 */
const METRIKA_GOALS = new Set([
  'onboarding_completed',
  'recipe_add_to_menu',
  'menu_ings_to_shop',
  'auth_submit',
  'recipe_create_complete',
])

export function useTrack() {
  const { track: localTrack, trackRecipe: localTrackRecipe, ...rest } = useAnalytics()

  /** Универсальный track: локально + PostHog + Метрика (для goal-событий) */
  function track(type, payload = {}) {
    // 1. Локальный движок — всегда (без него Recommender перестанет учиться)
    const ev = localTrack(type, payload)

    // 2. PostHog — если подключен
    if (window.posthog?.capture) {
      try { window.posthog.capture(type, payload) } catch {}
    }

    // 3. Yandex Metrika — только для целевых событий
    if (METRIKA_GOALS.has(type) && window.ym && window.__YM_ID__) {
      try { window.ym(window.__YM_ID__, 'reachGoal', type, payload) } catch {}
    }

    return ev
  }

  /** Вытаскивает поля из объекта рецепта и трекает (как в useAnalytics) */
  function trackRecipe(type, recipe, extra = {}) {
    return track(type, {
      recipeId: recipe.id || recipe.slug,
      category: recipe.category,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      cookTimeMin: recipe.total_time_min,
      calories: recipe.calories,
      mealType: recipe.type || recipe.meal_type,
      ...extra,
    })
  }

  return { track, trackRecipe, ...rest }
}