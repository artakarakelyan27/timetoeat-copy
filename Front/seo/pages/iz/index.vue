<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Ингредиенты' }]" />

		<h1>Справочник ингредиентов</h1>

		<p class="lead">
			Для каждого продукта собрано всё, что нужно знать у плиты: чем заменить,
			сколько хранится, что приготовить из остатков. По мере появления рецептов
			из БД — добавим прямые ссылки и сюда.
		</p>

		<section v-if="ingredients?.length" aria-label="Список ингредиентов">
			<div class="ing-grid">
				<NuxtLink
					v-for="i in ingredients"
					:key="i.slug"
					:to="`/iz/${i.slug}`"
					class="ing-card"
				>
					<span class="ing-card__emoji" aria-hidden="true">{{ i.emoji }}</span>
					<div class="ing-card__body">
						<h2>{{ i.name }}</h2>
						<p class="ing-card__tags">
							<span v-if="i.hasZameny" class="tag tag--green">замены</span>
							<span v-if="i.hasSrokKhraneniya" class="tag tag--blue">хранение</span>
							<span v-if="i.hasOstatki" class="tag tag--amber">остатки</span>
						</p>
					</div>
				</NuxtLink>
			</div>
		</section>

		<div class="cta-block">
			<p><strong>Нужен рецепт под конкретный продукт?</strong></p>
			<a href="/onboarding" class="btn-cta">Подобрать меню за 60 сек</a>
		</div>
	</article>
</template>

<script setup lang="ts">
const { data: ingredients } = await useAsyncData('iz-list', () =>
	$fetch<any[]>('/api/_content/iz'),
);

useSeoHead({
	title: 'Справочник ингредиентов — замены, хранение, рецепты',
	description: 'Полный справочник продуктов: чем заменить, сколько хранится в холодильнике и морозилке, что приготовить из остатков.',
	path: '/iz',
	ogSlug: 'iz',
});

const config = useRuntimeConfig().public;
useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				name: 'Справочник ингредиентов',
				url: `${config.siteUrl}/iz`,
				mainEntity: {
					'@type': 'ItemList',
					itemListElement: (ingredients.value || []).map((i, idx) => ({
						'@type': 'ListItem',
						position: idx + 1,
						url: `${config.siteUrl}/iz/${i.slug}`,
						name: i.name,
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

.ing-grid {
	display: grid;
	gap: var(--md);
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	margin-bottom: var(--xxl);
}

.ing-card {
	display: flex;
	gap: var(--md);
	align-items: center;
	padding: var(--md) var(--lg);
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	text-decoration: none;
	color: var(--t1);
	transition: transform 0.2s var(--ease-spring);
}
.ing-card:hover { transform: translateY(-2px); color: var(--t1); }
.ing-card__emoji { font-size: 28px; line-height: 1; flex-shrink: 0; }
.ing-card__body { flex: 1; min-width: 0; }
.ing-card h2 {
	margin: 0 0 4px;
	font-family: var(--ff-display);
	font-size: 1rem;
}
.ing-card__tags {
	margin: 0;
	display: flex;
	gap: 4px;
	flex-wrap: wrap;
}
.tag {
	font-size: 0.7rem;
	font-weight: 700;
	padding: 2px 6px;
	border-radius: var(--r-chip);
}
.tag--green  { background: var(--gp);      color: var(--gd); }
.tag--blue   { background: var(--bluep);   color: var(--blue); }
.tag--amber  { background: var(--ambp);    color: var(--amb); }

.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
}
.cta-block p { margin: 0 0 var(--md); }
</style>
