/**
 * useAnalytics.js — Система аналитики действий и рекомендаций «Время Есть»
 *
 * Архитектура:
 *   1. AnalyticsEngine  — сбор и хранение событий (localStorage + memory)
 *   2. ProfileBuilder   — строит вектор предпочтений пользователя из событий
 *   3. Recommender      — ранжирует рецепты по профилю с несколькими стратегиями
 *   4. useAnalytics()   — Vue composable, точка входа для всех компонентов
 *
 * Совместимость: Vue 3 (Composition API), Pinia, без внешних зависимостей
 *
 * WCAG / HIG: не влияет на рендер, данные только читаются/пишутся
 */

import { ref, computed, readonly } from 'vue'

// ─────────────────────────────────────────────────────────────
// КОНСТАНТЫ
// ─────────────────────────────────────────────────────────────

/** Типы событий */
export const EVENT = {
    // Онбординг
    ONBOARDING_SWIPE_LIKE: 'onboarding_swipe_like',
    ONBOARDING_SWIPE_DISLIKE: 'onboarding_swipe_dislike',
    ONBOARDING_FAMILY_SET: 'onboarding_family_set',
    ONBOARDING_DIET_SET: 'onboarding_diet_set',

    // Лента рецептов (Tinder-свайпы)
    FEED_SWIPE_RIGHT: 'feed_swipe_right',   // лайк → сохранено
    FEED_SWIPE_LEFT: 'feed_swipe_left',    // дизлайк → пропущено
    FEED_CARD_OPEN: 'feed_card_open',     // тап → открыл карточку
    FEED_CARD_LINGER: 'feed_card_linger',   // задержался >5с на карточке
    FEED_FILTER_USED: 'feed_filter_used',   // выбрал фильтр категории

    // Детальная карточка рецепта
    RECIPE_VIEW: 'recipe_view',          // открыл рецепт
    RECIPE_VIEW_COMPLETE: 'recipe_view_complete', // прочёл до конца шагов
    RECIPE_ADD_TO_MENU: 'recipe_add_to_menu',   // добавил в меню
    RECIPE_SAVE: 'recipe_save',          // сохранил в избранное
    RECIPE_UNSAVE: 'recipe_unsave',
    RECIPE_SHARE: 'recipe_share',
    RECIPE_COOK_TIMER: 'recipe_cook_timer',    // нажал на таймер шага
    RECIPE_PORTIONS_CHANGE: 'recipe_portions_change',

    // Меню
    MENU_GENERATED: 'menu_generated',
    MENU_SLOT_REPLACE: 'menu_slot_replace',   // свайп «заменить блюдо»
    MENU_SLOT_ACCEPT: 'menu_slot_accept',    // оставил предложенный вариант
    MENU_SLOT_DRAG_MOVE: 'menu_slot_drag_move', // перетащил блюдо

    // Список покупок
    SHOP_ITEM_CHECK: 'shop_item_check',   // отметил купленным
    SHOP_ITEM_ADD: 'shop_item_add',
    SHOP_ITEM_REMOVE: 'shop_item_remove',
    SHOP_OPEN_PRICES: 'shop_open_prices',  // нажал «Сравнить цены»

    // Цены / заказ
    PRICE_VIEW: 'price_view',
    PRICE_ORDER_CLICK: 'price_order_click', // deeplink в доставку
    PRICE_STORE_SELECT: 'price_store_select',

    // Созданный пользователем рецепт
    RECIPE_CREATE_START: 'recipe_create_start',
    RECIPE_CREATE_COMPLETE: 'recipe_create_complete',

    // Голосование за ужин
    VOTE_CAST: 'vote_cast',

    // Сессия
    SESSION_START: 'session_start',
    APP_FOREGROUND: 'app_foreground',

    // Системные
    PAGE_VIEW: 'page_view',
    APP_ERROR: 'app_error',

    // Онбординг — расширение
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_PROFILE_SET: 'onboarding_profile_set',
    ONBOARDING_GOAL_SET: 'onboarding_goal_set',
    ONBOARDING_SWIPE_UNDO: 'onboarding_swipe_undo',
    ONBOARDING_SKIPPED: 'onboarding_skipped',
    ONBOARDING_AHA_SHOWN: 'onboarding_aha_shown',
    ONBOARDING_COMPLETED: 'onboarding_completed',

    // Меню — расширение
    MENU_TAB_SWITCHED: 'menu_tab_switched',
    MENU_SLOT_OPENED: 'menu_slot_opened',
    MENU_SLOT_REMOVED: 'menu_slot_removed',
    MENU_INGS_TO_SHOP: 'menu_ings_to_shop',
    MENU_RESET: 'menu_reset',

    // Saved
    SAVED_TAB_SWITCHED: 'saved_tab_switched',
    SAVED_SEARCH: 'saved_search',
    SAVED_FILTER: 'saved_filter',

    // Профиль и Auth
    PROFILE_UPDATED: 'profile_updated',
    AUTH_SUBMIT: 'auth_submit',
    AUTH_SKIPPED: 'auth_skipped',
    AUTH_LOGOUT: 'auth_logout',
}

/** Веса сигналов — чем выше, тем сильнее влияние на профиль */
const SIGNAL_WEIGHTS = {
    // Онбординг — самые тяжёлые веса, без decay (см. NO_DECAY_EVENTS).
    // Пользователь явно сказал «хочу это» — мы должны это помнить.
    [EVENT.ONBOARDING_SWIPE_LIKE]: 6.0,   // был 3.0
    [EVENT.ONBOARDING_SWIPE_DISLIKE]: -4.0,  // был -2.0
    [EVENT.FEED_SWIPE_RIGHT]: 2.5,
    [EVENT.FEED_SWIPE_LEFT]: -1.5,
    [EVENT.FEED_CARD_OPEN]: 0.8,
    [EVENT.FEED_CARD_LINGER]: 1.2,
    [EVENT.RECIPE_VIEW]: 0.5,
    [EVENT.RECIPE_VIEW_COMPLETE]: 1.8,
    [EVENT.RECIPE_ADD_TO_MENU]: 3.5,
    [EVENT.RECIPE_SAVE]: 3.0,
    [EVENT.RECIPE_UNSAVE]: -1.0,
    [EVENT.RECIPE_SHARE]: 2.0,
    [EVENT.RECIPE_COOK_TIMER]: 2.2,  // пользователь готовил по рецепту
    [EVENT.MENU_SLOT_ACCEPT]: 1.5,
    [EVENT.MENU_SLOT_REPLACE]: -0.8,
    [EVENT.VOTE_CAST]: 1.8,
    [EVENT.RECIPE_CREATE_COMPLETE]: 4.0,  // создал — точно любит категорию
    [EVENT.MENU_SLOT_REMOVED]: -0.6,    // удалил блюдо — лёгкий негативный сигнал
    [EVENT.MENU_INGS_TO_SHOP]: 1.0,     // перевёл рецепт в работу — позитив
    [EVENT.SHOP_ITEM_CHECK]: 0.3,       // купил продукт — слабый позитив для ингредиента
}

/** Временной decay: события старше N дней теряют силу */
const DECAY_HALF_LIFE_DAYS = 21  // вес старых событий падает вдвое каждые 21 день

/**
 * События, которые НЕ подвергаются decay.
 * Онбординг — это декларация намерений пользователя, а не случайное касание.
 * Его сигналы должны сохранять полный вес всегда, пока пользователь сам
 * не перекроет их поведением в ленте.
 */
const NO_DECAY_EVENTS = new Set([
    'onboarding_swipe_like',
    'onboarding_swipe_dislike',
    'onboarding_family_set',
    'onboarding_diet_set',
])

// ─────────────────────────────────────────────────────────────
// ANALYTICS ENGINE — сбор событий
// ─────────────────────────────────────────────────────────────

class AnalyticsEngine {
    constructor() {
        this._key = 've_events'        // localStorage key
        this._maxEvents = 2000         // rolling window
        this._sessionId = this._genId()
        this._events = this._load()
        this._listeners = new Set()
        this._saveTimer = null
        this._initFlushLoop()
    }

    _genId() {
        return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }

    _load() {
        try {
            const raw = localStorage.getItem(this._key)
            return raw ? JSON.parse(raw) : []
        } catch { return [] }
    }

    _save() {
        clearTimeout(this._saveTimer)
        this._saveTimer = setTimeout(() => {
            try {
                if (this._events.length > this._maxEvents) {
                    this._events = this._events.slice(-this._maxEvents)
                }
                localStorage.setItem(this._key, JSON.stringify(this._events))
            } catch { /* private mode — работаем только в памяти */ }
        }, 300)
    }

    /**
     * Записать событие
     * @param {string} type — одно из EVENT.*
     * @param {object} payload — произвольные данные события
     */
    track(type, payload = {}) {
        const event = {
            id: this._genId(),
            type,
            ts: Date.now(),
            sessionId: this._sessionId,
            ...payload,
        }
        this._events.push(event)
        this._save()
        this._notify(event)
        return event
    }

    _initFlushLoop() {
        if (this._flushTimer) return
        this._flushTimer = setInterval(() => this.flush(), 30_000)
        window.addEventListener('beforeunload', () => this.flush(true))
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.flush(true)
        })
    }

    async flush(useBeacon = false) {
        const unsent = this._events.filter(e => !e._sent)
        if (!unsent.length) return

        const token = localStorage.getItem('token')
        const body = JSON.stringify({
            anonId: this._getAnonId(),
            sessionId: this._sessionId,
            events: unsent.map(e => ({
                eventId: e.id, eventType: e.type, eventTs: e.ts,
                properties: { ...e, id: undefined, type: undefined, ts: undefined },
            })),
        })
        const url = (import.meta.env.VITE_API_URL || '/api') + '/events/batch'

        try {
            if (useBeacon && navigator.sendBeacon) {
                navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
            } else {
                await fetch(url, {
                    method: 'POST', body,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    keepalive: true,
                })
            }
            unsent.forEach(e => { e._sent = true })
            this._save()
        } catch {
            // Сеть недоступна — попробуем в следующий тик. События в localStorage сохранены.
        }
    }

    _getAnonId() {
        let id = localStorage.getItem('ve_anon_id')
        if (!id) {
            id = crypto.randomUUID?.() || this._genId()
            localStorage.setItem('ve_anon_id', id)
        }
        return id
    }

    /** Подписка на события (для реактивности Vue) */
    subscribe(fn) {
        this._listeners.add(fn)
        return () => { this._listeners.delete(fn) }
    }

    _notify(event) {
        this._listeners.forEach(fn => fn(event))
    }

    /** Все события, опционально отфильтрованные */
    getEvents({ types, recipeId, sinceMs } = {}) {
        return this._events.filter(e => {
            if (types && !types.includes(e.type)) return false
            if (recipeId && e.recipeId !== recipeId) return false
            if (sinceMs && e.ts < sinceMs) return false
            return true
        })
    }

    /** Сбросить историю */
    clear() {
        this._events = []
        localStorage.removeItem(this._key)
    }

    get eventCount() { return this._events.length }

}

// ─────────────────────────────────────────────────────────────
// PROFILE BUILDER — вектор предпочтений из событий
// ─────────────────────────────────────────────────────────────

class ProfileBuilder {
    /**
     * Строит профиль из массива событий.
     * Возвращает объект:
     * {
     *   categoryScores:    { [category]: number }    — суммарный скор по категории
     *   ingredientScores:  { [ingredient]: number }  — суммарный скор по ингредиенту
     *   tagScores:         { [tag]: number }          — суммарный скор по тегу
     *   recipeScores:      { [recipeId]: number }     — суммарный скор конкретного рецепта
     *   timePreference:    { fast: n, medium: n, long: n }
     *   caloriePreference: { low: n, medium: n, high: n }
     *   dislikedRecipeIds: Set<string>
     *   likedRecipeIds:    Set<string>
     *   mealTypeScores:    { breakfast: n, lunch: n, dinner: n, snack: n }
     *   totalSignals:      number
     * }
     */
    static build(events) {
        const profile = {
            categoryScores: {},
            ingredientScores: {},
            tagScores: {},
            recipeScores: {},
            timePreference: { fast: 0, medium: 0, long: 0 },
            caloriePreference: { low: 0, medium: 0, high: 0 },
            dislikedRecipeIds: new Set(),
            likedRecipeIds: new Set(),
            mealTypeScores: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
            hasOnboardingData: false,  // true если пользователь прошёл онбординг
            totalSignals: 0,
        }

        const now = Date.now()
        const halfLifeMs = DECAY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000

        for (const event of events) {
            const rawWeight = SIGNAL_WEIGHTS[event.type]
            if (rawWeight === undefined) continue

            // Временной decay: weight * 2^(-age/halfLife)
            // Онбординговые события decay не получают — они декларация намерений.
            const ageMs = now - event.ts
            const decayFactor = NO_DECAY_EVENTS.has(event.type)
                ? 1.0
                : Math.pow(2, -ageMs / halfLifeMs)
            const weight = rawWeight * decayFactor

            profile.totalSignals++

            // Отдельно считаем «онбординговый сигнал» — нужен для холодного старта
            if (NO_DECAY_EVENTS.has(event.type) && rawWeight > 0) {
                profile.hasOnboardingData = true
            }

            // ── Скор конкретного рецепта
            if (event.recipeId) {
                profile.recipeScores[event.recipeId] = (profile.recipeScores[event.recipeId] || 0) + weight

                if (weight > 0) profile.likedRecipeIds.add(event.recipeId)
                else profile.dislikedRecipeIds.add(event.recipeId)
            }

            // ── Категория рецепта
            if (event.category) {
                const cat = event.category.toLowerCase()
                profile.categoryScores[cat] = (profile.categoryScores[cat] || 0) + weight
            }

            // ── Теги рецепта (массив строк)
            if (Array.isArray(event.tags)) {
                for (const tag of event.tags) {
                    const t = tag.toLowerCase()
                    profile.tagScores[t] = (profile.tagScores[t] || 0) + weight
                }
            }

            // ── Ингредиенты (массив)
            if (Array.isArray(event.ingredients)) {
                for (const ing of event.ingredients) {
                    const i = (typeof ing === 'string' ? ing : ing.name || '').toLowerCase()
                    if (i) profile.ingredientScores[i] = (profile.ingredientScores[i] || 0) + weight * 0.5
                }
            }

            // ── Время приготовления
            if (event.cookTimeMin != null) {
                const t = event.cookTimeMin
                const bucket = t <= 20 ? 'fast' : t <= 45 ? 'medium' : 'long'
                profile.timePreference[bucket] += weight
            }

            // ── Калорийность
            if (event.calories != null) {
                const c = event.calories
                const bucket = c < 300 ? 'low' : c < 550 ? 'medium' : 'high'
                profile.caloriePreference[bucket] += weight
            }

            // ── Тип приёма пищи
            if (event.mealType && profile.mealTypeScores[event.mealType] !== undefined) {
                profile.mealTypeScores[event.mealType] += weight
            }
        }

        return profile
    }

    /** Топ-N самых предпочитаемых категорий */
    static topCategories(profile, n = 5) {
        return Object.entries(profile.categoryScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([cat, score]) => ({ cat, score }))
    }

    /** Топ-N ингредиентов */
    static topIngredients(profile, n = 10) {
        return Object.entries(profile.ingredientScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([ing, score]) => ({ ing, score }))
    }

    /** Предпочтительное время готовки */
    static preferredTime(profile) {
        const t = profile.timePreference
        const max = Math.max(t.fast, t.medium, t.long)
        if (max === 0) return null
        return max === t.fast ? 'fast' : max === t.medium ? 'medium' : 'long'
    }
}

// ─────────────────────────────────────────────────────────────
// RECOMMENDER — ранжирует рецепты по профилю
// ─────────────────────────────────────────────────────────────

class Recommender {
    /**
     * Вычисляет релевантность рецепта для профиля.
     * recipe — объект из вашего JSON (fields: id, category, tags[], ingredients[],
     *           total_time_min, calories, type/meal_type)
     * profile — результат ProfileBuilder.build()
     * Возвращает { recipeId, score, reasons[] }
     */
    static score(recipe, profile) {
        let score = 0
        const reasons = []

        const id = recipe.id || recipe.slug

        // ── Холодный старт: поведенческих данных мало, онбординг — единственный сигнал.
        // Считаем «зрелость» профиля: сколько NON-онбординговых сигналов накоплено.
        // При < 15 поведенческих событий онбординговый скор рецепта усиливается,
        // чтобы первые экраны выглядели персонализированными, а не случайными.
        const behaviorSignals = profile.totalSignals - (profile.hasOnboardingData ? 1 : 0)
        const coldStartFactor = profile.hasOnboardingData
            ? Math.max(1.0, 2.5 - behaviorSignals * 0.1)  // от 2.5× до 1.0× по мере накопления данных
            : 1.0

        // 1. Прямой скор рецепта (пользователь взаимодействовал с ним раньше)
        if (profile.recipeScores[id]) {
            const s = profile.recipeScores[id]
            // Онбординговые лайки — часть recipeScores, усиливаем через coldStartFactor
            score += s * 1.5 * coldStartFactor
            if (s > 2) reasons.push('loved_before')
            if (s > 4 && coldStartFactor > 1) reasons.push('onboarding_liked')
        }

        // 2. Исключить дизлайкнутые
        if (profile.dislikedRecipeIds.has(id) && !profile.likedRecipeIds.has(id)) {
            return { recipeId: id, score: -999, reasons: ['disliked'] }
        }

        // 3. Категория
        const cat = (recipe.category || '').toLowerCase()
        if (cat && profile.categoryScores[cat]) {
            const s = profile.categoryScores[cat]
            // Усиливаем через coldStartFactor — если категория пришла из онбординга,
            // она несёт больший вес пока нет поведенческих данных
            score += s * 0.8 * coldStartFactor
            if (s > 1.5) reasons.push(`category_match:${cat}`)
        }

        // 4. Теги
        const tags = Array.isArray(recipe.tags) ? recipe.tags : []
        for (const tag of tags) {
            const t = tag.toLowerCase()
            if (profile.tagScores[t]) {
                score += profile.tagScores[t] * 0.6 * coldStartFactor
                if (profile.tagScores[t] > 1) reasons.push(`tag_match:${t}`)
            }
        }

        // 5. Ингредиенты
        const ings = Array.isArray(recipe.ingredients)
            ? recipe.ingredients.map(i => (typeof i === 'string' ? i : i.name || '').toLowerCase())
            : []
        let ingScore = 0
        for (const ing of ings) {
            if (profile.ingredientScores[ing]) {
                ingScore += profile.ingredientScores[ing]
            }
        }
        if (ingScore > 0) {
            score += ingScore * 0.4
            if (ingScore > 2) reasons.push('ingredient_match')
        }

        // 6. Время приготовления
        const prefTime = ProfileBuilder.preferredTime(profile)
        if (prefTime && recipe.total_time_min != null) {
            const t = recipe.total_time_min
            const bucket = t <= 20 ? 'fast' : t <= 45 ? 'medium' : 'long'
            if (bucket === prefTime) {
                score += 1.0
                reasons.push(`time_pref:${bucket}`)
            }
        }

        // 7. Калорийность
        if (recipe.calories != null) {
            const c = recipe.calories
            const bucket = c < 300 ? 'low' : c < 550 ? 'medium' : 'high'
            const calPref = profile.caloriePreference
            const maxCal = Math.max(calPref.low, calPref.medium, calPref.high)
            if (maxCal > 0) {
                const prefBucket = maxCal === calPref.low ? 'low' : maxCal === calPref.medium ? 'medium' : 'high'
                if (bucket === prefBucket) {
                    score += 0.5
                    reasons.push(`calorie_pref:${bucket}`)
                }
            }
        }

        // 8. Тип приёма пищи
        const mt = recipe.type || recipe.meal_type
        if (mt && profile.mealTypeScores[mt] != null) {
            const s = profile.mealTypeScores[mt]
            if (s > 0) {
                score += s * 0.3
                if (s > 1) reasons.push(`meal_type:${mt}`)
            }
        }

        // 9. Diversity penalty — если рецепт уже в текущем меню, слегка снижаем
        // (передаётся через опции)
        return { recipeId: id, score, reasons }
    }

    /**
     * Рекомендует topN рецептов из списка.
     * @param {Array} recipes       — полный каталог рецептов
     * @param {object} profile      — профиль из ProfileBuilder
     * @param {object} options
     *   {number}  topN             — сколько вернуть (default 20)
     *   {string}  strategy         — 'personalized' | 'discovery' | 'quick' | 'family' | 'similar'
     *   {Array}   excludeIds       — исключить из результата (уже в меню)
     *   {string}  mealType         — фильтр по типу приёма пищи
     *   {string}  similarToId      — базовый рецепт для стратегии 'similar'
     *   {number}  maxCookTimeMin   — фильтр по времени
     *   {boolean} noveltyBoost     — усилить новинки (не встречались раньше)
     */
    static recommend(recipes, profile, options = {}) {
        const {
            topN = 20,
            strategy = 'personalized',
            excludeIds = [],
            mealType = null,
            similarToId = null,
            maxCookTimeMin = null,
            noveltyBoost = false,
        } = options

        const excludeSet = new Set(excludeIds)
        const seenIds = new Set(Object.keys(profile.recipeScores))

        let pool = recipes.filter(r => {
            const id = r.id || r.slug
            if (excludeSet.has(id)) return false
            if (mealType && r.type !== mealType && r.meal_type !== mealType) return false
            if (maxCookTimeMin && r.total_time_min > maxCookTimeMin) return false
            return true
        })

        let scored

        switch (strategy) {
            // ── Стандартная персонализация
            case 'personalized':
                scored = pool.map(r => {
                    const { score, reasons } = Recommender.score(r, profile)
                    let s = score
                    // Novelty boost: рецепты без истории получают небольшой бонус для разнообразия
                    if (noveltyBoost && !seenIds.has(r.id || r.slug)) s += 0.5
                    return { recipe: r, score: s, reasons }
                })
                break

            // ── Discovery: показываем то, чего ещё не видел, но близко к профилю
            case 'discovery':
                scored = pool
                    .filter(r => !seenIds.has(r.id || r.slug))
                    .map(r => {
                        const { score, reasons } = Recommender.score(r, profile)
                        return { recipe: r, score: score + 1.0, reasons: [...reasons, 'discovery'] }
                    })
                break

            // ── Quick: только быстрые рецепты (≤25 мин), ранжированные по профилю
            case 'quick':
                scored = pool
                    .filter(r => r.total_time_min != null && r.total_time_min <= 25)
                    .map(r => {
                        const { score, reasons } = Recommender.score(r, profile)
                        return { recipe: r, score, reasons: [...reasons, 'quick'] }
                    })
                break

            // ── Family: учитываем семейный формат — фильтруем по тегам family/kids,
            //           boosting scores for child-friendly recipes
            case 'family': {
                const familyTags = new Set(['дети', 'family', 'kids', 'для детей', 'семейный'])
                scored = pool.map(r => {
                    const { score, reasons } = Recommender.score(r, profile)
                    const tags = (r.tags || []).map(t => t.toLowerCase())
                    const isFamily = tags.some(t => familyTags.has(t))
                    return {
                        recipe: r,
                        score: score + (isFamily ? 1.5 : 0),
                        reasons: isFamily ? [...reasons, 'family_friendly'] : reasons,
                    }
                })
                break
            }

            // ── Similar: рецепты, похожие на конкретный (по категории + тегам)
            case 'similar': {
                const base = recipes.find(r => (r.id || r.slug) === similarToId)
                if (!base) { scored = pool.map(r => ({ recipe: r, score: 0, reasons: [] })); break }
                const baseTags = new Set((base.tags || []).map(t => t.toLowerCase()))
                const baseCat = (base.category || '').toLowerCase()
                scored = pool
                    .filter(r => (r.id || r.slug) !== similarToId)
                    .map(r => {
                        const catMatch = (r.category || '').toLowerCase() === baseCat ? 2 : 0
                        const sharedTags = (r.tags || []).filter(t => baseTags.has(t.toLowerCase())).length
                        const timeMatch = base.total_time_min && r.total_time_min
                            ? 1 - Math.min(Math.abs(r.total_time_min - base.total_time_min) / 30, 1)
                            : 0
                        const score = catMatch + sharedTags * 0.8 + timeMatch * 0.5
                        return { recipe: r, score, reasons: ['similar_to:' + similarToId] }
                    })
                break
            }

            default:
                scored = pool.map(r => ({ recipe: r, score: 0, reasons: [] }))
        }

        // Сортировка, обрезка
        return scored
            .filter(({ score }) => score > -100)
            .sort((a, b) => b.score - a.score)
            .slice(0, topN)
    }

    /**
     * Генерирует полное недельное меню (7 дней × 3 приёма) из каталога.
     * Обеспечивает разнообразие: один рецепт не повторяется в течение недели.
     */
    static generateWeekMenu(recipes, profile, options = {}) {
        const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
        const slots = [
            { key: 'breakfast', label: 'Завтрак', mealType: 'breakfast' },
            { key: 'lunch', label: 'Обед', mealType: 'lunch' },
            { key: 'dinner', label: 'Ужин', mealType: 'dinner' },
        ]

        const usedIds = new Set(options.excludeIds || [])
        const week = []

        for (const day of days) {
            const dayMeals = {}
            for (const slot of slots) {
                const recs = Recommender.recommend(recipes, profile, {
                    topN: 10,
                    strategy: 'personalized',
                    mealType: slot.mealType,
                    excludeIds: [...usedIds],
                    noveltyBoost: true,
                })

                // Выбираем топ-1, с небольшой рандомизацией из топ-3 для разнообразия
                const pick = recs[Math.floor(Math.random() * Math.min(3, recs.length))] || null
                if (pick) {
                    dayMeals[slot.key] = pick.recipe
                    usedIds.add(pick.recipe.id || pick.recipe.slug)
                } else {
                    dayMeals[slot.key] = null
                }
            }
            week.push({ day, ...dayMeals })
        }

        return week
    }
}

// ─────────────────────────────────────────────────────────────
// SINGLETON ENGINE — один экземпляр на всё приложение
// ─────────────────────────────────────────────────────────────

let _engine = null
function getEngine() {
    if (!_engine) _engine = new AnalyticsEngine()
    return _engine
}

// ─────────────────────────────────────────────────────────────
// VUE COMPOSABLE — публичный API
// ─────────────────────────────────────────────────────────────

/**
 * useAnalytics() — Vue 3 Composition API composable.
 *
 * Пример использования:
 *
 *   import { useAnalytics, EVENT } from '@/composables/useAnalytics'
 *
 *   const { track, recommend, generateWeekMenu, profile } = useAnalytics()
 *
 *   // Записать событие
 *   track(EVENT.FEED_SWIPE_RIGHT, {
 *     recipeId: recipe.id,
 *     category: recipe.category,
 *     tags: recipe.tags,
 *     ingredients: recipe.ingredients,
 *     cookTimeMin: recipe.total_time_min,
 *     calories: recipe.calories,
 *     mealType: recipe.type,
 *   })
 *
 *   // Получить рекомендации
 *   const recs = recommend(allRecipes, { strategy: 'personalized', topN: 10 })
 *
 *   // Сгенерировать меню
 *   const menu = generateWeekMenu(allRecipes)
 */
export function useAnalytics() {
    const engine = getEngine()

    // Реактивный счётчик событий — используется для пересчёта профиля
    const _eventTick = ref(0)

    // Подписываемся один раз на новые события
    const _unsub = engine.subscribe(() => { _eventTick.value++ })

    // Профиль пересчитывается реактивно при каждом новом событии
    const profile = computed(() => {
        // читаем _eventTick.value, чтобы vue отслеживал зависимость
        void _eventTick.value
        return ProfileBuilder.build(engine.getEvents())
    })

    // ── Топ-5 категорий пользователя
    const topCategories = computed(() => ProfileBuilder.topCategories(profile.value))

    // ── Предпочитаемое время готовки
    const preferredCookTime = computed(() => ProfileBuilder.preferredTime(profile.value))

    /**
     * Записать действие пользователя.
     * @param {string} type — EVENT.* константа
     * @param {object} payload — любые данные события
     *
     * Обязательные поля payload для рецептных событий:
     *   recipeId   string  — id рецепта
     *   category   string  — категория (паста, супы, ...)
     *   tags       Array   — теги рецепта
     *   ingredients Array  — ингредиенты (объекты с полем name или строки)
     *   cookTimeMin number — время приготовления
     *   calories   number  — калорийность
     *   mealType   string  — breakfast|lunch|dinner|snack
     */
    function track(type, payload = {}) {
        return engine.track(type, payload)
    }

    /**
     * Хелпер: автоматически вытаскивает нужные поля из объекта рецепта
     * и записывает событие.
     * @param {string} type  — EVENT.*
     * @param {object} recipe — объект рецепта
     * @param {object} extra  — дополнительные поля
     */
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

    /**
     * Получить отсортированные рекомендации из массива рецептов.
     * @param {Array}  recipes — каталог
     * @param {object} options — см. Recommender.recommend()
     * @returns {Array} — [{ recipe, score, reasons }]
     */
    function recommend(recipes, options = {}) {
        return Recommender.recommend(recipes, profile.value, options)
    }

    /**
     * Получить только массив рецептов (без score/reasons), отсортированный по релевантности.
     * Удобный шорткат для v-for в шаблоне.
     */
    function sortedRecipes(recipes, options = {}) {
        return recommend(recipes, options).map(r => r.recipe)
    }

    /**
     * Сгенерировать меню на 7 дней.
     * @param {Array} recipes  — полный каталог
     * @param {object} options — { excludeIds }
     * @returns {Array} — [{ day, breakfast, lunch, dinner }]
     */
    function generateWeekMenu(recipes, options = {}) {
        return Recommender.generateWeekMenu(recipes, profile.value, options)
    }

    /**
     * Получить рецепты, похожие на данный.
     * @param {Array}  recipes   — полный каталог
     * @param {string} recipeId  — id базового рецепта
     * @param {number} topN      — количество
     */
    function getSimilar(recipes, recipeId, topN = 6) {
        return recommend(recipes, { strategy: 'similar', similarToId: recipeId, topN })
            .map(r => r.recipe)
    }

    /**
     * Следует ли показать welcome / onboarding?
     * Если событий < 5 — пользователь новый.
     */
    const isNewUser = computed(() => profile.value.totalSignals < 5)

    /**
     * Уровень персонализации (0–3):
     * 0 — нет данных, 1 — мало, 2 — достаточно, 3 — богатый профиль
     */
    const personalizationLevel = computed(() => {
        const s = profile.value.totalSignals
        if (s === 0) return 0
        if (s < 10) return 1
        if (s < 30) return 2
        return 3
    })

    /** Сбросить аналитику (настройки профиля, GDPR-удаление) */
    function resetProfile() {
        engine.clear()
        _eventTick.value = 0
    }

    /**
     * Пользователь прошёл онбординг — есть хотя бы один свайп-лайк.
     * Используй в компонентах чтобы решить: показывать персональную ленту
     * или generic «популярные рецепты».
     */
    const hasCompletedOnboarding = computed(() => profile.value.hasOnboardingData)

    /**
     * Текущий множитель холодного старта (от 2.5 до 1.0).
     * 2.5 — сразу после онбординга, онбординговые предпочтения доминируют.
     * 1.0 — после ~15 поведенческих событий, профиль живёт своей жизнью.
     * Можно использовать в UI: например, показывать бейдж «Подобрано для тебя»
     * только когда coldStartFactor > 1 (то есть, ещё работает онбординг-буст).
     */
    const coldStartFactor = computed(() => {
        const p = profile.value
        const behaviorSignals = p.totalSignals - (p.hasOnboardingData ? 1 : 0)
        return p.hasOnboardingData
            ? Math.max(1.0, 2.5 - behaviorSignals * 0.1)
            : 1.0
    })

    /** Получить сырые события для дебага / экспорта */
    function getRawEvents(filters = {}) {
        return engine.getEvents(filters)
    }

    return {
        // Трекинг
        track,
        trackRecipe,

        // Рекомендации
        recommend,
        sortedRecipes,
        generateWeekMenu,
        getSimilar,

        // Профиль (реактивный)
        profile: readonly(profile),
        topCategories: readonly(topCategories),
        preferredCookTime: readonly(preferredCookTime),
        isNewUser: readonly(isNewUser),
        personalizationLevel: readonly(personalizationLevel),
        hasCompletedOnboarding: readonly(hasCompletedOnboarding),
        coldStartFactor: readonly(coldStartFactor),

        // Утилиты
        resetProfile,
        getRawEvents,

        // Константы (для удобного импорта)
        EVENT,
    }
}

// ─────────────────────────────────────────────────────────────
// ИНТЕГРАЦИОННЫЕ ХЕЛПЕРЫ ДЛЯ VUE-КОМПОНЕНТОВ
// ─────────────────────────────────────────────────────────────

/**
 * Хелпер для RecipesView.vue:
 * вызывать в processSwipe() вместо текущей логики.
 *
 * Пример в RecipesView.vue:
 *   import { useAnalytics, EVENT } from '@/composables/useAnalytics'
 *   const { trackRecipe } = useAnalytics()
 *
 *   function processSwipe(dir) {
 *     const rec = currentRecipe.value
 *     trackRecipe(dir === 'right' ? EVENT.FEED_SWIPE_RIGHT : EVENT.FEED_SWIPE_LEFT, rec)
 *     // ... остальная логика
 *   }
 */

/**
 * Хелпер для Onboarding.vue — трекинг свайпов на онбординге:
 *
 *   // В processSwipe() онбординга — ВАЖНО передавать все поля рецепта,
 *   // иначе ProfileBuilder не сможет построить категорийные/тегов скоры.
 *   trackRecipe(EVENT.ONBOARDING_SWIPE_LIKE, dish)    // dish — объект с category, tags, ingredients
 *   trackRecipe(EVENT.ONBOARDING_SWIPE_DISLIKE, dish)
 *
 *   // После завершения онбординга (шаг FAMILY_SET):
 *   track(EVENT.ONBOARDING_FAMILY_SET, {
 *     familySize,
 *     dietTags,    // ['вегетарианство', 'без глютена']
 *     allergenTags // ['орехи', 'лактоза']
 *   })
 *
 *   // Сразу после онбординга пользователь попадает в RecipesView.
 *   // sortedRecipes() уже вернёт персонализированный порядок —
 *   // лайкнутые категории/теги окажутся выше.
 *   // coldStartFactor будет ~2.5, то есть онбординг доминирует.
 *   // После ~15 свайпов в ленте он плавно снижается до 1.0.
 */

/**
 * Хелпер для MenuView.vue — трекинг замен в меню:
 *
 *   trackRecipe(EVENT.MENU_SLOT_REPLACE, replacedRecipe)
 *   trackRecipe(EVENT.MENU_SLOT_ACCEPT, keptRecipe)
 */

/**
 * Хелпер для PricesView.vue — трекинг интереса к заказу:
 *
 *   track(EVENT.PRICE_ORDER_CLICK, {
 *     store: 'samokat',
 *     totalPrice: 2340,
 *     recipeIds: [...currentMenuIds],
 *   })
 */