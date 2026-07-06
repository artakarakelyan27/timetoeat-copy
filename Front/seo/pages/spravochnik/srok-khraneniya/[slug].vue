<template>
	<article v-if="data">
		<Breadcrumbs
			:items="[
				{ label: 'Главная', to: '/' },
				{ label: 'Справочник', to: '/spravochnik' },
				{ label: 'Сроки хранения' },
				{ label: data.name },
			]"
		/>

		<h1>{{ data.name }}: сроки хранения и признаки порчи</h1>

		<aside class="quick-answer">
			<p>{{ data.short_answer }}</p>
			<small>Обновлено: {{ formatDate(data.updated) }}</small>
		</aside>

		<section aria-labelledby="storage-h">
			<h2 id="storage-h">Условия хранения</h2>

			<table class="storage-table" role="table">
				<thead>
					<tr>
						<th scope="col">Где</th>
						<th scope="col">Температура</th>
						<th scope="col">Срок</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(s, i) in data.storage" :key="i">
						<td>
							{{ s.where }}
							<small v-if="s.notes" class="storage-notes">{{ s.notes }}</small>
						</td>
						<td>{{ s.temperature }}</td>
						<td><strong>{{ s.duration }}</strong></td>
					</tr>
				</tbody>
			</table>
		</section>

		<section v-if="data.spoilage_signs?.length" aria-labelledby="spoilage-h">
			<h2 id="spoilage-h">Признаки порчи</h2>
			<ul class="spoilage-list">
				<li v-for="(s, i) in data.spoilage_signs" :key="i">{{ s }}</li>
			</ul>
		</section>

		<section v-if="data.how_to_freeze?.length" aria-labelledby="freeze-h">
			<h2 id="freeze-h">Как правильно заморозить</h2>
			<ol class="freeze-list">
				<li v-for="(step, i) in data.how_to_freeze" :key="i">{{ step }}</li>
			</ol>
		</section>

		<section v-if="data.faq?.length" class="faq" aria-labelledby="faq-h">
			<h2 id="faq-h">Частые вопросы</h2>
			<details v-for="(q, i) in data.faq" :key="i">
				<summary>{{ q.q }}</summary>
				<p>{{ q.a }}</p>
			</details>
		</section>

		<section class="cross-links">
			<h2>Полезные ссылки</h2>
			<ul>
				<li v-if="ingMeta?.slug">
					Справочник по продукту —
					<NuxtLink :to="`/iz/${ingMeta.slug}`">{{ data.name }}</NuxtLink>
				</li>
				<li v-if="ingMeta?.hasZameny">
					Чем заменить —
					<NuxtLink :to="`/spravochnik/zameny/${ingMeta.slug}`">справочник замен</NuxtLink>
				</li>
				<li v-if="ingMeta?.hasOstatki">
					Сценарии из остатков —
					<NuxtLink :to="`/iz-ostatkov/${ingMeta.slug}`">смотреть</NuxtLink>
				</li>
			</ul>
		</section>

		<div class="cta-block">
			<p>Не хочешь думать, что портится — а что свежее? Меню на неделю с учётом сроков.</p>
			<a href="/" class="btn-cta" @click="trackCta">Составить меню за 60 сек</a>
		</div>
	</article>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;

const { data } = await useAsyncData(`srok-${slug}`, () =>
	$fetch('/api/_content/srok-khraneniya', { query: { slug } }),
);

if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Не найдено' });

// Метаданные ингредиента — для аккуратной перелинковки
const { data: ingMeta } = await useAsyncData(`srok-${slug}-ing`, async () => {
	const li = (data.value as any)?.linked_ingredient;
	if (!li) return null;
	try {
		return await $fetch('/api/_content/iz', { query: { slug: li } });
	} catch {
		return null;
	}
});

// SEO — title в нейтральной конструкции (без падежей)
useSeoHead({
	title: `${data.value.name}: сколько хранится — справочник`,
	description: data.value.short_answer.slice(0, 158),
	path: `/spravochnik/srok-khraneniya/${slug}`,
	ogSlug: `spravochnik/srok-khraneniya/${slug}`,
});

// Двойная schema: FAQPage + HowTo (если есть how_to_freeze)
const schemas: any[] = [];

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

if (data.value.how_to_freeze?.length) {
	schemas.push({
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: `Заморозка: ${data.value.name}`,
		step: data.value.how_to_freeze.map((s: string, i: number) => ({
			'@type': 'HowToStep',
			position: i + 1,
			text: s,
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
}

.quick-answer small {
	color: var(--t3);
	font-size: 0.8rem;
}

.storage-table {
	width: 100%;
	border-collapse: collapse;
	background: var(--surf);
	border-radius: var(--r-card);
	overflow: hidden;
	box-shadow: var(--sh1);
}

.storage-table th,
.storage-table td {
	padding: var(--md);
	text-align: left;
	border-bottom: 1px solid var(--bdr);
	vertical-align: top;
	font-variant-numeric: tabular-nums;
}

.storage-table th {
	background: var(--gp);
	font-weight: 700;
	color: var(--gd);
	font-size: 0.85rem;
}

.storage-table tr:last-child td {
	border-bottom: none;
}

.storage-notes {
	display: block;
	color: var(--t3);
	font-size: 0.8rem;
	margin-top: 4px;
	font-weight: 400;
	font-style: italic;
}

.spoilage-list {
	background: var(--coralp);
	border-radius: var(--r-card);
	padding: var(--lg) var(--xl);
	border-left: 4px solid var(--coral);
}

.spoilage-list li {
	margin-bottom: var(--sm);
	color: var(--t1);
}

.freeze-list {
	padding-left: 24px;
}

.freeze-list li {
	margin-bottom: var(--md);
	line-height: 1.55;
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
	margin-top: var(--xxl);
}

.cta-block p {
	margin: 0 0 var(--lg);
}
</style>
