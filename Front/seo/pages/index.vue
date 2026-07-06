<template>
	<article class="landing">
		<!-- ────────────────────────────────────────────────────────
		     Hero — мгновенный intent-fit (GIST + первый экран)
		     ──────────────────────────────────────────────────────── -->
		<section class="hero">
			<div class="hero__copy">
				<p class="hero__tag">сервис планирования питания · рецепты с КБЖУ</p>
				<h1>Меню на неделю за 60 секунд — с готовым списком покупок</h1>
				<p class="hero__sub">
					Не нужно скроллить кулинарные сайты. Откроешь — за минуту получишь меню на 7 дней
					с учётом продуктов, которые любит твоя семья. Список покупок собирается автоматически,
					свои рецепты можно добавлять и сохранять в одном месте.
				</p>
				<div class="hero__cta">
					<a href="/onboarding" class="btn-cta" @click="trackCta('hero')">
						Составить меню за 60 сек
					</a>
					<small>Бесплатно. Регистрация — после того как увидишь результат.</small>
				</div>
			</div>

			<!-- Декоративная плашка с 4 цветами приёмов пищи (брендбук р.09) -->
			<aside class="hero__demo" aria-hidden="true">
				<div class="demo-card demo-card--breakfast">
					<span>Завтрак</span>
					<strong>Сырники с творогом</strong>
					<span class="demo-card__meta">320 ккал · 15 мин</span>
				</div>
				<div class="demo-card demo-card--lunch">
					<span>Обед</span>
					<strong>Куриный суп-лапша</strong>
					<span class="demo-card__meta">280 ккал · 35 мин</span>
				</div>
				<div class="demo-card demo-card--dinner">
					<span>Ужин</span>
					<strong>Запечённая рыба с овощами</strong>
					<span class="demo-card__meta">380 ккал · 25 мин</span>
				</div>
				<div class="demo-card demo-card--snack">
					<span>Перекус</span>
					<strong>Йогурт с орехами</strong>
					<span class="demo-card__meta">180 ккал · 2 мин</span>
				</div>
			</aside>
		</section>

		<!-- ────────────────────────────────────────────────────────
		     Числовые доказательства (contentEffort + data-shift)
		     ──────────────────────────────────────────────────────── -->
		<section class="stats" aria-label="Что внутри">
			<div class="stat-card">
				<strong>60 сек</strong>
				<span>до готового меню — без регистрации до первого результата</span>
			</div>
			<div class="stat-card">
				<strong>7 дней</strong>
				<span>полное меню с КБЖУ — завтрак, обед, ужин и перекусы</span>
			</div>
			<div class="stat-card">
				<strong>1 клик</strong>
				<span>список покупок собирается автоматически из меню</span>
			</div>
			<div class="stat-card">
				<strong>свои рецепты</strong>
				<span>можно добавлять и сохранять в одном месте</span>
			</div>
		</section>

		<!-- ────────────────────────────────────────────────────────
		     4 точки входа в сайт (matriarchal navigation pattern
		     из «Доказательного SEO» — pillar-страницы как Mixed Pages)
		     ──────────────────────────────────────────────────────── -->
		<section class="pillars" aria-labelledby="pillars-h">
			<h2 id="pillars-h">Сценарии — выбери по ситуации</h2>

			<div class="pillars__grid">
				<NuxtLink to="/menyu-na-nedelyu" class="pillar pillar--menu">
					<div class="pillar__emoji" aria-hidden="true">📅</div>
					<h3>Готовое меню на неделю</h3>
					<p>Подборки для семьи, ПП, бюджетного питания. Полные 7 дней с КБЖУ и списком покупок.</p>
					<span class="pillar__link">Открыть подборки →</span>
				</NuxtLink>

				<NuxtLink to="/chto-prigotovit/iz-togo-chto-est" class="pillar pillar--fridge">
					<div class="pillar__emoji" aria-hidden="true">🥗</div>
					<h3>Из того, что есть в холодильнике</h3>
					<p>Отметь продукты — получишь 5 рецептов без похода в магазин. Реалистичные тайминги.</p>
					<span class="pillar__link">Подобрать →</span>
				</NuxtLink>

				<NuxtLink to="/iz-ostatkov" class="pillar pillar--leftover">
					<div class="pillar__emoji" aria-hidden="true">♻️</div>
					<h3>Из остатков</h3>
					<p>Что приготовить из вчерашней курицы, риса, картошки или фарша. Без сложных рецептов.</p>
					<span class="pillar__link">Сценарии →</span>
				</NuxtLink>

				<NuxtLink to="/spravochnik" class="pillar pillar--reference">
					<div class="pillar__emoji" aria-hidden="true">📖</div>
					<h3>Справочник</h3>
					<p>Чем заменить продукт, сколько он хранится, как понять что испортилось. Короткие ответы.</p>
					<span class="pillar__link">Открыть справочник →</span>
				</NuxtLink>
			</div>
		</section>

		<!-- ────────────────────────────────────────────────────────
		     Как это работает — три шага. Снимает страх «нужно регистрироваться».
		     ──────────────────────────────────────────────────────── -->
		<section class="how" aria-labelledby="how-h">
			<h2 id="how-h">Как работает</h2>

			<ol class="how__steps">
				<li>
					<strong>Скажи, что ты любишь</strong>
					<p>Tinder-механика: листай блюда за 30 секунд. Лайки запоминаются, нелюбимые продукты
					— тоже.</p>
				</li>
				<li>
					<strong>Получи меню за 60 секунд</strong>
					<p>Алгоритм собирает 7 дней с учётом твоих предпочтений, размера семьи и КБЖУ-целей.
					На этом шаге регистрация ещё не нужна — ты увидишь результат сначала.</p>
				</li>
				<li>
					<strong>Открой список покупок</strong>
					<p>Все ингредиенты из недельного меню объединяются в один список с группировкой по категориям.
					Свои рецепты можно добавить отдельно — они тоже попадут в список покупок.</p>
				</li>
			</ol>
		</section>

		<!-- ────────────────────────────────────────────────────────
		     CTA — после how-section (классический поинт конверсии)
		     ──────────────────────────────────────────────────────── -->
		<div class="cta-block cta-block--big">
			<p><strong>Готов попробовать?</strong></p>
			<p>За минуту увидишь, насколько проще питание становится с готовым планом.</p>
			<a href="/onboarding" class="btn-cta" @click="trackCta('after_how')">
				Составить меню за 60 сек
			</a>
		</div>

		<!-- ────────────────────────────────────────────────────────
		     FAQ — для AI Overview / Featured Snippets + QBST термины
		     ──────────────────────────────────────────────────────── -->
		<section class="faq" aria-labelledby="faq-h">
			<h2 id="faq-h">Частые вопросы</h2>

			<details>
				<summary>«Время Есть» — это бесплатно?</summary>
				<p>
					Базовый функционал бесплатный — меню на неделю, список покупок, КБЖУ для каждого
					рецепта и возможность добавлять свои рецепты в одну библиотеку. Этого хватает
					для повседневного планирования семейного питания.
				</p>
			</details>

			<details>
				<summary>Сколько времени экономит сервис?</summary>
				<p>
					По данным внутренних тестов — около 2–3 часов в неделю: меньше скроллинга кулинарных
					сайтов и не нужно вручную составлять список покупок. Плюс время в магазине сокращается,
					потому что ингредиенты уже сгруппированы по категориям.
				</p>
			</details>

			<details>
				<summary>Как сервис учитывает аллергии и диеты?</summary>
				<p>
					На онбординге можно указать аллергии (молочные продукты, глютен, орехи и т.д.) и
					предпочтения (ПП, вегетарианство, без свинины и т.п.). Алгоритм исключает
					несовместимые рецепты при составлении меню. Также можно отметить отдельные продукты,
					которые не нравятся в семье.
				</p>
			</details>

			<details>
				<summary>Откуда берутся КБЖУ для рецептов?</summary>
				<p>
					Для базовых продуктов используем таблицы Роспотребнадзора и открытую базу
					<a href="https://fdc.nal.usda.gov/" rel="nofollow">USDA FoodData Central</a>.
					КБЖУ для составных рецептов пересчитываются по массе ингредиентов с учётом потерь
					при тепловой обработке. Подробнее — в разделе
					<NuxtLink to="/o-proekte">«О проекте»</NuxtLink>.
				</p>
			</details>

			<details>
				<summary>Можно ли использовать без регистрации?</summary>
				<p>
					Да. Меню на неделю и список покупок ты увидишь сразу после онбординга. Регистрация
					требуется только если хочешь сохранить меню, поделиться с семьёй или вернуться к нему
					завтра. Это принцип сервиса — ценность до регистрации.
				</p>
			</details>

			<details>
				<summary>Можно ли добавлять свои рецепты?</summary>
				<p>
					Да. В личном кабинете есть раздел для собственных рецептов: указываешь ингредиенты
					с количеством и пошаговый процесс — рецепт попадает в общую библиотеку и автоматически
					участвует в подборе меню недели наравне с системными.
				</p>
			</details>
		</section>

		<!-- ────────────────────────────────────────────────────────
		     Финальный CTA
		     ──────────────────────────────────────────────────────── -->
		<div class="cta-block cta-block--final">
			<p>Сэкономь 2–3 часа в неделю на планировании питания.</p>
			<a href="/onboarding" class="btn-cta" @click="trackCta('final')">
				Начать — за 60 секунд
			</a>
		</div>
	</article>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

useSeoHead({
	title: 'Время Есть — меню на неделю за 60 секунд со списком покупок',
	description: 'Сервис планирования питания: персональное меню на 7 дней, КБЖУ, готовый список покупок и возможность добавлять свои рецепты. Бесплатно, без регистрации до результата.',
	path: '/',
	ogSlug: 'home',
});

// Клиент-сайд: если есть auth token — пользователь зарегистрирован,
// сразу редиректим на /menu (SPA). Боты-краулеры localStorage не имеют —
// они увидят полноценный SEO-лендинг.
onMounted(() => {
	try {
		// Используем тот же ключ что в src/stores/authStore.js — token
		const ls = window.localStorage;
		const token = ls.getItem('time-est-token') || ls.getItem('authToken') || ls.getItem('token');
		if (token && token.length > 10) {
			window.location.replace('/menu');
		}
	} catch {
		// LocalStorage недоступен (private режим) — ничего не делаем, остаёмся на лендинге
	}
});

// Schema.org: Organization + WebSite + FAQPage
const config = useRuntimeConfig().public;
useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@graph': [
					{
						'@type': 'Organization',
						'@id': `${config.siteUrl}/#org`,
						name: 'Время Есть',
						url: config.siteUrl,
						logo: `${config.siteUrl}/favicon.svg`,
						email: 'hi@plus-time.ru',
						description: 'Сервис планирования домашнего питания: меню на неделю, список покупок и собственная библиотека рецептов.',
						sameAs: [
							// Когда заведём — добавить: VK, Telegram, YouTube
						],
					},
					{
						'@type': 'WebSite',
						'@id': `${config.siteUrl}/#website`,
						url: config.siteUrl,
						name: 'Время Есть',
						publisher: { '@id': `${config.siteUrl}/#org` },
						inLanguage: 'ru-RU',
						potentialAction: {
							'@type': 'SearchAction',
							target: {
								'@type': 'EntryPoint',
								urlTemplate: `${config.siteUrl}/recepty?q={search_term_string}`,
							},
							'query-input': 'required name=search_term_string',
						},
					},
					{
						'@type': 'FAQPage',
						mainEntity: [
							{
								'@type': 'Question',
								name: '«Время Есть» — это бесплатно?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Базовый функционал бесплатный — меню на неделю, список покупок, КБЖУ для каждого рецепта и возможность добавлять свои рецепты. Этого хватает для повседневного планирования семейного питания.',
								},
							},
							{
								'@type': 'Question',
								name: 'Сколько времени экономит сервис?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'По данным внутренних тестов — около 2-3 часов в неделю на планирование, поиск рецептов и составление списка покупок.',
								},
							},
							{
								'@type': 'Question',
								name: 'Как сервис учитывает аллергии и диеты?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'На онбординге можно указать аллергии (молочные продукты, глютен, орехи и т.д.) и предпочтения (ПП, вегетарианство, без свинины, кето). Алгоритм исключает несовместимые рецепты при составлении меню.',
								},
							},
							{
								'@type': 'Question',
								name: 'Откуда берутся КБЖУ для рецептов?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Для базовых продуктов используем таблицы Роспотребнадзора и открытую базу USDA FoodData Central. КБЖУ для составных рецептов пересчитываются по массе ингредиентов с учётом потерь при тепловой обработке.',
								},
							},
							{
								'@type': 'Question',
								name: 'Можно ли использовать без регистрации?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Да. Меню на неделю и список покупок видны сразу после онбординга. Регистрация требуется только для сохранения меню и шеринга с семьёй.',
								},
							},
							{
								'@type': 'Question',
								name: 'Можно ли добавлять свои рецепты?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Да. В личном кабинете есть раздел для собственных рецептов: указываешь ингредиенты с количеством и шаги — рецепт попадает в общую библиотеку и автоматически участвует в подборе меню недели наравне с системными.',
								},
							},
						],
					},
				],
			}),
		},
	],
});

function trackCta(where: string) {
	if (typeof window !== 'undefined' && (window as any).ym) {
		const counter = useRuntimeConfig().public.ymCounter;
		if (counter) (window as any).ym(counter, 'reachGoal', 'home_cta', { where });
	}
}
</script>

<style scoped>
.landing {
	max-width: none;
	margin: 0;
	padding: 0;
}

/* ─── Hero ──────────────────────────────────────────── */
.hero {
	display: grid;
	gap: var(--xxl);
	padding: var(--xxxl) 0;
}
@media (min-width: 768px) {
	.hero {
		grid-template-columns: 1.2fr 1fr;
		align-items: center;
	}
}
.hero__tag {
	color: var(--gd);
	font-weight: 700;
	font-size: 0.85rem;
	margin: 0 0 var(--md);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}
.hero h1 {
	font-family: var(--ff-display);
	font-size: clamp(1.7rem, 5vw, 2.4rem);
	font-weight: 800;
	line-height: 1.15;
	margin: 0 0 var(--lg);
	color: var(--t1);
}
.hero__sub {
	font-size: 1.05rem;
	line-height: 1.6;
	color: var(--t2);
	margin: 0 0 var(--xl);
}
.hero__cta { display: flex; flex-direction: column; align-items: flex-start; gap: var(--sm); }
.hero__cta small { color: var(--t3); font-size: 0.85rem; }

/* Hero demo — 4 цветовые плашки приёмов пищи */
.hero__demo {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--md);
}
.demo-card {
	padding: var(--md);
	border-radius: var(--r-card);
	font-size: 0.85rem;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.demo-card strong { font-size: 0.95rem; line-height: 1.3; }
.demo-card__meta { color: rgba(0,0,0,0.5); font-size: 0.75rem; }
.demo-card--breakfast { background: var(--breakfast-bg); color: var(--breakfast-fg); }
.demo-card--lunch     { background: var(--lunch-bg);     color: var(--lunch-fg); }
.demo-card--dinner    { background: var(--dinner-bg);    color: var(--dinner-fg); }
.demo-card--snack     { background: var(--snack-bg);     color: var(--snack-fg); }

/* ─── Stats ─────────────────────────────────────────── */
.stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: var(--md);
	padding: var(--xl);
	background: var(--gp);
	border-radius: var(--r-card);
	margin: var(--xxl) 0;
}
.stat-card { text-align: center; }
.stat-card strong {
	display: block;
	font-family: var(--ff-display);
	font-size: clamp(1.5rem, 3.5vw, 2rem);
	font-weight: 800;
	color: var(--gd);
	margin-bottom: 4px;
}
.stat-card span { font-size: 0.85rem; color: var(--t2); line-height: 1.4; }

/* ─── Pillars ───────────────────────────────────────── */
.pillars { padding: var(--xxxl) 0; }
.pillars h2 {
	font-family: var(--ff-display);
	font-size: clamp(1.3rem, 3vw, 1.7rem);
	margin: 0 0 var(--xl);
}
.pillars__grid {
	display: grid;
	gap: var(--lg);
}
@media (min-width: 640px) {
	.pillars__grid { grid-template-columns: 1fr 1fr; }
}
.pillar {
	display: block;
	padding: var(--xl);
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	text-decoration: none;
	color: var(--t1);
	transition: transform 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-out);
}
.pillar:hover {
	transform: translateY(-3px);
	box-shadow: var(--sh2);
	color: var(--t1);
}
.pillar__emoji { font-size: 40px; line-height: 1; margin-bottom: var(--md); }
.pillar h3 {
	font-family: var(--ff-display);
	font-size: 1.2rem;
	margin: 0 0 var(--sm);
}
.pillar p { margin: 0 0 var(--md); color: var(--t2); font-size: 0.95rem; line-height: 1.5; }
.pillar__link { color: var(--gd); font-weight: 700; font-size: 0.9rem; }

/* ─── How ───────────────────────────────────────────── */
.how { padding: var(--xxxl) 0; }
.how h2 {
	font-family: var(--ff-display);
	font-size: clamp(1.3rem, 3vw, 1.7rem);
	margin: 0 0 var(--xl);
}
.how__steps {
	list-style: none;
	padding: 0;
	margin: 0;
	display: grid;
	gap: var(--lg);
	counter-reset: step;
}
.how__steps li {
	padding: var(--xl);
	padding-left: 72px;
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	position: relative;
	counter-increment: step;
}
.how__steps li::before {
	content: counter(step);
	position: absolute;
	left: var(--xl);
	top: var(--xl);
	width: 36px;
	height: 36px;
	background: var(--brand-gradient);
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: var(--ff-display);
	font-weight: 800;
	font-size: 1.1rem;
}
.how__steps li strong {
	display: block;
	font-family: var(--ff-display);
	font-size: 1.1rem;
	margin-bottom: var(--sm);
}
.how__steps li p { margin: 0; color: var(--t2); line-height: 1.55; }

/* ─── CTA-блоки ────────────────────────────────────── */
.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
	margin: var(--xxl) 0;
}
.cta-block p { margin: 0 0 var(--md); }
.cta-block--big { padding: var(--xxl); }
.cta-block--big p:first-of-type strong {
	font-family: var(--ff-display);
	font-size: 1.4rem;
}
.cta-block--final {
	background: var(--brand-gradient);
	color: #fff;
}
.cta-block--final p { color: #fff; }
.cta-block--final .btn-cta { background: #fff; color: var(--gd); }

/* ─── FAQ ───────────────────────────────────────────── */
.faq { padding: var(--xxxl) 0; }
.faq h2 {
	font-family: var(--ff-display);
	font-size: clamp(1.3rem, 3vw, 1.7rem);
	margin: 0 0 var(--xl);
}
.faq details {
	border-top: 1px solid var(--bdr);
	padding: var(--lg) 0;
}
.faq details:last-of-type {
	border-bottom: 1px solid var(--bdr);
}
.faq summary {
	cursor: pointer;
	font-weight: 600;
	font-size: 1rem;
	color: var(--t1);
	min-height: var(--touch);
	padding: 8px 0;
	display: flex;
	align-items: center;
}
.faq summary:hover { color: var(--gd); }
.faq details[open] summary { color: var(--gd); }
.faq details p {
	margin: var(--sm) 0 0;
	color: var(--t2);
	line-height: 1.6;
}
</style>
