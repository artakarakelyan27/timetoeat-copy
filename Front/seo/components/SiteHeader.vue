<template>
	<header class="header" role="banner">
		<div class="header__inner">
			<a href="/" class="logo" aria-label="Главная — Время Есть">
				<span class="logo__mark" aria-hidden="true">
					<!-- Лого синхронизировано с SPA: циферблат часов (круг + стрелки),
					     отсылка к названию «Время Есть». Тот же SVG, что и в шапке приложения. -->
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="white"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
				</span>
				<span class="logo__text">Время Есть</span>
			</a>

			<nav class="nav" aria-label="Основная навигация">
				<NuxtLink to="/recepty" class="nav__link">Рецепты</NuxtLink>
				<NuxtLink to="/chto-prigotovit" class="nav__link">Что приготовить</NuxtLink>
				<NuxtLink to="/menyu-na-nedelyu" class="nav__link cta-link">Меню на неделю</NuxtLink>
			</nav>
		</div>
	</header>
</template>

<style scoped>
.header {
	background: var(--surf);
	border-bottom: 1px solid var(--bdr);
	position: sticky;
	top: 0;
	z-index: 50;
}

.header__inner {
	max-width: 760px;
	margin: 0 auto;
	padding: 12px var(--lg);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--lg);
	min-height: var(--topbar-h);
}

.logo {
	display: inline-flex;
	align-items: center;
	gap: var(--sm);
	text-decoration: none;
	color: var(--t1);
}

.logo__mark {
	width: 32px;
	height: 32px;
	background: var(--brand-gradient);
	border-radius: var(--r-logo);
	box-shadow: var(--sh-logo);
	display: flex;
	align-items: center;
	justify-content: center;
}

.logo__mark svg {
	width: 18px;
	height: 18px;
}

.logo__text {
	font-family: var(--ff-display);
	font-weight: 800;
	font-size: 16px;
	letter-spacing: -0.01em;
}

.nav {
	display: flex;
	gap: var(--md);
	align-items: center;
}

.nav__link {
	color: var(--t2);
	text-decoration: none;
	font-weight: 600;
	font-size: 0.9rem;
	padding: 8px 0;
	min-height: var(--touch);
	display: inline-flex;
	align-items: center;
}

.nav__link:hover,
.nav__link.router-link-active {
	color: var(--gd);
}

.nav__link.cta-link {
	color: var(--gd);
	background: var(--gp);
	padding: 8px 14px;
	border-radius: var(--r-pill);
}

@media (max-width: 640px) {
	.nav__link:not(.cta-link) {
		display: none;
	}
}
</style>
