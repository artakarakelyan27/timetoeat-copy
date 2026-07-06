<template>
	<div class="layout">
		<SiteHeader />
		<main id="main" class="main">
			<slot />
		</main>
		<SiteFooter />
		<StickyCta />
	</div>
</template>

<script setup lang="ts">
// Дефолтный layout: header + main + footer + sticky CTA на каждой странице.
// CTA — единая конверсионная цель по правилу S0.5: всё ведёт на / (онбординг).
</script>

<style scoped>
.layout {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

.main {
	flex: 1;
	padding: var(--lg) var(--lg) calc(var(--nav-h) + var(--xxl));
	max-width: 760px;
	width: 100%;
	margin: 0 auto;
}

@media (min-width: 768px) {
	.main {
		padding: var(--xxl) var(--xxl) calc(var(--nav-h) + var(--xxxl));
	}
}
</style>
