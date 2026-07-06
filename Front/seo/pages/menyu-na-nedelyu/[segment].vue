<template>
	<article v-if="data">
		<Breadcrumbs
			:items="[
				{ label: 'Главная', to: '/' },
				{ label: 'Меню на неделю', to: '/menyu-na-nedelyu' },
				{ label: data.title.replace('Меню на неделю ', '').replace('Меню на неделю — ', '') },
			]"
		/>

		<header class="menu-head">
			<div class="menu-head__emoji" aria-hidden="true">{{ data.emoji }}</div>
			<div>
				<h1>{{ data.title }}</h1>
				<p class="menu-head__audience"><strong>Для кого:</strong> {{ data.audience }}</p>
			</div>
		</header>

		<!-- Краткий ответ для AI Overview / Featured Snippet -->
		<aside class="quick-answer">
			<p>{{ data.short_answer }}</p>
			<small>Обновлено: {{ formatDate(data.updated) }}</small>
		</aside>

		<!-- USP-блок «как мы подобрали» — для contentEffort + методологическая прозрачность -->
		<section class="how-picked">
			<h2>Как мы подобрали это меню</h2>
			<p>{{ data.how_we_picked }}</p>
			<div v-if="data.totals" class="how-picked__stats">
				<div v-if="data.totals.avg_kcal || data.totals.avg_kcal_per_person || data.totals.avg_kcal_adult" class="stat">
					<strong>{{ data.totals.avg_kcal || data.totals.avg_kcal_per_person || data.totals.avg_kcal_adult }}</strong>
					<span>ккал в день</span>
				</div>
				<div v-if="data.totals.active_cook_time_total_min" class="stat">
					<strong>{{ data.totals.active_cook_time_total_min }}</strong>
					<span>минут готовки за неделю</span>
				</div>
				<div v-if="data.weekly_budget_hint" class="stat stat--wide">
					<strong>Бюджет:</strong>
					<span>{{ data.weekly_budget_hint }}</span>
				</div>
			</div>
		</section>

		<!-- Главный CTA после первой ценности -->
		<div class="cta-block">
			<p><strong>Хочешь это меню в приложении с готовым списком покупок?</strong></p>
			<a href="/" class="btn-cta" @click="trackCta('after_intro')">Составить меню за 60 сек</a>
			<small>Без регистрации до первого результата</small>
		</div>

		<!-- 7 дней — основная ценность -->
		<section class="days" aria-labelledby="days-h">
			<h2 id="days-h">Меню на 7 дней</h2>

			<div v-for="d in data.days" :key="d.day" class="day">
				<header class="day__head">
					<div class="day__head-main">
						<h3>{{ d.name }}</h3>
						<span class="day__time">⏱ {{ d.cook_time_active_min }} мин активной готовки</span>
						<span v-if="d.workout === true" class="day__tag day__tag--workout">тренировка</span>
						<span v-if="d.cost_estimate_rub" class="day__tag day__tag--cost">{{ d.cost_estimate_rub }} ₽</span>
					</div>
					<p v-if="d.note" class="day__note">{{ d.note }}</p>
				</header>

				<ul class="day__meals">
					<li
						v-for="(meal, key) in d.meals"
						:key="key"
						class="meal"
						:class="`meal--${mealClass(key)}`"
					>
						<div class="meal__type-tag">{{ mealLabel(key) }}</div>
						<div class="meal__body">
							<h4>{{ meal.title }}</h4>
							<p class="meal__meta">
								<span v-if="meal.kcal || meal.kcal_per_person">🔥 {{ meal.kcal || meal.kcal_per_person }} ккал</span>
								<span v-if="meal.protein_g">🥩 {{ meal.protein_g }} г белка</span>
								<span v-if="meal.time_min">⏱ {{ meal.time_min }} мин</span>
								<span v-if="meal.cost_rub">💰 {{ meal.cost_rub }} ₽</span>
							</p>
							<p v-if="meal.note" class="meal__note">{{ meal.note }}</p>
						</div>
					</li>
				</ul>
			</div>
		</section>

		<!-- Что заморозить и когда достать — недостающий узел -->
		<section v-if="data.defrost_schedule?.length" class="schedule">
			<h2>Что и когда достать из морозилки</h2>
			<ul>
				<li v-for="(s, i) in data.defrost_schedule" :key="i">{{ s }}</li>
			</ul>
		</section>

		<!-- Готовим впрок -->
		<section v-if="data.prep_ahead?.length" class="prep">
			<h2>Что готовится впрок</h2>
			<ul>
				<li v-for="(s, i) in data.prep_ahead" :key="i">{{ s }}</li>
			</ul>
		</section>

		<!-- Скрытые калории / бюджетные принципы / контекстные адаптации -->
		<section v-if="data.hidden_calories?.length" class="warnings">
			<h2>Где прячутся калории</h2>
			<ul>
				<li v-for="(item, i) in data.hidden_calories" :key="i">{{ item }}</li>
			</ul>
		</section>

		<section v-if="data.budget_principles?.length" class="principles">
			<h2>Бюджетные принципы</h2>
			<div v-for="(p, i) in data.budget_principles" :key="i" class="principle">
				<h3>{{ p.title }}</h3>
				<p>{{ p.content }}</p>
			</div>
		</section>

		<section v-if="data.do_not_save_on?.length" class="warnings warnings--coral">
			<h2>На чём НЕ стоит экономить</h2>
			<ul>
				<li v-for="(item, i) in data.do_not_save_on" :key="i">{{ item }}</li>
			</ul>
		</section>

		<!-- Что заменить если -->
		<section v-if="data.adjustments?.length" class="adjustments">
			<h2>Что заменить если</h2>
			<div v-for="(a, i) in data.adjustments" :key="i" class="adjustment">
				<p class="adjustment__condition">{{ a.condition }}</p>
				<p class="adjustment__swap">{{ a.swap }}</p>
			</div>
		</section>

		<!-- FAQ -->
		<section v-if="data.faq?.length" class="faq">
			<h2>Частые вопросы</h2>
			<details v-for="(q, i) in data.faq" :key="i">
				<summary>{{ q.q }}</summary>
				<p>{{ q.a }}</p>
			</details>
		</section>

		<!-- Cross-links -->
		<section class="cross-links">
			<h2>Соседние меню</h2>
			<div class="cross-links__grid">
				<NuxtLink
					v-for="other in otherMenus"
					:key="other.slug"
					:to="`/menyu-na-nedelyu/${other.slug}`"
					class="cross-card"
				>
					<span class="cross-card__emoji" aria-hidden="true">{{ other.emoji }}</span>
					<div>
						<h3>{{ other.title.replace('Меню на неделю ', '').replace('Меню на неделю — ', '') }}</h3>
						<p>{{ other.audience }}</p>
					</div>
				</NuxtLink>
			</div>
		</section>

		<!-- Финальный CTA -->
		<div class="cta-block cta-block--final">
			<p>
				Чтобы это меню «жило» в приложении с автоматическим списком покупок и
				напоминаниями «достань из морозилки» — открой бесплатно за 60 секунд.
			</p>
			<a href="/" class="btn-cta" @click="trackCta('final')">Открыть в приложении</a>
		</div>
	</article>
</template>

<script setup lang="ts">
const route = useRoute();
const segment = route.params.segment as string;

const { data } = await useAsyncData(`menyu-${segment}`, () =>
	$fetch('/api/_content/menyu', { query: { slug: segment } }),
);

if (!data.value) {
	throw createError({ statusCode: 404, statusMessage: 'Меню не найдено' });
}

// Соседние меню для cross-link
const { data: allMenus } = await useAsyncData('all-menus', () =>
	$fetch<any[]>('/api/_content/menyu'),
);
const otherMenus = computed(() =>
	(allMenus.value || []).filter((m) => m.slug !== segment),
);

useSeoHead({
	title: data.value.title,
	description: data.value.short_answer.slice(0, 158),
	path: `/menyu-na-nedelyu/${segment}`,
	ogSlug: `menyu-na-nedelyu/${segment}`,
});

// Schema.org: Article (главная сущность) + ItemList (рецепты дней) + FAQPage
const config = useRuntimeConfig().public;
const schemas: any[] = [];

schemas.push({
	'@context': 'https://schema.org',
	'@type': 'Article',
	headline: data.value.title,
	description: data.value.short_answer,
	datePublished: data.value.updated,
	dateModified: data.value.updated,
	author: {
		'@type': 'Organization',
		name: 'Время Есть',
		url: config.siteUrl,
	},
	publisher: {
		'@type': 'Organization',
		name: 'Время Есть',
		url: config.siteUrl,
		logo: {
			'@type': 'ImageObject',
			url: `${config.siteUrl}/og/default.png`,
		},
	},
});

// ItemList — все рецепты меню как упорядоченный список
const itemList: any[] = [];
let pos = 1;
for (const d of data.value.days || []) {
	for (const [_key, meal] of Object.entries(d.meals || {})) {
		itemList.push({
			'@type': 'ListItem',
			position: pos++,
			name: (meal as any).title,
			description: `${d.name}: ${(meal as any).kcal || (meal as any).kcal_per_person || ''} ккал`,
		});
	}
}
schemas.push({
	'@context': 'https://schema.org',
	'@type': 'ItemList',
	itemListElement: itemList,
});

if (data.value.faq?.length) {
	schemas.push({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: data.value.faq.map((q: any) => ({
			'@type': 'Question',
			name: q.q,
			acceptedAnswer: { '@type': 'Answer', text: q.a },
		})),
	});
}

useHead({
	script: schemas.map((s) => ({ type: 'application/ld+json', children: JSON.stringify(s) })),
});

// ─── Helpers ───
function formatDate(d: string | undefined): string {
	if (!d) return '';
	return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MEAL_LABELS: Record<string, string> = {
	breakfast: 'Завтрак',
	snack1: 'Перекус 1',
	lunch: 'Обед',
	snack2: 'Перекус 2',
	snack: 'Перекус',
	dinner: 'Ужин',
};
function mealLabel(key: string | number): string {
	return MEAL_LABELS[String(key)] || String(key);
}

function mealClass(key: string | number): string {
	const k = String(key);
	if (k === 'breakfast') return 'breakfast';
	if (k === 'lunch') return 'lunch';
	if (k === 'dinner') return 'dinner';
	return 'snack';
}

function trackCta(where: string) {
	if (typeof window !== 'undefined' && (window as any).ym) {
		const counter = useRuntimeConfig().public.ymCounter;
		if (counter) (window as any).ym(counter, 'reachGoal', 'menu_cta', { where, segment });
	}
}
</script>

<style scoped>
.menu-head {
	display: flex;
	align-items: flex-start;
	gap: var(--lg);
	margin-bottom: var(--lg);
}
.menu-head__emoji {
	font-size: 56px;
	line-height: 1;
	flex-shrink: 0;
}
.menu-head__audience {
	color: var(--t2);
	margin-top: var(--sm);
}

.quick-answer {
	background: var(--gp);
	border-left: 4px solid var(--g);
	border-radius: var(--r-card);
	padding: var(--lg) var(--xl);
	margin-bottom: var(--xl);
}
.quick-answer p { margin: 0 0 var(--sm); font-size: 1.05rem; }
.quick-answer small { color: var(--t3); font-size: 0.8rem; }

.how-picked {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--xl);
	margin-bottom: var(--xl);
}
.how-picked__stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: var(--md);
	margin-top: var(--lg);
}
.stat {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--md);
	text-align: center;
}
.stat strong { display: block; font-size: 1.8rem; font-family: var(--ff-display); color: var(--gd); }
.stat span { font-size: 0.85rem; color: var(--t3); }
.stat--wide { text-align: left; grid-column: span 2; }
.stat--wide strong { display: inline; font-size: 1rem; margin-right: var(--sm); }
.stat--wide span { display: inline; }

.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
	margin: var(--xl) 0;
}
.cta-block--final {
	background: var(--brand-gradient);
	color: #fff;
}
.cta-block--final p { color: #fff; }
.cta-block p { margin: 0 0 var(--md); }
.cta-block small { display: block; margin-top: var(--sm); color: var(--t3); font-size: 0.85rem; }

.days {
	margin: var(--xxl) 0;
}
.day {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--lg);
	margin-bottom: var(--md);
}
.day__head-main {
	display: flex;
	align-items: center;
	gap: var(--sm);
	flex-wrap: wrap;
}
.day__head h3 { margin: 0; font-family: var(--ff-display); font-size: 1.2rem; }
.day__time { color: var(--t3); font-size: 0.85rem; }
.day__tag {
	background: var(--gp);
	color: var(--gd);
	font-size: 0.75rem;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: var(--r-chip);
}
.day__tag--workout { background: var(--purp); color: var(--pur); }
.day__tag--cost { background: var(--ambp); color: var(--amb); }
.day__note {
	margin: var(--sm) 0 0;
	color: var(--t3);
	font-size: 0.85rem;
	font-style: italic;
}

.day__meals {
	list-style: none;
	padding: 0;
	margin: var(--md) 0 0;
}
.meal {
	display: flex;
	gap: var(--md);
	padding: var(--sm) 0;
	border-top: 1px solid var(--bdr);
}
.meal__type-tag {
	flex-shrink: 0;
	width: 90px;
	font-size: 0.75rem;
	font-weight: 700;
	padding: 4px 8px;
	border-radius: var(--r-chip);
	height: fit-content;
	text-align: center;
}
.meal--breakfast .meal__type-tag { background: var(--breakfast-bg); color: var(--breakfast-fg); }
.meal--lunch .meal__type-tag     { background: var(--lunch-bg);     color: var(--lunch-fg); }
.meal--dinner .meal__type-tag    { background: var(--dinner-bg);    color: var(--dinner-fg); }
.meal--snack .meal__type-tag     { background: var(--snack-bg);     color: var(--snack-fg); }
.meal__body { flex: 1; min-width: 0; }
.meal__body h4 { margin: 0 0 4px; font-size: 0.95rem; }
.meal__meta {
	margin: 0;
	font-size: 0.8rem;
	color: var(--t3);
	display: flex;
	gap: var(--sm);
	flex-wrap: wrap;
}
.meal__note { margin: 4px 0 0; font-size: 0.8rem; color: var(--t3); font-style: italic; }

.schedule, .prep, .warnings, .principles, .adjustments {
	background: var(--surf);
	border-radius: var(--r-card);
	padding: var(--xl);
	margin-bottom: var(--xl);
}
.warnings { border-left: 4px solid var(--amb); background: var(--ambp); }
.warnings--coral { border-left-color: var(--coral); background: var(--coralp); }
.warnings ul, .schedule ul, .prep ul { padding-left: 24px; margin: 0; }
.warnings li, .schedule li, .prep li { margin-bottom: var(--sm); line-height: 1.55; }

.principle { margin-bottom: var(--lg); }
.principle h3 { color: var(--gd); margin: 0 0 4px; font-size: 1rem; }
.principle p { margin: 0; color: var(--t2); }

.adjustment {
	padding: var(--md) 0;
	border-top: 1px solid var(--bdr);
}
.adjustment:first-of-type { border-top: none; }
.adjustment__condition {
	font-weight: 700;
	margin: 0 0 4px;
	color: var(--t1);
}
.adjustment__swap { margin: 0; color: var(--t2); }

.faq details {
	border-top: 1px solid var(--bdr);
	padding: var(--md) 0;
}
.faq summary {
	cursor: pointer;
	font-weight: 600;
	min-height: var(--touch);
	padding: 8px 0;
}
.faq details[open] summary { color: var(--gd); }
.faq details p { margin: var(--sm) 0 0; color: var(--t2); }

.cross-links {
	margin: var(--xxl) 0;
}
.cross-links__grid {
	display: grid;
	gap: var(--md);
}
@media (min-width: 640px) {
	.cross-links__grid { grid-template-columns: 1fr 1fr; }
}
.cross-card {
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
.cross-card:hover {
	transform: translateY(-2px);
	box-shadow: var(--sh2);
	color: var(--t1);
}
.cross-card__emoji { font-size: 32px; line-height: 1; flex-shrink: 0; }
.cross-card h3 { margin: 0 0 4px; font-family: var(--ff-display); font-size: 1.05rem; }
.cross-card p { margin: 0; color: var(--t2); font-size: 0.85rem; line-height: 1.45; }
</style>
