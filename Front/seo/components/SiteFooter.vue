<template>
	<footer class="footer" role="contentinfo">
		<div class="footer__inner">
			<div class="footer__about">
				<p class="footer__methodology">
					Все рецепты, КБЖУ и меню подобраны командой «Время Есть» по
					<NuxtLink to="/o-proekte">прозрачной методологии</NuxtLink>.
					Источники данных о составе продуктов — справочник Роспотребнадзора и USDA FoodData Central.
				</p>
			</div>

			<nav class="footer__nav" aria-label="Подвал">
				<div class="footer__col">
					<h4>Сайт</h4>
					<NuxtLink to="/recepty">Все рецепты</NuxtLink>
					<NuxtLink to="/chto-prigotovit">Что приготовить</NuxtLink>
					<NuxtLink to="/menyu-na-nedelyu">Меню на неделю</NuxtLink>
					<NuxtLink to="/spravochnik">Справочник</NuxtLink>
				</div>
				<div class="footer__col">
					<h4>О проекте</h4>
					<NuxtLink to="/o-proekte">Методология</NuxtLink>
					<NuxtLink to="/blog">Блог</NuxtLink>
				</div>
			</nav>
		</div>

		<div class="footer__bottom">
			<small>© 2026 Время Есть. Все права защищены.</small>
		</div>
	</footer>
</template>

<style scoped>
.footer {
	margin-top: var(--xxxl);
	padding: var(--xxl) var(--lg);
	background: var(--surf2);
	border-top: 1px solid var(--bdr);
}

.footer__inner {
	max-width: 760px;
	margin: 0 auto;
	display: grid;
	gap: var(--xxl);
}

@media (min-width: 640px) {
	.footer__inner {
		grid-template-columns: 1fr 1fr;
	}
}

.footer__methodology {
	font-size: 0.85rem;
	color: var(--t2);
	line-height: 1.55;
	margin: 0;
}

.footer__nav {
	display: flex;
	gap: var(--xxl);
}

.footer__col {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.footer__col h4 {
	font-size: 0.85rem;
	font-weight: 700;
	color: var(--t1);
	margin: 0 0 6px;
	font-family: var(--ff-text);
}

.footer__col a {
	color: var(--t2);
	text-decoration: none;
	font-size: 0.85rem;
	padding: 4px 0;
	min-height: var(--touch);
	display: inline-flex;
	align-items: center;
}

.footer__col a:hover {
	color: var(--gd);
	text-decoration: underline;
}

.footer__bottom {
	max-width: 760px;
	margin: var(--lg) auto 0;
	padding-top: var(--lg);
	border-top: 1px solid var(--bdr);
	color: var(--t3);
	font-size: 0.8rem;
}
</style>
