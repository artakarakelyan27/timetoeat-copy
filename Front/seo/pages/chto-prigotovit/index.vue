<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Что приготовить' }]" />

		<h1>Что приготовить — выбери по ситуации</h1>

		<p class="lead">
			Не каждый раз вопрос «что приготовить» одинаковый. Иногда нужно быстро, иногда из
			того, что уже лежит в холодильнике, иногда — на конкретный приём пищи. Ниже —
			точки входа под разные сценарии.
		</p>

		<section class="hub-grid" aria-label="Сценарии готовки">
			<NuxtLink to="/chto-prigotovit/iz-togo-chto-est" class="hub-card hub-card--featured">
				<span class="hub-card__emoji" aria-hidden="true">🥗</span>
				<div>
					<h2>Из того, что есть дома</h2>
					<p>Отметь продукты — получи 5 рецептов из них. Без похода в магазин.</p>
				</div>
			</NuxtLink>

			<NuxtLink to="/iz-ostatkov" class="hub-card">
				<span class="hub-card__emoji" aria-hidden="true">♻️</span>
				<div>
					<h2>Из остатков</h2>
					<p>Осталась варёная курица, рис или картошка? Не выбрасывай — переделай.</p>
				</div>
			</NuxtLink>

			<NuxtLink to="/gotovim-vprok" class="hub-card">
				<span class="hub-card__emoji" aria-hidden="true">📦</span>
				<div>
					<h2>Готовим впрок</h2>
					<p>Два часа в воскресенье — еда на 5 дней без повторных кастрюль.</p>
				</div>
			</NuxtLink>

			<NuxtLink to="/menyu-na-nedelyu" class="hub-card hub-card--cta">
				<span class="hub-card__emoji" aria-hidden="true">⚡️</span>
				<div>
					<h2>Меню на неделю</h2>
					<p>Готовое решение на 7 дней + список покупок. За 60 секунд.</p>
				</div>
			</NuxtLink>
		</section>
	</article>
</template>

<script setup lang="ts">
useSeoHead({
	title: 'Что приготовить — выбери по ситуации',
	description: 'Четыре точки входа: из того что есть дома, из остатков, готовим впрок, готовое меню на неделю.',
	path: '/chto-prigotovit',
	ogSlug: 'chto-prigotovit',
});
</script>

<style scoped>
.lead {
	color: var(--t2);
	margin-bottom: var(--xl);
}

.hub-grid {
	display: grid;
	gap: var(--lg);
}

@media (min-width: 640px) {
	.hub-grid {
		grid-template-columns: 1fr 1fr;
	}
}

.hub-card {
	display: flex;
	gap: var(--lg);
	align-items: flex-start;
	padding: var(--xl);
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	text-decoration: none;
	color: var(--t1);
	transition: transform 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-out);
}

.hub-card:hover {
	transform: translateY(-2px);
	box-shadow: var(--sh2);
	color: var(--t1);
}

.hub-card__emoji {
	font-size: 40px;
	line-height: 1;
	flex-shrink: 0;
}

.hub-card h2 {
	margin: 0 0 4px;
	font-family: var(--ff-display);
	font-size: 1.2rem;
}

.hub-card p {
	margin: 0;
	color: var(--t2);
	font-size: 0.9rem;
}

.hub-card--featured {
	background: var(--gp);
}

.hub-card--cta {
	background: var(--brand-gradient);
	color: #fff;
}

.hub-card--cta h2,
.hub-card--cta p,
.hub-card--cta:hover {
	color: #fff;
}
</style>
