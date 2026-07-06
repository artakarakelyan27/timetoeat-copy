<template>
	<article>
		<Breadcrumbs
			:items="[
				{ label: 'Главная', to: '/' },
				{ label: 'Что приготовить', to: '/chto-prigotovit' },
				{ label: 'Из того, что есть дома' },
			]"
		/>

		<h1>Что приготовить из того, что есть в холодильнике</h1>

		<p class="lead">
			Открываешь холодильник, и там — четыре несвязанных продукта. Эта страница
			решает ровно это: отметь то, что у тебя реально есть, и через секунду получишь
			5 рецептов из этого набора. Без «купите ещё 6 ингредиентов».
		</p>

		<!-- ─── Интерактивный селектор ─── -->
		<section class="selector" aria-labelledby="selector-h">
			<h2 id="selector-h">Отметь, что есть у тебя сейчас</h2>

			<p class="selector__hint">
				Минимум 2 продукта. Базу — соль, масло, лук, чеснок — считаем по умолчанию.
			</p>

			<div class="selector__grid">
				<button
					v-for="opt in options"
					:key="opt.id"
					type="button"
					class="chip"
					:class="{ 'chip--active': selected.has(opt.id) }"
					:aria-pressed="selected.has(opt.id)"
					@click="toggle(opt.id)"
				>
					<span class="chip__emoji" aria-hidden="true">{{ opt.emoji }}</span>
					<span class="chip__label">{{ opt.label }}</span>
				</button>
			</div>

			<div class="selector__actions">
				<button
					type="button"
					class="btn-cta"
					:disabled="selected.size < 2 || pending"
					@click="search"
				>
					<span v-if="pending">Подбираем…</span>
					<span v-else-if="results.length">Подобрать заново</span>
					<span v-else>Показать рецепты ({{ selected.size }})</span>
				</button>
				<button
					v-if="selected.size > 0"
					type="button"
					class="btn-reset"
					@click="reset"
				>
					Сбросить
				</button>
			</div>
		</section>

		<!-- ─── Результат ─── -->
		<section v-if="results.length" class="results" aria-labelledby="results-h">
			<h2 id="results-h">Можешь приготовить уже сейчас</h2>
			<div class="results__grid">
				<RecipeCardEmoji
					v-for="recipe in results"
					:key="recipe.slug"
					:recipe="recipe"
				/>
			</div>

			<!-- Главный CTA — мост в продукт -->
			<div class="results__cta">
				<p class="results__cta-text">
					Хочешь, соберём <strong>меню на неделю вокруг этих продуктов</strong> и
					составим список покупок одной кнопкой?
				</p>
				<a href="/" class="btn-cta" @click="trackResultsCta">
					Составить меню за 60 сек
				</a>
				<small class="results__cta-hint">Без регистрации до первого результата</small>
			</div>
		</section>

		<!-- ─── Реалистичные тайминги — недостающий GIST-узел ─── -->
		<section class="reality">
			<h2>Реалистично, что приготовится из 2–3 продуктов</h2>
			<p>
				Если ты не успеваешь — сразу сократи ожидания. Из коротких списков
				ингредиентов хорошо получается ограниченный набор блюд. Вот честный ориентир:
			</p>
			<ul class="reality__list">
				<li>
					<strong>За 5–10 мин</strong> — омлет, бутерброды, простой салат, тосты,
					фруктовая нарезка. Если ждёшь сложнее — это не вина рецепта, а наших обещаний
					о времени.
				</li>
				<li>
					<strong>За 15–20 мин</strong> — паста с базовым соусом, скрэмбл, кесадильи,
					простые супы из готового бульона, овощи на сковороде.
				</li>
				<li>
					<strong>За 30 мин</strong> — куриная грудка + гарнир, рис с овощами, рыба в
					духовке, плов «на скорую руку».
				</li>
				<li>
					<strong>Сложное (плов, ризотто, тушёнка с маринадом)</strong> — не пытайся
					уложить в 20 минут. Лучше отложи на день, когда есть час.
				</li>
			</ul>
		</section>

		<!-- ─── База — что у тебя точно есть, но забыто ─── -->
		<section class="basics">
			<h2>Что у тебя точно есть, а ты не считаешь</h2>
			<p>
				На пустую кухню добавь мысленно: <strong>яйца, лук, чеснок, растительное и сливочное
				масло, соль, перец, рис или паста, мука</strong>. Это «нулевой уровень» — почти
				любой рецепт его не считает за ингредиенты. Если у тебя есть только курица — ты
				уже в одном шаге от десятка готовых блюд.
			</p>
		</section>

		<!-- ─── FAQ ─── -->
		<section class="faq" aria-labelledby="faq-h">
			<h2 id="faq-h">Частые вопросы</h2>

			<details>
				<summary>А если у меня вообще ничего нет, кроме круп?</summary>
				<p>
					Тогда пиши «крупа» в селектор — рис, гречка, овсянка дают каши, гарниры,
					ризотто и запеканки. Из одной крупы + яйцо/молоко + лук получается полноценный
					ужин за 25 минут.
				</p>
			</details>

			<details>
				<summary>Можно ли по этой странице планировать целую неделю?</summary>
				<p>
					Эта страница даёт 5 быстрых вариантов «прямо сейчас». Для недели — нажми
					«Составить меню за 60 сек»: алгоритм соберёт 7 дней, КБЖУ и список покупок.
				</p>
			</details>

			<details>
				<summary>Что если на странице нет моего продукта?</summary>
				<p>
					Сейчас в селекторе — топ-20 продуктов, которые встречаются на 80% русских кухонь.
					Если у тебя что-то редкое — лучше открой полный <NuxtLink to="/iz">справочник по
					ингредиентам</NuxtLink> и найди свой продукт там.
				</p>
			</details>
		</section>
	</article>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';

// ─── Топ-20 ингредиентов: дефолтная палитра до подгрузки с бэка ───
// Список синхронизирован с canonical_foods (топ по числу рецептов).
// При первом mount стучимся в бэк за актуальным списком; если ответа нет —
// используем этот fallback.
const FALLBACK = [
	{ id: 1001, label: 'Яйца',        emoji: '🥚' },
	{ id: 1002, label: 'Молоко',      emoji: '🥛' },
	{ id: 1003, label: 'Сыр',         emoji: '🧀' },
	{ id: 1007, label: 'Творог',      emoji: '🥛' },
	{ id: 1006, label: 'Сметана',     emoji: '🥣' },
	{ id: 2001, label: 'Курица',      emoji: '🍗' },
	{ id: 2002, label: 'Говядина',    emoji: '🥩' },
	{ id: 2003, label: 'Фарш',        emoji: '🍖' },
	{ id: 2010, label: 'Рыба',        emoji: '🐟' },
	{ id: 3001, label: 'Картофель',   emoji: '🥔' },
	{ id: 3002, label: 'Морковь',     emoji: '🥕' },
	{ id: 3003, label: 'Лук',         emoji: '🧅' },
	{ id: 3004, label: 'Помидор',     emoji: '🍅' },
	{ id: 3005, label: 'Огурец',      emoji: '🥒' },
	{ id: 3006, label: 'Капуста',     emoji: '🥬' },
	{ id: 4001, label: 'Рис',         emoji: '🍚' },
	{ id: 4002, label: 'Гречка',      emoji: '🌾' },
	{ id: 4003, label: 'Паста',       emoji: '🍝' },
	{ id: 4004, label: 'Мука',        emoji: '🥖' },
	{ id: 5001, label: 'Яблоко',      emoji: '🍎' },
];

const options = ref(FALLBACK);
const selected = reactive(new Set<number>());
const results = ref<any[]>([]);
const pending = ref(false);

function toggle(id: number) {
	if (selected.has(id)) selected.delete(id);
	else selected.add(id);
}

function reset() {
	selected.clear();
	results.value = [];
}

async function search() {
	if (selected.size < 2) return;
	pending.value = true;
	try {
		const ids = Array.from(selected);
		const res = await useApi<{ recipes: any[] }>('/seo/chto-est-doma', {
			method: 'POST',
			body: { selected_food_ids: ids },
		});
		results.value = res.recipes;

		// Tracking
		if (typeof window !== 'undefined' && (window as any).ym) {
			const counter = useRuntimeConfig().public.ymCounter;
			if (counter) (window as any).ym(counter, 'reachGoal', 'iz_doma_search', { count: ids.length });
		}
	} catch (err) {
		console.error('Не удалось подобрать рецепты:', err);
		results.value = [];
	} finally {
		pending.value = false;
	}
}

function trackResultsCta() {
	if (typeof window !== 'undefined' && (window as any).ym) {
		const counter = useRuntimeConfig().public.ymCounter;
		if (counter) (window as any).ym(counter, 'reachGoal', 'iz_doma_cta_menu');
	}
}

// ─── SEO ───
useSeoHead({
	title: 'Что приготовить из того, что есть в холодильнике',
	description:
		'Отметь продукты, которые есть дома, и получи 5 рецептов без похода в магазин. Реалистичные тайминги, без сложных ингредиентов.',
	path: '/chto-prigotovit/iz-togo-chto-est',
	ogSlug: 'chto-prigotovit/iz-togo-chto-est',
});

// FAQPage schema — для AI visibility / Featured Snippets
const { siteUrl } = useRuntimeConfig().public;
useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'FAQPage',
				mainEntity: [
					{
						'@type': 'Question',
						name: 'А если у меня вообще ничего нет, кроме круп?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: 'Рис, гречка, овсянка дают каши, гарниры, ризотто и запеканки. Из одной крупы плюс яйцо или молоко плюс лук получается полноценный ужин за 25 минут.',
						},
					},
					{
						'@type': 'Question',
						name: 'Можно ли планировать целую неделю по этой странице?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: 'Страница даёт 5 быстрых вариантов «прямо сейчас». Для недели нужно нажать «Составить меню за 60 сек» — алгоритм соберёт 7 дней, КБЖУ и список покупок.',
						},
					},
					{
						'@type': 'Question',
						name: 'Что если на странице нет моего продукта?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: 'В селекторе топ-20 продуктов, которые встречаются на 80% русских кухонь. Для редких — открой полный справочник по ингредиентам.',
						},
					},
				],
			}),
		},
	],
});
</script>

<style scoped>
.lead {
	font-size: 1.05rem;
	color: var(--t2);
	margin-bottom: var(--xl);
	line-height: 1.55;
}

.selector {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--xl);
	margin-bottom: var(--xxl);
}

.selector__hint {
	color: var(--t3);
	font-size: 0.9rem;
	margin: 0 0 var(--lg);
}

.selector__grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
	gap: var(--sm);
	margin-bottom: var(--xl);
}

.chip {
	background: var(--surf2);
	border: 1.5px solid transparent;
	border-radius: var(--r-card);
	padding: 12px 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	cursor: pointer;
	font-family: var(--ff-text);
	color: var(--t2);
	min-height: var(--touch);
	transition: transform 0.15s var(--ease-spring),
	            background 0.15s var(--ease-out),
	            border-color 0.15s var(--ease-out);
}

.chip:hover {
	background: var(--gp);
}

.chip:active {
	transform: scale(0.97);
}

.chip--active {
	background: var(--gp);
	border-color: var(--g);
	color: var(--gd);
}

.chip__emoji {
	font-size: 28px;
	line-height: 1;
}

.chip__label {
	font-size: 0.78rem;
	font-weight: 600;
}

.selector__actions {
	display: flex;
	gap: var(--md);
	align-items: center;
	flex-wrap: wrap;
}

.btn-cta:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	pointer-events: none;
}

.btn-reset {
	background: transparent;
	border: none;
	color: var(--t3);
	font-weight: 600;
	cursor: pointer;
	font-family: var(--ff-text);
	font-size: 0.9rem;
	min-height: var(--touch);
	padding: 0 12px;
}

.btn-reset:hover {
	color: var(--coral);
}

.results__grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: var(--lg);
	margin-bottom: var(--xxl);
}

.results__cta {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
	margin-bottom: var(--xxl);
}

.results__cta-text {
	margin: 0 0 var(--lg);
	font-size: 1rem;
	color: var(--t1);
}

.results__cta-hint {
	display: block;
	margin-top: var(--sm);
	color: var(--t3);
	font-size: 0.8rem;
}

.reality__list {
	padding-left: 24px;
}

.reality__list li {
	margin-bottom: var(--md);
	line-height: 1.55;
}

.basics {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--xl);
	margin-bottom: var(--xxl);
}

.faq details {
	border-top: 1px solid var(--bdr);
	padding: var(--md) 0;
}

.faq details:first-of-type {
	border-top: 1px solid var(--bdr);
}

.faq summary {
	cursor: pointer;
	font-weight: 600;
	color: var(--t1);
	font-size: 1rem;
	padding: 8px 0;
	min-height: var(--touch);
}

.faq summary:hover {
	color: var(--gd);
}

.faq details[open] summary {
	color: var(--gd);
}

.faq details p {
	margin: var(--sm) 0 0;
	color: var(--t2);
	line-height: 1.55;
}
</style>
