import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { augmentRecipeVisual } from '@/utils/recipeVisual'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const useSearchStore = defineStore('search', () => {

  const query = ref('')
  const isLoading = ref(false)
  const error = ref(null)
  const recipesResults = ref([])
  const pendingRecipe = ref(null)  // рецепт для открытия в модалке
  let currentRequest = null
  let abortController = null

  const results = computed(() => {
    const recipes = recipesResults.value
    return recipes.length > 0 ? { recipes, products: [], total: recipes.length } : null
  })

  const isEmpty = computed(() =>
    !isLoading.value &&
    query.value.trim().length > 0 &&
    !results.value
  )

  async function search(q, scope = 'all') {
    const trimmed = q?.trim()
    if (!trimmed || trimmed.length < 2) { clear(); return }

    query.value = trimmed
    isLoading.value = true
    error.value = null

    abortController?.abort()
    abortController = new AbortController()
    const requestId = Symbol()
    currentRequest = requestId

    try {
      if (scope === 'recipes' || scope === 'all') {
        const res = await fetch(`${API_URL}/recipes/search?q=${encodeURIComponent(trimmed)}&limit=8`, {
          signal: abortController.signal,
        })
        if (!res.ok) throw new Error('Ошибка поиска')
        const data = await res.json()
        if (currentRequest !== requestId) return
        recipesResults.value = data.map(r => augmentRecipeVisual({
          id:            String(r.id),
          title:         r.name,
          slug:          r.slug,
          cook_time_min: r.time_minutes,
          calories:      r.kcal,
          image_url:     r.image_url,
          // полные данные для модалки
          name:    r.name,
          emoji:   r.emoji,
          bg:      r.bg_color,
          type:    r.meal_type,
          time:    r.time_minutes,
          kcal:    r.kcal,
          isVeg:   r.is_vegetarian,
          isFast:  r.is_fast,
          desc:    r.description,
          steps:   r.steps || [],
          ings:    (r.ingredients || []).map(i => ({ n: i.name, q: i.quantity, cat: i.category })),
        }))
      }
    } catch (e) {
      if (currentRequest !== requestId) return
      error.value = e.message
    } finally {
      if (currentRequest === requestId) isLoading.value = false
    }
  }

  function openRecipe(recipe) {
    pendingRecipe.value = recipe
  }

  function clearPending() {
    pendingRecipe.value = null
  }

  function clear() {
    abortController?.abort()
    abortController = null
    query.value = ''
    recipesResults.value = []
    error.value = null
    isLoading.value = false
    currentRequest = null
  }

  return { query, isLoading, error, results, isEmpty, search, clear, pendingRecipe, openRecipe, clearPending }
})