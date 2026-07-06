import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOTAL_STEPS = 4

const defaultForm = () => ({
  title: '',
  description: '',
  image_url: '',
  category: '',
  cuisine: '',
  prep_time_min: null,
  cook_time_min: null,
  servings: 2,
  ingredients: [{ name: '', amount: '', unit: 'г' }],
  steps: [''],
  tags: [],
})

export const useRecipeEditorStore = defineStore('recipeEditor', () => {
  const step = ref(1)
  const form = ref(defaultForm())

  /**
   * Геттер для совместимости с CreateRecipeView, который читает store.recipe.
   * Это синоним form — не дублируем состояние, просто отдаём его под другим
   * именем (в UI код использует то 'form', то 'recipe').
   */
  const recipe = computed(() => form.value)

  /** Текущий шаг последний? Используется CreateRecipeView для решения
   *  «вызвать submitAll или перейти на next». */
  const isLastStep = computed(() => step.value >= TOTAL_STEPS)

  function nextStep() {
    if (step.value < TOTAL_STEPS) step.value++
  }

  function prevStep() {
    if (step.value > 1) step.value--
  }

  function resetForm() {
    step.value = 1
    form.value = defaultForm()
  }

  return {
    step,
    form,
    recipe,         // alias для form
    isLastStep,
    nextStep,
    prevStep,
    resetForm,
  }
})