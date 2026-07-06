<template>
	<article v-if="data">
		<Breadcrumbs
			:items="[
				{ label: 'Главная', to: '/' },
				{ label: 'Рецепты', to: '/recepty' },
				{ label: data.name },
			]"
		/>

		<!-- ─── Hero (без фото — emoji + bg_color) ───────────────── -->
		<header class="hero" :style="{ background: data.bg_color || '#E4F5EA' }">
			<div class="hero__emoji" aria-hidden="true">{{ data.emoji }}</div>
			<div class="hero__copy">
				<h1>{{ data.name }}</h1>
				<p v-if="data.description" class="hero__desc">{{ data.description }}</p>
				<ul class="hero__meta">
					<li v-if="data.time_minutes"><strong>⏱ {{ data.time_minutes }} мин</strong></li>
					<li v-if="data.kcal"><strong>🔥 {{ Math.round(data.kcal) }} ккал</strong></li>
					<li v-if="mealLabel"><strong :style="{ color: mealColor }">{{ mealLabel }}</strong></li>
				</ul>
			</div>
		</header>

		<!-- ─── КБЖУ ───────────────────────────────────────────────── -->
		<section v-if="data.proteins || data.fats || data.carbs" class="macros" aria-labelledby="macros-h">
			<h2 id="macros-h">КБЖУ на порцию</h2>
			<div class="macros__grid">
				<div v-if="data.kcal" class="macro">
					<strong>{{ Math.round(data.kcal) }}</strong>
					<span>ккал</span>
				</div>
				<div v-if="data.proteins" class="macro">
					<strong>{{ formatMacro(data.proteins) }}</strong>
					<span>г белка</span>
				</div>
				<div v-if="data.fats" class="macro">
					<strong>{{ formatMacro(data.fats) }}</strong>
					<span>г жира</span>
				</div>
				<div v-if="data.carbs" class="macro">
					<strong>{{ formatMacro(data.carbs) }}</strong>
					<span>г углеводов</span>
				</div>
			</div>
		</section>

		<!-- ─── Ингредиенты ────────────────────────────────────────── -->
		<section v-if="data.ingredients?.length" class="ingredients" aria-labelledby="ingr-h">
			<h2 id="ingr-h">Ингредиенты</h2>
			<ul class="ingredients__list">
				<li v-for="(ing, i) in data.ingredients" :key="i">
					<span class="ingredients__name">{{ ing.name }}</span>
					<span v-if="ing.quantity" class="ingredients__qty">{{ ing.quantity }}</span>
				</li>
			</ul>
		</section>

		<!-- ─── Шаги ──────────────────────────────────────────────── -->
		<section v-if="data.steps?.length" class="steps" aria-labelledby="steps-h">
			<h2 id="steps-h">Как приготовить</h2>
			<ol class="steps__list">
				<li v-for="(step, i) in data.steps" :key="i">{{ step }}</li>
			</ol>
		</section>

		<!-- ─── Главный CTA — мост в продукт ─────────────────────── -->
		<div class="cta-block">
			<p><strong>Хочешь готовить такие рецепты регулярно — без выбора каждый день?</strong></p>
			<a href="/onboarding" class="btn-cta" @click="trackCta('after_recipe')">
				Собрать меню за 60 сек
			</a>
			<small>В приложении это блюдо можно добавить в меню недели одной кнопкой.</small>
		</div>

		<!-- ─── Похожие ────────────────────────────────────────────── -->
		<section v-if="data.similar?.length" class="similar" aria-labelledby="similar-h">
			<h2 id="similar-h">Похожие рецепты</h2>
			<div class="similar__grid">
				<RecipeCardEmoji
					v-for="r in data.similar"
					:key="r.slug"
					:recipe="r"
				/>
			</div>
		</section>

		<!-- ─── Cross-links к справочнику ─────────────────────────── -->
		<section v-if="hasCrossLinks" class="cross-links">
			<h2>Полезное к этому рецепту</h2>
			<ul>
				<li>
					Подобрать другие рецепты —
					<NuxtLink to="/chto-prigotovit/iz-togo-chto-est">из того, что есть дома</NuxtLink>
				</li>
				<li>
					<NuxtLink :to="`/menyu-na-nedelyu/${suggestedMenu}`">
						Меню на неделю — {{ menuLabel(suggestedMenu) }}
					</NuxtLink>
				</li>
			</ul>
		</section>
	</article>
</template>

<script setup lang="ts">
import { mealVisual } from '@plus-time/design-tokens/meals';

const route = useRoute();
const slug = route.params.slug as string;

const config = useRuntimeConfig();
const apiBase = config.apiBase || '';

const { data, error } = await useAsyncData(`recipe-${slug}`, async () => {
	// На сервере (prerender) ходим по apiBase напрямую, на клиенте — через nginx /api/seo/
	const url = import.meta.server
		? `${apiBase}/api/seo/recipes/${encodeURIComponent(slug)}`
		: `/api/seo/recipes/${encodeURIComponent(slug)}`;
	return await $fetch<any>(url);
});

if (!data.value) {
	throw createError({ statusCode: 404, statusMessage: 'Рецепт не найден' });
}

const mealLabel = computed(() => {
	const v = mealVisual(data.value?.meal_type || '');
	return v.label;
});
const mealColor = computed(() => {
	const v = mealVisual(data.value?.meal_type || '');
	return v.fg;
});

// Подбираем «соседнее» меню в зависимости от тегов рецепта
const suggestedMenu = computed<'pp' | 'byudzhetnoe' | 'dlya-semi'>(() => {
	if (data.value?.is_vegan || data.value?.is_vegetarian || (data.value?.kcal && data.value.kcal < 350)) return 'pp';
	if (data.value?.is_fast) return 'byudzhetnoe';
	return 'dlya-semi';
});

const hasCrossLinks = computed(() => Boolean(suggestedMenu.value));

function menuLabel(m: string): string {
	const map: Record<string, string> = {
		'pp': 'ПП-меню',
		'byudzhetnoe': 'бюджетное',
		'dlya-semi': 'для семьи',
	};
	return map[m] || m;
}

function formatMacro(n: number): string {
	return n.toFixed(1).replace(/\.0$/, '');
}

function trackCta(where: string) {
	if (typeof window !== 'undefined' && (window as any).ym) {
		const counter = useRuntimeConfig().public.ymCounter;
		if (counter) (window as any).ym(counter, 'reachGoal', 'recipe_cta', { where, slug });
	}
}

// ─── SEO ───
useSeoHead({
	title: `${data.value.name} — рецепт с КБЖУ`,
	description: data.value.description
		? data.value.description.slice(0, 158)
		: `${data.value.name}: ${data.value.time_minutes ?? '—'} мин, ${data.value.kcal ? Math.round(data.value.kcal) : '—'} ккал. Пошаговый рецепт с КБЖУ.`,
	path: `/recepty/${slug}`,
	ogSlug: `recepty/${slug}`,
});

// Schema.org Recipe (главная сущность) + BreadcrumbList уже добавлен через Breadcrumbs
const siteUrl = useRuntimeConfig().public.siteUrl;
useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'Recipe',
				name: data.value.name,
				description: data.value.description || `Пошаговый рецепт «${data.value.name}» с КБЖУ`,
				datePublished: new Date().toISOString().split('T')[0],
				author: {
					'@type': 'Organization',
					name: 'Время Есть',
					url: siteUrl,
				},
				image: `${siteUrl}/og/recepty/${slug}.png`,
				prepTime: data.value.time_minutes ? `PT${data.value.time_minutes}M` : undefined,
				totalTime: data.value.time_minutes ? `PT${data.value.time_minutes}M` : undefined,
				recipeCategory: data.value.category || data.value.meal_type,
				recipeCuisine: data.value.cuisine,
				keywords: (data.value.tags || []).join(', '),
				recipeIngredient: (data.value.ingredients || []).map(
					(i: any) => `${i.quantity ? i.quantity + ' ' : ''}${i.name}`,
				),
				recipeInstructions: (data.value.steps || []).map((step: string, idx: number) => ({
					'@type': 'HowToStep',
					position: idx + 1,
					text: step,
				})),
				nutrition: {
					'@type': 'NutritionInformation',
					calories: data.value.kcal ? `${Math.round(data.value.kcal)} kcal` : undefined,
					proteinContent: data.value.proteins ? `${formatMacro(data.value.proteins)} g` : undefined,
					fatContent: data.value.fats ? `${formatMacro(data.value.fats)} g` : undefined,
					carbohydrateContent: data.value.carbs ? `${formatMacro(data.value.carbs)} g` : undefined,
				},
				suitableForDiet: [
					data.value.is_vegetarian && 'https://schema.org/VegetarianDiet',
					data.value.is_vegan && 'https://schema.org/VeganDiet',
					data.value.is_gluten_free && 'https://schema.org/GlutenFreeDiet',
				].filter(Boolean),
			}),
		},
	],
});
</script>

<style scoped>
.hero {
	display: flex;
	gap: var(--lg);
	align-items: center;
	padding: var(--xl);
	border-radius: var(--r-card);
	margin-bottom: var(--xl);
}
.hero__emoji {
	font-size: 96px;
	line-height: 1;
	flex-shrink: 0;
}
.hero__copy { flex: 1; min-width: 0; }
.hero h1 {
	margin: 0 0 var(--sm);
	font-family: var(--ff-display);
	font-size: clamp(1.4rem, 4vw, 2rem);
	line-height: 1.2;
}
.hero__desc {
	margin: 0 0 var(--md);
	color: var(--t2);
	font-size: 0.95rem;
	line-height: 1.5;
}
.hero__meta {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	gap: var(--md);
	flex-wrap: wrap;
	font-size: 0.9rem;
}
.hero__meta strong { color: var(--t1); }

@media (max-width: 540px) {
	.hero { flex-direction: column; text-align: center; }
	.hero__emoji { font-size: 72px; }
}

.macros {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--lg);
	margin-bottom: var(--xl);
}
.macros h2 { margin-top: 0; }
.macros__grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
	gap: var(--md);
}
.macro {
	text-align: center;
	padding: var(--md);
	background: var(--gp);
	border-radius: var(--r-card);
}
.macro strong {
	display: block;
	font-family: var(--ff-display);
	font-size: 1.4rem;
	color: var(--gd);
	font-variant-numeric: tabular-nums;
}
.macro span { font-size: 0.8rem; color: var(--t3); }

.ingredients, .steps {
	background: var(--surf);
	border-radius: var(--r-card);
	box-shadow: var(--sh1);
	padding: var(--xl);
	margin-bottom: var(--xl);
}
.ingredients__list {
	list-style: none;
	padding: 0;
	margin: 0;
}
.ingredients__list li {
	display: flex;
	justify-content: space-between;
	gap: var(--md);
	padding: var(--sm) 0;
	border-bottom: 1px solid var(--bdr);
}
.ingredients__list li:last-child { border-bottom: none; }
.ingredients__name { color: var(--t1); }
.ingredients__qty {
	color: var(--t3);
	font-variant-numeric: tabular-nums;
	text-align: right;
	flex-shrink: 0;
}

.steps__list {
	padding-left: 24px;
	margin: 0;
}
.steps__list li {
	margin-bottom: var(--md);
	line-height: 1.6;
}

.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
	margin-bottom: var(--xl);
}
.cta-block p { margin: 0 0 var(--md); }
.cta-block small {
	display: block;
	margin-top: var(--sm);
	color: var(--t3);
	font-size: 0.85rem;
}

.similar {
	margin-bottom: var(--xl);
}
.similar__grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: var(--lg);
}

.cross-links {
	background: var(--surf2);
	border-radius: var(--r-card);
	padding: var(--lg);
}
.cross-links ul {
	margin: var(--sm) 0 0;
	padding-left: 20px;
}
.cross-links li { margin-bottom: var(--sm); }
</style>
