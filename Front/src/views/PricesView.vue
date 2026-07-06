<script setup>
// Prices view — coming soon placeholder
</script>

<template>
  <div class="prices-view">


    <!-- ─── COMING SOON ─── -->
    <main class="content">
      <div class="coming-soon">
        <div class="icon-wrap" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </div>

        <h2 class="soon-title">Сравнение цен</h2>
        <p class="soon-desc">
          Скоро здесь появится умный поиск — сравнивай цены на продукты из
          вашего списка покупок в ближайших магазинах.
        </p>

        <ul class="feature-list" aria-label="Планируемые функции">
          <li class="feature-item">
            <span class="feature-dot" aria-hidden="true" />
            Автоматический поиск по списку покупок
          </li>
          <li class="feature-item">
            <span class="feature-dot" aria-hidden="true" />
            Сравнение цен в Самокате, Яндекс Лавке, Пятёрочке, ВкусВилле, Перекрёстке
          </li>
          <li class="feature-item">
            <span class="feature-dot" aria-hidden="true" />
            Выбор самого выгодного магазина
          </li>
        </ul>
      </div>
    </main>

  </div>
</template>

<style scoped>
.prices-view {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--nav-h) + var(--sab, env(safe-area-inset-bottom, 0px)) + 16px);
  background: var(--bg);
}

/* ─── CONTENT ─── */
.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  max-width: 320px;
}

.icon-wrap {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  background: var(--gpp);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--g);
  margin-bottom: 8px;
}

.soon-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--t1);
  line-height: 1.25;
}

.soon-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--t2);
}

/* ─── FEATURE LIST ─── */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  align-self: stretch;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  color: var(--t2);
}

.feature-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--g);
}
</style>
