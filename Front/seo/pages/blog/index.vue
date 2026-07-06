<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Блог' }]" />

		<h1>Блог</h1>

		<p class="lead">
			Здесь будут редакционные статьи про экономию времени на кухне, реальную экономию
			бюджета на продукты и недозаполненные кулинарные темы. По плану — одна публикация
			в 1-2 недели.
		</p>

		<section class="placeholder">
			<h2>А пока — лучше зайди сюда:</h2>
			<ul class="placeholder__list">
				<li>
					<NuxtLink to="/menyu-na-nedelyu">Готовое меню на неделю</NuxtLink> —
					для семьи, ПП и бюджетного питания.
				</li>
				<li>
					<NuxtLink to="/chto-prigotovit/iz-togo-chto-est">Что приготовить из того, что есть дома</NuxtLink> —
					селектор продуктов и 5 рецептов под них.
				</li>
				<li>
					<NuxtLink to="/spravochnik">Справочник замен и сроков хранения</NuxtLink> —
					короткие ответы у плиты.
				</li>
				<li>
					<NuxtLink to="/iz-ostatkov">Что приготовить из остатков</NuxtLink> —
					сценарии для вчерашних продуктов.
				</li>
			</ul>
		</section>

		<div class="cta-block">
			<p>Хочешь меню на неделю и список покупок прямо сейчас?</p>
			<a href="/onboarding" class="btn-cta">Открыть приложение</a>
		</div>
	</article>
</template>

<script setup lang="ts">
useSeoHead({
	title: 'Блог «Время Есть» — статьи о готовке без стресса',
	description: 'Редакционные материалы про экономию времени на кухне и реальные кейсы планирования питания. Скоро.',
	path: '/blog',
	ogSlug: 'blog',
});
</script>

<style scoped>
.lead {
	color: var(--t2);
	margin-bottom: var(--xl);
	line-height: 1.55;
}
.placeholder {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--xl);
	margin-bottom: var(--xl);
}
.placeholder h2 { margin-top: 0; font-size: 1.1rem; }
.placeholder__list { padding-left: 20px; }
.placeholder__list li { margin-bottom: var(--sm); line-height: 1.55; }
.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
}
.cta-block p { margin: 0 0 var(--md); }
</style>
