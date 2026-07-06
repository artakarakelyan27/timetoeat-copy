<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Справочник' }]" />

		<h1>Справочник продуктов</h1>

		<p class="lead">
			Замены ингредиентов, сроки хранения, признаки порчи. Короткие ответы на вопросы,
			которые возникают у плиты каждую неделю.
		</p>

		<section aria-labelledby="zameny-h">
			<h2 id="zameny-h">Чем заменить продукт</h2>
			<p class="muted">Если внезапно не хватает яиц, сметаны или муки — посмотри замены по типам блюд.</p>
			<ul class="ref-list">
				<li v-for="item in zameny" :key="`z-${item.slug}`">
					<NuxtLink :to="`/spravochnik/zameny/${item.slug}`">
						<span class="ref-emoji" aria-hidden="true">{{ item.emoji }}</span>
						Чем заменить {{ item.name.toLowerCase() }}
					</NuxtLink>
				</li>
			</ul>
		</section>

		<section aria-labelledby="srok-h">
			<h2 id="srok-h">Сколько хранится продукт</h2>
			<p class="muted">Сроки в холодильнике, морозилке, при комнатной температуре + как понять, что испортилось.</p>
			<ul class="ref-list">
				<li v-for="item in sroki" :key="`s-${item.slug}`">
					<NuxtLink :to="`/spravochnik/srok-khraneniya/${item.slug}`">
						<span class="ref-emoji" aria-hidden="true">{{ item.emoji }}</span>
						Сколько хранится {{ item.name.toLowerCase() }}
					</NuxtLink>
				</li>
			</ul>
		</section>
	</article>
</template>

<script setup lang="ts">
const { data: zameny } = await useAsyncData('zameny-list', () => $fetch<any[]>('/api/_content/zameny'));
const { data: sroki } = await useAsyncData('sroki-list', () => $fetch<any[]>('/api/_content/srok-khraneniya'));

useSeoHead({
	title: 'Справочник продуктов: замены и сроки хранения',
	description: 'Чем заменить ингредиент и сколько он хранится в холодильнике или морозилке. Короткие ответы у плиты.',
	path: '/spravochnik',
	ogSlug: 'spravochnik',
});
</script>

<style scoped>
.lead {
	color: var(--t2);
	margin-bottom: var(--xl);
}

.muted {
	color: var(--t3);
	margin-bottom: var(--md);
	font-size: 0.9rem;
}

.ref-list {
	list-style: none;
	padding: 0;
	margin: 0 0 var(--xxl);
	display: grid;
	gap: var(--sm);
}

.ref-list li {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	transition: transform 0.2s var(--ease-spring);
}

.ref-list li:hover {
	transform: translateY(-1px);
}

.ref-list a {
	display: flex;
	align-items: center;
	gap: var(--md);
	padding: var(--md) var(--lg);
	text-decoration: none;
	color: var(--t1);
	font-weight: 600;
	min-height: var(--touch);
}

.ref-emoji {
	font-size: 24px;
	line-height: 1;
}
</style>
