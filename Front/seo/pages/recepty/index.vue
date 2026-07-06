<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Рецепты' }]" />

		<h1>Каталог рецептов</h1>

		<p class="lead">
			В нашей базе пошаговые рецепты с КБЖУ. Каждый можно одним кликом добавить в меню
			недели — список покупок алгоритм соберёт автоматически.
		</p>

		<section v-if="data?.items?.length" aria-label="Список рецептов">
			<p class="counter">Всего рецептов: <strong>{{ data.total }}</strong></p>

			<div class="recipes-grid">
				<RecipeCardEmoji
					v-for="r in data.items"
					:key="r.slug"
					:recipe="r"
				/>
			</div>

			<p v-if="data.total > data.items.length" class="more-hint">
				Это первые {{ data.items.length }} рецептов. Полная навигация по категориям и фильтрам
				появится с расширением каталога. Пока самые быстрые точки входа —
				<NuxtLink to="/chto-prigotovit/iz-togo-chto-est">подбор по продуктам, что есть дома</NuxtLink>,
				или <NuxtLink to="/menyu-na-nedelyu">готовые недельные меню</NuxtLink>.
			</p>
		</section>

		<section v-else class="empty">
			<h2>Каталог скоро здесь появится</h2>
			<p>
				Рецепты сейчас собираются из приложения. Пока попробуй:
			</p>
			<ul>
				<li><NuxtLink to="/chto-prigotovit/iz-togo-chto-est">Подобрать рецепт из того, что есть дома</NuxtLink></li>
				<li><NuxtLink to="/menyu-na-nedelyu">Готовое меню на неделю</NuxtLink></li>
			</ul>
		</section>

		<div class="cta-block">
			<p><strong>Хочешь меню под свои предпочтения сразу?</strong></p>
			<a href="/onboarding" class="btn-cta">Составить меню за 60 сек</a>
		</div>
	</article>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const apiBase = config.apiBase || '';

const { data } = await useAsyncData('recipes-catalog', async () => {
	const url = import.meta.server
		? `${apiBase}/api/seo/recipes?limit=24&offset=0`
		: `/api/seo/recipes?limit=24&offset=0`;
	try {
		return await $fetch<any>(url);
	} catch {
		return { total: 0, items: [] };
	}
});

useSeoHead({
	title: 'Каталог рецептов — пошаговые с КБЖУ',
	description: 'Каталог проверенных рецептов с КБЖУ, временем приготовления и пошаговыми инструкциями. Можно добавить в недельное меню одним кликом.',
	path: '/recepty',
	ogSlug: 'recepty',
});

const siteUrl = useRuntimeConfig().public.siteUrl;
useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				name: 'Каталог рецептов',
				url: `${siteUrl}/recepty`,
				mainEntity: {
					'@type': 'ItemList',
					numberOfItems: data.value?.total || 0,
					itemListElement: (data.value?.items || []).map((r: any, idx: number) => ({
						'@type': 'ListItem',
						position: idx + 1,
						url: `${siteUrl}/recepty/${r.slug}`,
						name: r.name,
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
}
.counter {
	color: var(--t3);
	font-size: 0.9rem;
	margin: 0 0 var(--lg);
}
.counter strong { color: var(--gd); }
.recipes-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: var(--lg);
	margin-bottom: var(--xl);
}
.more-hint {
	background: var(--gp);
	padding: var(--lg);
	border-radius: var(--r-card);
	color: var(--t2);
	font-size: 0.9rem;
}
.empty {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--xl);
	margin-bottom: var(--xl);
}
.empty h2 { margin-top: 0; }
.cta-block {
	background: var(--brand-gradient);
	color: #fff;
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
}
.cta-block p { color: #fff; margin: 0 0 var(--md); }
.cta-block .btn-cta { background: #fff; color: var(--gd); }
</style>
