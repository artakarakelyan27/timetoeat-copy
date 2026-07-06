<template>
	<article v-if="data">
		<Breadcrumbs
			:items="[
				{ label: 'Главная', to: '/' },
				{ label: 'Из остатков', to: '/iz-ostatkov' },
				{ label: data.source_name },
			]"
		/>

		<h1>{{ titleText }}</h1>

		<aside class="quick-answer">
			<p>{{ data.short_answer }}</p>
			<small>Обновлено: {{ formatDate(data.updated) }}</small>
		</aside>

		<section aria-labelledby="scenarios-h">
			<h2 id="scenarios-h">Что реально приготовить</h2>

			<div v-for="(s, i) in data.scenarios" :key="i" class="scenario">
				<div class="scenario__head">
					<h3>{{ s.title }}</h3>
					<span class="scenario__time">{{ s.time }}</span>
				</div>
				<p class="scenario__need"><strong>Понадобится:</strong> {{ s.need }}</p>
				<ol class="scenario__steps">
					<li v-for="(step, j) in s.steps" :key="j">{{ step }}</li>
				</ol>
			</div>
		</section>

		<section v-if="data.donts?.length" class="donts" aria-labelledby="donts-h">
			<h2 id="donts-h">Чего точно не делать</h2>
			<ul>
				<li v-for="(d, i) in data.donts" :key="i">{{ d }}</li>
			</ul>
		</section>

		<section v-if="data.faq?.length" class="faq" aria-labelledby="faq-h">
			<h2 id="faq-h">Частые вопросы</h2>
			<details v-for="(q, i) in data.faq" :key="i">
				<summary>{{ q.q }}</summary>
				<p v-html="renderInlineLinks(q.a)"></p>
			</details>
		</section>

		<section class="cross-links">
			<h2>Полезные ссылки</h2>
			<ul>
				<li>
					Подобрать рецепт из других продуктов —
					<NuxtLink to="/chto-prigotovit/iz-togo-chto-est">селектор «из того, что есть дома»</NuxtLink>
				</li>
				<li v-if="ingMeta?.slug">
					Всё про этот продукт —
					<NuxtLink :to="`/iz/${ingMeta.slug}`">/iz/{{ ingMeta.slug }}</NuxtLink>
				</li>
				<li v-if="ingMeta?.hasSrokKhraneniya">
					Сколько хранится —
					<NuxtLink :to="`/spravochnik/srok-khraneniya/${ingMeta.slug}`">справочник хранения</NuxtLink>
				</li>
				<li v-if="ingMeta?.hasZameny">
					Чем заменить —
					<NuxtLink :to="`/spravochnik/zameny/${ingMeta.slug}`">справочник замен</NuxtLink>
				</li>
			</ul>
		</section>

		<div class="cta-block">
			<p>Чтобы остатков было меньше — собери меню под свой холодильник.</p>
			<a href="/" class="btn-cta" @click="trackCta">Составить меню за 60 сек</a>
			<small>Алгоритм переиспользует ингредиенты между днями — меньше отходов</small>
		</div>
	</article>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

const { data } = await useAsyncData(`ostatki-${slug}`, () =>
	$fetch('/api/_content/iz-ostatkov', { query: { slug } }),
);

if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Не найдено' });

// Метаданные ингредиента для cross-links
const { data: ingMeta } = await useAsyncData(`ostatki-${slug}-ing`, async () => {
	const li = (data.value as any)?.linked_ingredient;
	if (!li) return null;
	try {
		return await $fetch('/api/_content/iz', { query: { slug: li } });
	} catch {
		return null;
	}
});

// Заголовок: используем поле name из yaml (там у нас уже родительный падеж: «остатков курицы»)
// и нейтральные конструкции, чтобы не ломались склонения.
const titleText = computed(() => `Что приготовить из ${data.value.name}`);

useSeoHead({
	title: `Что приготовить из ${data.value.name} — рецепты за 5–20 минут`,
	description: data.value.short_answer.slice(0, 158),
	path: `/iz-ostatkov/${slug}`,
	ogSlug: `iz-ostatkov/${slug}`,
});

// Schema HowTo для каждого сценария + общий FAQPage
const schemas: any[] = [];

for (const scen of data.value.scenarios || []) {
	schemas.push({
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: scen.title,
		totalTime: parseTimeToISO(scen.time),
		step: scen.steps.map((s: string, i: number) => ({
			'@type': 'HowToStep',
			position: i + 1,
			text: s,
		})),
	});
}

if (data.value.faq?.length) {
	schemas.push({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: data.value.faq.map((q: any) => ({
			'@type': 'Question',
			name: q.q,
			acceptedAnswer: { '@type': 'Answer', text: stripMarkdown(q.a) },
		})),
	});
}

useHead({
	script: schemas.map((s) => ({ type: 'application/ld+json', children: JSON.stringify(s) })),
});

function formatDate(d: string | undefined): string {
	if (!d) return '';
	return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseTimeToISO(t: string): string {
	// "12 мин" → "PT12M"
	const m = t.match(/(\d+)\s*мин/);
	return m ? `PT${m[1]}M` : '';
}

function renderInlineLinks(text: string): string {
	// Простой markdown-like парсер для [текст](ссылка) в FAQ-ответах
	return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function stripMarkdown(text: string): string {
	return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function trackCta() {
	if (typeof window !== 'undefined' && (window as any).ym) {
		const counter = useRuntimeConfig().public.ymCounter;
		if (counter) (window as any).ym(counter, 'reachGoal', 'ostatki_cta');
	}
}
</script>

<style scoped>
.quick-answer {
	background: var(--gp);
	border-left: 4px solid var(--g);
	border-radius: var(--r-card);
	padding: var(--lg) var(--xl);
	margin-bottom: var(--xl);
}

.quick-answer p {
	font-size: 1.05rem;
	font-weight: 500;
	margin: 0 0 var(--sm);
}

.scenario {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--lg) var(--xl);
	margin-bottom: var(--md);
}

.scenario__head {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: var(--md);
	margin-bottom: var(--sm);
	flex-wrap: wrap;
}

.scenario__head h3 {
	margin: 0;
	font-family: var(--ff-display);
	font-size: 1.15rem;
	font-weight: 800;
}

.scenario__time {
	background: var(--gp);
	color: var(--gd);
	padding: 4px 12px;
	border-radius: var(--r-pill);
	font-size: 0.8rem;
	font-weight: 700;
}

.scenario__need {
	margin: 0 0 var(--md);
	color: var(--t2);
	font-size: 0.95rem;
}

.scenario__steps {
	padding-left: 24px;
}

.scenario__steps li {
	margin-bottom: 6px;
	line-height: 1.55;
}

.donts {
	background: var(--coralp);
	border-radius: var(--r-card);
	padding: var(--lg) var(--xl);
	border-left: 4px solid var(--coral);
	margin: var(--xxl) 0;
}

.donts ul {
	padding-left: 20px;
	margin: var(--sm) 0 0;
}

.donts li {
	margin-bottom: var(--sm);
}

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

.faq details[open] summary {
	color: var(--gd);
}

.cross-links {
	background: var(--surf2);
	border-radius: var(--r-card);
	padding: var(--lg);
	margin: var(--xxl) 0;
}

.cross-links ul {
	padding-left: 20px;
	margin: var(--sm) 0 0;
}

.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
}

.cta-block p {
	margin: 0 0 var(--lg);
}

.cta-block small {
	display: block;
	margin-top: var(--sm);
	color: var(--t3);
	font-size: 0.85rem;
}
</style>
