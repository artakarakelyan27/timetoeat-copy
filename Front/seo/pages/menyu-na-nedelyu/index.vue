<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Меню на неделю' }]" />

		<h1>Готовое меню на неделю</h1>

		<p class="lead">
			Полное 7-дневное меню с КБЖУ, реальным временем готовки по дням, списком покупок
			и подсказками «достань из морозилки». Подбирай по сегменту и сразу открывай в
			приложении за минуту — там же автоматически собирается список покупок.
		</p>

		<section v-if="menus?.length" class="menu-grid" aria-label="Готовые меню">
			<NuxtLink
				v-for="m in menus"
				:key="m.slug"
				:to="`/menyu-na-nedelyu/${m.slug}`"
				class="menu-card"
			>
				<div class="menu-card__emoji" aria-hidden="true">{{ m.emoji }}</div>
				<div class="menu-card__body">
					<h2>{{ m.title }}</h2>
					<p class="menu-card__audience">{{ m.audience }}</p>
					<ul class="menu-card__meta">
						<li v-if="m.avg_kcal"><strong>{{ m.avg_kcal }}</strong> ккал/день</li>
						<li v-if="m.weekly_budget_hint">{{ m.weekly_budget_hint }}</li>
					</ul>
					<p class="menu-card__short">{{ m.short_answer.slice(0, 160) }}...</p>
				</div>
			</NuxtLink>
		</section>

		<!-- Дисклеймер для прозрачности (E-E-A-T) -->
		<section class="methodology">
			<h2>Как мы составляем меню</h2>
			<p>
				Алгоритм отбирает рецепты по трём критериям: ровный КБЖУ за день, максимальное
				переиспользование ингредиентов между днями (короче список покупок) и реалистичные
				тайминги готовки в будни. Никаких «10-минутных» рецептов которые в реальности
				занимают 40. Подробности —
				<NuxtLink to="/o-proekte">в методологии проекта</NuxtLink>.
			</p>
		</section>

		<div class="cta-block">
			<p><strong>Хочешь меню под свою семью, диету или бюджет — точечно?</strong></p>
			<a href="/" class="btn-cta">Составить меню за 60 сек</a>
			<small>За минуту алгоритм соберёт уникальное меню под твои параметры и сразу список покупок.</small>
		</div>
	</article>
</template>

<script setup lang="ts">
const { data: menus } = await useAsyncData('menus-list', () =>
	$fetch<any[]>('/api/_content/menyu'),
);

useSeoHead({
	title: 'Меню на неделю — готовые подборки с КБЖУ и списком покупок',
	description: 'Готовые 7-дневные меню для семьи, ПП и бюджетного питания. С КБЖУ, временем готовки по дням и списком покупок. Открывается в приложении за минуту.',
	path: '/menyu-na-nedelyu',
	ogSlug: 'menyu-na-nedelyu',
});

// Schema CollectionPage + ItemList
const config = useRuntimeConfig().public;
useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				name: 'Меню на неделю',
				url: `${config.siteUrl}/menyu-na-nedelyu`,
				mainEntity: {
					'@type': 'ItemList',
					itemListElement: (menus.value || []).map((m, i) => ({
						'@type': 'ListItem',
						position: i + 1,
						url: `${config.siteUrl}/menyu-na-nedelyu/${m.slug}`,
						name: m.title,
					})),
				},
			}),
		},
	],
});
</script>

<style scoped>
.lead {
	color: var(--t2);
	margin-bottom: var(--xl);
	line-height: 1.55;
}

.menu-grid {
	display: grid;
	gap: var(--lg);
	margin-bottom: var(--xxl);
}

.menu-card {
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

.menu-card:hover {
	transform: translateY(-2px);
	box-shadow: var(--sh2);
	color: var(--t1);
}

.menu-card__emoji {
	font-size: 48px;
	line-height: 1;
	flex-shrink: 0;
}

.menu-card__body { flex: 1; min-width: 0; }

.menu-card h2 {
	margin: 0 0 4px;
	font-family: var(--ff-display);
	font-size: 1.2rem;
}

.menu-card__audience {
	color: var(--t2);
	font-size: 0.9rem;
	margin: 0 0 var(--sm);
}

.menu-card__meta {
	list-style: none;
	padding: 0;
	margin: 0 0 var(--sm);
	display: flex;
	gap: var(--md);
	flex-wrap: wrap;
	color: var(--t3);
	font-size: 0.85rem;
}

.menu-card__meta strong { color: var(--gd); }

.menu-card__short {
	margin: 0;
	color: var(--t2);
	font-size: 0.9rem;
	line-height: 1.5;
}

.methodology {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	margin: var(--xxl) 0;
}
.methodology p { margin: var(--sm) 0 0; color: var(--t2); }

.cta-block {
	background: var(--brand-gradient);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
	color: #fff;
}
.cta-block p, .cta-block small { color: #fff; }
.cta-block p { margin: 0 0 var(--md); }
.cta-block .btn-cta { background: #fff; color: var(--gd); }
.cta-block small { display: block; margin-top: var(--sm); opacity: 0.9; font-size: 0.85rem; }
</style>
