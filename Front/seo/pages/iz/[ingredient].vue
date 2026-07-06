<template>
	<article v-if="data">
		<Breadcrumbs
			:items="[
				{ label: 'Главная', to: '/' },
				{ label: 'Ингредиенты', to: '/iz' },
				{ label: data.name },
			]"
		/>

		<h1>{{ data.name }} — справочник</h1>

		<p class="lead">
			На этой странице собрано всё, что у нас есть по теме «{{ data.name.toLowerCase() }}»: замены в готовке,
			сроки хранения и сценарии из остатков. По мере появления рецептов будем добавлять их сюда же.
		</p>

		<div class="resources">
			<NuxtLink
				v-if="data.zamenySlug"
				:to="`/spravochnik/zameny/${data.zamenySlug}`"
				class="resource-card resource-card--zameny"
			>
				<span class="resource-card__emoji" aria-hidden="true">🔄</span>
				<div>
					<h2>Чем заменить — {{ data.name.toLowerCase() }}</h2>
					<p>{{ data.zamenyShort?.slice(0, 180) }}…</p>
				</div>
			</NuxtLink>

			<NuxtLink
				v-if="data.srokKhraneniyaSlug"
				:to="`/spravochnik/srok-khraneniya/${data.srokKhraneniyaSlug}`"
				class="resource-card resource-card--srok"
			>
				<span class="resource-card__emoji" aria-hidden="true">⏱</span>
				<div>
					<h2>Сроки хранения — {{ data.name.toLowerCase() }}</h2>
					<p>{{ data.srokKhraneniyaShort?.slice(0, 180) }}…</p>
				</div>
			</NuxtLink>

			<NuxtLink
				v-if="data.ostatkiSlug"
				:to="`/iz-ostatkov/${data.ostatkiSlug}`"
				class="resource-card resource-card--ostatki"
			>
				<span class="resource-card__emoji" aria-hidden="true">♻️</span>
				<div>
					<h2>Из остатков — {{ data.name.toLowerCase() }}</h2>
					<p>{{ data.ostatkiShort?.slice(0, 180) }}…</p>
				</div>
			</NuxtLink>
		</div>

		<section v-if="missingCount > 0" class="future-info">
			<p>
				Карточки рецептов под этот продукт появятся позже — наполняем базу. А пока подбери блюдо через
				<NuxtLink to="/chto-prigotovit/iz-togo-chto-est">селектор «из того, что есть»</NuxtLink>
				или открой готовое меню на неделю.
			</p>
		</section>

		<div class="cta-block">
			<p><strong>Хочешь меню под свои продукты — без подбора каждый день?</strong></p>
			<a href="/onboarding" class="btn-cta">Составить меню за 60 сек</a>
			<small>Алгоритм соберёт меню с учётом продуктов, которые ты любишь.</small>
		</div>
	</article>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = route.params.ingredient as string;

const { data } = await useAsyncData(`iz-${slug}`, () =>
	$fetch('/api/_content/iz', { query: { slug } }),
);

if (!data.value) {
	throw createError({ statusCode: 404, statusMessage: 'Ингредиент не найден' });
}

const missingCount = computed(() => {
	let n = 3;
	if (data.value?.zamenySlug) n--;
	if (data.value?.srokKhraneniyaSlug) n--;
	if (data.value?.ostatkiSlug) n--;
	return n;
});

useSeoHead({
	title: `${data.value!.name} — справочник: замены, хранение, рецепты`,
	description: `Справочник по теме «${data.value!.name.toLowerCase()}»: чем заменить, сколько хранится, сценарии из остатков. От сервиса «Время Есть».`,
	path: `/iz/${slug}`,
	ogSlug: `iz/${slug}`,
});
</script>

<style scoped>
.lead {
	color: var(--t2);
	margin-bottom: var(--xl);
	line-height: 1.55;
}

.resources {
	display: grid;
	gap: var(--md);
	margin-bottom: var(--xxl);
}

@media (min-width: 640px) {
	.resources { grid-template-columns: 1fr 1fr; }
}

.resource-card {
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

.resource-card:hover {
	transform: translateY(-2px);
	box-shadow: var(--sh2);
	color: var(--t1);
}

.resource-card__emoji { font-size: 28px; line-height: 1; flex-shrink: 0; }
.resource-card h2 {
	margin: 0 0 4px;
	font-family: var(--ff-display);
	font-size: 1.05rem;
}
.resource-card p {
	margin: 0;
	color: var(--t2);
	font-size: 0.9rem;
	line-height: 1.45;
}

.resource-card--zameny  { border-left: 4px solid var(--g); }
.resource-card--srok    { border-left: 4px solid var(--blue); }
.resource-card--ostatki { border-left: 4px solid var(--amb); }

.future-info {
	background: var(--surf2);
	border-radius: var(--r-card);
	padding: var(--lg);
	margin-bottom: var(--xl);
	color: var(--t2);
}

.cta-block {
	background: var(--gp);
	border-radius: var(--r-card);
	padding: var(--xl);
	text-align: center;
}
.cta-block p { margin: 0 0 var(--md); }
.cta-block small { display: block; margin-top: var(--sm); color: var(--t3); font-size: 0.85rem; }
</style>
