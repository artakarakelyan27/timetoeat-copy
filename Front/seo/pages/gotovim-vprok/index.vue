<template>
	<article>
		<Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Готовим впрок' }]" />

		<h1>Готовим впрок</h1>

		<p class="lead">
			Подборки про batch cooking — как за 1-2 часа в воскресенье обеспечить себя готовой
			едой на 4-5 дней. Раздел заполняется — пока главные ориентиры ниже.
		</p>

		<section class="placeholder">
			<h2>Что уже есть:</h2>
			<ul class="placeholder__list">
				<li>
					<NuxtLink to="/menyu-na-nedelyu/dlya-semi">Меню для семьи</NuxtLink> —
					внутри есть блок «что готовится впрок» с конкретными заготовками на неделю.
				</li>
				<li>
					<NuxtLink to="/menyu-na-nedelyu/byudzhetnoe">Бюджетное меню</NuxtLink> —
					стратегия заморозки пельменей и крупных партий мяса со скидкой.
				</li>
				<li>
					<NuxtLink to="/spravochnik/srok-khraneniya/kuritsa">Сколько хранится курица</NuxtLink> —
					в том числе как правильно замораживать.
				</li>
				<li>
					<NuxtLink to="/iz-ostatkov">Что приготовить из остатков</NuxtLink> —
					обратная сторона: что делать когда заготовка частично съедена.
				</li>
			</ul>
		</section>

		<div class="cta-block">
			<p><strong>Хочешь меню с готовкой впрок в воскресенье?</strong></p>
			<a href="/onboarding" class="btn-cta">Составить меню за 60 сек</a>
			<small>В приложении день недели с готовкой впрок отмечается отдельно</small>
		</div>
	</article>
</template>

<script setup lang="ts">
useSeoHead({
	title: 'Готовим впрок — batch cooking и заморозка',
	description: 'Подборки про подготовку еды на 4-5 дней за один час готовки. Скоро будут отдельные сценарии — пока используй меню на неделю.',
	path: '/gotovim-vprok',
	ogSlug: 'gotovim-vprok',
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
.cta-block small { display: block; margin-top: var(--sm); color: var(--t3); font-size: 0.85rem; }
</style>
