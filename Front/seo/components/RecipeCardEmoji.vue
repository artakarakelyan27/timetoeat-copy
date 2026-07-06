<template>
	<NuxtLink :to="`/recepty/${recipe.slug}`" class="recipe-card-emoji">
		<div
			class="recipe-card-emoji__hero"
			:style="{ background: recipe.bg_color || defaultBg }"
		>
			<span aria-hidden="true">{{ recipe.emoji || '🍽️' }}</span>
		</div>
		<div class="recipe-card-emoji__body">
			<h3 class="recipe-card-emoji__title">{{ recipe.name }}</h3>
			<p class="recipe-card-emoji__meta">
				<span v-if="recipe.time_minutes">⏱ {{ recipe.time_minutes }} мин</span>
				<span v-if="recipe.kcal">🔥 {{ recipe.kcal }} ккал</span>
				<span v-if="mealLabel" class="meal-tag" :style="mealStyle">{{ mealLabel }}</span>
			</p>
		</div>
	</NuxtLink>
</template>

<script setup lang="ts">
import { mealVisual } from '@plus-time/design-tokens/meals';

interface RecipeCardData {
	slug: string;
	name: string;
	emoji?: string;
	bg_color?: string;
	time_minutes?: number;
	kcal?: number;
	meal_type?: string;
}

const props = defineProps<{ recipe: RecipeCardData }>();

const defaultBg = '#E4F5EA';

const mealLabel = computed(() => {
	if (!props.recipe.meal_type) return null;
	return mealVisual(props.recipe.meal_type).label;
});

const mealStyle = computed(() => {
	if (!props.recipe.meal_type) return {};
	const v = mealVisual(props.recipe.meal_type);
	return { background: v.bg, color: v.fg };
});
</script>

<style scoped>
.meal-tag {
	padding: 2px 8px;
	border-radius: var(--r-chip);
	font-size: 0.7rem;
	font-weight: 700;
}
</style>
