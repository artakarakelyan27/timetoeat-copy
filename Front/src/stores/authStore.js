import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const useAuthStore = defineStore('auth', () => {

  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const defaultPreferences = {
    familySize: 2,
    familyTags: { kids: false, teens: false, elderly: false },
    restrictions: { veg: false, gluten: false, lactose: false, nuts: false, seafood: false, pork: false, halal: false },
    cuisines: { russian: false, italian: true, asian: false, fast: false, pp: false },
    budget: 'mid',
    cookFreq: 'daily',
  }

  const serverPrefs = user.value?.preferences || null
  let localPrefs = null
  try { localPrefs = JSON.parse(localStorage.getItem('user_preferences') || 'null') } catch { }
  const preferences = ref(serverPrefs || localPrefs || defaultPreferences)

  function savePreferences(prefs) {
    preferences.value = { ...preferences.value, ...prefs }
    localStorage.setItem('user_preferences', JSON.stringify(preferences.value))
  }

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(data) {
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    // FIX-AUTH-LEAK-01: на логине/регистрации сервер — единственный источник
    // правды по preferences. Если сервер вернул prefs — синхронизируем локалку.
    // Если НЕ вернул (новый аккаунт сразу после register, либо у user.preferences=null) —
    // ОБЯЗАТЕЛЬНО чистим локалку, иначе там остаются «онбординговые» значения,
    // которые анонимная сессия успела записать через savePreferencesToStore() на шаге
    // s-aha. Раньше эти значения «приклеивались» к существующему аккаунту при логине
    // в режиме инкогнито: пользователь видел свой профиль с чужими настройками.
    if (data.user?.preferences) {
      preferences.value = data.user.preferences
      localStorage.setItem('user_preferences', JSON.stringify(data.user.preferences))
    } else {
      preferences.value = { ...defaultPreferences }
      localStorage.removeItem('user_preferences')
    }
  }

  function setUser(userData) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
    // FIX-AUTH-LEAK-02: тот же принцип — server is source of truth.
    if (userData?.preferences) {
      preferences.value = userData.preferences
      localStorage.setItem('user_preferences', JSON.stringify(userData.preferences))
    } else if (token.value) {
      // Залогинены, но у юзера ещё нет prefs на сервере — чистим локалку.
      preferences.value = { ...defaultPreferences }
      localStorage.removeItem('user_preferences')
    }
  }

  // Загружает свежие данные юзера с сервера и перезаписывает локальный стейт.
  // Вызывается при старте приложения если токен уже есть.
  async function refreshFromServer() {
    if (!token.value) return
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (!res.ok) return
      const userData = await res.json()
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
      // Серверные preferences ВСЕГДА приоритетнее localStorage.
      // FIX-AUTH-LEAK-03: если сервер вернул пусто — чистим локалку, не оставляем
      // «онбординговые» значения, которые могли просочиться в анонимной сессии.
      if (userData.preferences) {
        preferences.value = userData.preferences
        localStorage.setItem('user_preferences', JSON.stringify(userData.preferences))
      } else {
        preferences.value = { ...defaultPreferences }
        localStorage.removeItem('user_preferences')
      }
    } catch {
      // Офлайн — оставляем что есть
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function register(email, password, name) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Ошибка регистрации')
    setAuth(data)
    return data
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Неверный email или пароль')
    setAuth(data)
    return data
  }

  return { token, user, isLoggedIn, register, login, logout, setUser, preferences, savePreferences, refreshFromServer }
})