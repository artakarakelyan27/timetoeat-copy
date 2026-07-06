<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

function isActive(names) {
  return names.includes(route.name)
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Основная навигация">

    <router-link to="/recipes" class="nav-item" :class="{ active: isActive(['recipes']) }" :aria-current="isActive(['recipes']) ? 'page' : null">
      <span class="nav-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
      </span>
      <span class="nav-label">Рецепты</span>
    </router-link>

    <router-link to="/menu" class="nav-item" :class="{ active: isActive(['menu']) }" :aria-current="isActive(['menu']) ? 'page' : null">
      <span class="nav-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </span>
      <span class="nav-label">Меню</span>
    </router-link>

    <router-link to="/saved" class="nav-item" :class="{ active: isActive(['saved']) }" :aria-current="isActive(['saved']) ? 'page' : null">
      <span class="nav-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </span>
      <span class="nav-label">Сохранения</span>
    </router-link>

    <router-link to="/prices" class="nav-item" :class="{ active: isActive(['prices']) }" :aria-current="isActive(['prices']) ? 'page' : null">
      <span class="nav-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      </span>
      <span class="nav-label">Цены</span>
    </router-link>

    <router-link to="/profile" class="nav-item" :class="{ active: isActive(['profile']) }" :aria-current="isActive(['profile']) ? 'page' : null">
      <span class="nav-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </span>
      <span class="nav-label">Профиль</span>
    </router-link>

  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  
  display: flex;
  background: var(--surf);
  border-top: 1px solid var(--bdr);
  box-shadow: 0 -4px 16px rgba(26, 46, 34, 0.06);

  /* 1. Используем стандартный border-box */
  box-sizing: border-box;

  /* 2. ЖЕСТКАЯ ВЫСОТА: 
     Мы явно говорим: высота блока = 60px кнопок + отступ.
     Если env вернет 0, сработает fallback 30px. */
  height: calc(var(--nav-h, 60px) + env(safe-area-inset-bottom, 30px));
  
  /* 3. ПАДДИНГ: 
     Он создаст пустоту внизу, "выталкивая" иконки вверх. */
  padding-bottom: env(safe-area-inset-bottom, 30px);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  
  /* 4. Кнопки внутри всегда занимают верхние 60px */
  height: var(--nav-h, 60px); 
  
  color: var(--t3);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.nav-label {
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1;
}

.nav-item.active { color: var(--g) !important; }
</style>