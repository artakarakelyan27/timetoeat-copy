<template>
	<nav class="crumbs" aria-label="Хлебные крошки">
		<ol class="crumbs__list">
			<li v-for="(item, i) in items" :key="i">
				<NuxtLink v-if="item.to && i < items.length - 1" :to="item.to">{{ item.label }}</NuxtLink>
				<span v-else>{{ item.label }}</span>
				<span v-if="i < items.length - 1" class="crumbs__sep" aria-hidden="true">/</span>
			</li>
		</ol>
	</nav>
</template>

<script setup lang="ts">
// Хлебные крошки + автоматическая schema.org BreadcrumbList.
interface Crumb {
	label: string;
	to?: string;
}

const props = defineProps<{ items: Crumb[] }>();

// Schema.org через JSON-LD
const config = useRuntimeConfig().public;
const siteUrl = config.siteUrl;

useHead({
	script: [
		{
			type: 'application/ld+json',
			children: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: props.items.map((it, idx) => ({
					'@type': 'ListItem',
					position: idx + 1,
					name: it.label,
					item: it.to ? `${siteUrl}${it.to}` : undefined,
				})),
			}),
		},
	],
});
</script>

<style scoped>
.crumbs__list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}

.crumbs__list li {
	display: inline-flex;
	align-items: center;
}
</style>
