<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Из остатков' }]" />

		<h1>Что приготовить из остатков</h1>

		<p class="lead">
			Каждую неделю в холодильнике оказывается вчерашний рис, варёная курица, остатки
			фарша или картошки. Выкидывать жалко, а на «новое блюдо» сил уже нет. Эти
			подборки — про то, как переделать вчерашнее в съедобное сегодня, не открывая
			кулинарную книгу.
		</p>

		<section aria-labelledby="grid-h">
			<h2 id="grid-h" class="sr-only">Список</h2>
			<div class="ostatki-grid">
				<NuxtLink
					v-for="item in items"
					:key="item.slug"
					:to="`/iz-ostatkov/${item.slug}`"
					class="ostatki-card"
				>
					<span class="ostatki-card__emoji" aria-hidden="true">{{ item.emoji }}</span>
					<div>
						<h3>Из {{ item.name }}</h3>
						<p>{{ item.short_answer.split('.')[0] }}.</p>
					</div>
				</NuxtLink>
			</div>
		</section>

		<section class="value">
			<h2>Почему это вообще важно</h2>
			<p>
				По данным ФАО, в среднем семья из 3 человек выбрасывает 4–6 кг еды в неделю —
				деньги, которые буквально летят в мусорное ведро. Большая часть — это варёные
				продукты, которые «забыли съесть». Эти подборки решают двойную задачу:
				экономия и меньше вины.
			</p>
		</section>

		<div class="cta-block">
			<p><strong>Хочешь, чтобы остатков было меньше?</strong></p>
			<p>Меню «Время Есть» переиспользует ингредиенты между днями. Курица в понедельник — в кесадилью в среду. Без напоминаний.</p>
			<a href="/" class="btn-cta">Собрать недельное меню</a>
		</div>
	</article>
</template>

<script setup lang="ts">
const { data: items } = await useAsyncData('ostatki-list', () =>
	$fetch<any[]>('/api/_content/iz-ostatkov'),
);

useSeoHead({
	title: 'Что приготовить из остатков — варёной курицы, риса, картошки, пасты',
	description: 'Конкретные рецепты за 5–20 минут из вчерашних продуктов. Без сложных ингредиентов и без вины за выкинутую еду.',
	path: '/iz-ostatkov',
	ogSlug: 'iz-ostatkov',
});
</script>

<style scoped>
.lead {
	color: var(--t2);
	margin-bottom: var(--xl);
	line-height: 1.55;
}

.ostatki-grid {
	display: grid;
	gap: var(--md);
}

@media (min-width: 640px) {
	.ostatki-grid {
		grid-template-columns: 1fr 1fr;
	}
}

.ostatki-card {
	display: flex;
	gap: var(--md);
	align-items: flex-start;
	padding: var(--lg);
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	text-decoration: none;
	color: var(--t1);
	transition: transform 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-out);
}

.ostatki-card:hover {
	transform: translateY(-2px);
	box-shadow: var(--sh2);
	color: var(--t1);
}

.ostatki-card__emoji {
	font-size: 36px;
	line-height: 1;
	flex-shrink: 0;
}

.ostatki-card h3 {
	margin: 0 0 4px;
	font-family: var(--ff-display);
	font-size: 1.1rem;
}

.ostatki-card p {
	margin: 0;
	color: var(--t2);
	font-size: 0.9rem;
	line-height: 1.45;
}

.value {
	background: var(--surf);
	border-radius: var(--r-card);
	padding: var(--xl);
	margin: var(--xxl) 0;
}

.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
}

.cta-block p {
	margin: 0 0 var(--sm);
}
</style>
