<template>
	<article v-if="data">
		<Breadcrumbs
			:items="[
				{ label: 'Главная', to: '/' },
				{ label: 'Справочник', to: '/spravochnik' },
				{ label: 'Замены' },
				{ label: data.name },
			]"
		/>

		<h1>{{ data.name }}: чем заменить в готовке</h1>

		<!-- AI-блок: короткий ответ сверху. Это попадает в Featured Snippet / AI Overview. -->
		<aside class="quick-answer" aria-label="Краткий ответ">
			<p>{{ data.short_answer }}</p>
			<small>Обновлено: {{ formatDate(data.updated) }}</small>
		</aside>

		<!-- Замены по контексту использования -->
		<section aria-labelledby="cases-h">
			<h2 id="cases-h">Замены по контексту использования</h2>

			<div v-for="(c, i) in data.cases" :key="i" class="case">
				<h3>{{ c.use_in }}</h3>
				<p class="case__replace"><strong>Заменить:</strong> {{ c.replace }}</p>
				<p v-if="c.note" class="case__note">{{ c.note }}</p>
			</div>
		</section>

		<!-- FAQ — отдельные узлы, не дублирующие тело -->
		<section v-if="data.faq?.length" class="faq" aria-labelledby="faq-h">
			<h2 id="faq-h">Частые вопросы</h2>
			<details v-for="(q, i) in data.faq" :key="i">
				<summary>{{ q.q }}</summary>
				<p>{{ q.a }}</p>
			</details>
		</section>

		<!-- Перелинковка: только реально существующие страницы -->
		<section class="cross-links">
			<h2>Полезные ссылки</h2>
			<ul>
				<li v-if="ingMeta?.slug">
					Справочник по продукту —
					<NuxtLink :to="`/iz/${ingMeta.slug}`">{{ data.name }}</NuxtLink>
				</li>
				<li v-if="ingMeta?.hasSrokKhraneniya">
					Сроки хранения —
					<NuxtLink :to="`/spravochnik/srok-khraneniya/${ingMeta.slug}`">справочник хранения</NuxtLink>
				</li>
				<li v-if="ingMeta?.hasOstatki">
					Сценарии из остатков —
					<NuxtLink :to="`/iz-ostatkov/${ingMeta.slug}`">смотреть</NuxtLink>
				</li>
				<li>
					Подобрать блюдо из того, что есть дома —
					<NuxtLink to="/chto-prigotovit/iz-togo-chto-est">селектор продуктов</NuxtLink>
				</li>
			</ul>
		</section>

		<!-- CTA-мост -->
		<div class="cta-block">
			<p>Не хочешь подбирать замены вручную каждый день?</p>
			<a href="/" class="btn-cta" @click="trackCta">Составить меню на неделю</a>
			<small>Учитываем аллергии и продукты, которых нет под рукой</small>
		</div>
	</article>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

const { data } = await useAsyncData(`zameny-${slug}`, () =>
	$fetch('/api/_content/zameny', { query: { slug } }),
);

if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Замена не найдена' });

// Метаданные ингредиента (есть ли соседние страницы) — для аккуратной перелинковки
const { data: ingMeta } = await useAsyncData(`zameny-${slug}-ing`, async () => {
	const li = (data.value as any)?.linked_ingredient;
	if (!li) return null;
	try {
		return await $fetch('/api/_content/iz', { query: { slug: li } });
	} catch {
		return null;
	}
});

// SEO — title в нейтральной конструкции
useSeoHead({
	title: `${data.value.name}: чем заменить в готовке — справочник`,
	description: data.value.short_answer.slice(0, 158),
	path: `/spravochnik/zameny/${slug}`,
	ogSlug: `spravochnik/zameny/${slug}`,
});

// FAQPage schema — обязательно для AI-цитируемости
useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'FAQPage',
				mainEntity: (data.value.faq || []).map((q: any) => ({
					'@type': 'Question',
					name: q.q,
					acceptedAnswer: { '@type': 'Answer', text: q.a },
				})),
			}),
		},
	],
});

function formatDate(d: string | undefined): string {
	if (!d) return '';
	const date = new Date(d);
	return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function trackCta() {
	if (typeof window !== 'undefined' && (window as any).ym) {
		const counter = useRuntimeConfig().public.ymCounter;
		if (counter) (window as any).ym(counter, 'reachGoal', 'spravochnik_cta');
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
	color: var(--t1);
}

.quick-answer small {
	color: var(--t3);
	font-size: 0.8rem;
}

.case {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--lg);
	margin-bottom: var(--md);
}

.case h3 {
	margin: 0 0 var(--sm);
	color: var(--gd);
	font-size: 1rem;
}

.case__replace {
	margin: 0 0 6px;
}

.case__note {
	margin: 0;
	font-size: 0.9rem;
	color: var(--t3);
	font-style: italic;
}

.faq details {
	border-top: 1px solid var(--bdr);
	padding: var(--md) 0;
}

.faq summary {
	cursor: pointer;
	font-weight: 600;
	color: var(--t1);
	font-size: 1rem;
	padding: 8px 0;
	min-height: var(--touch);
}

.faq details[open] summary {
	color: var(--gd);
}

.faq details p {
	margin: var(--sm) 0 0;
	color: var(--t2);
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

.cross-links li {
	margin-bottom: var(--sm);
}

.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
	margin-top: var(--xxl);
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
