<template>
	<a
		href="/onboarding"
		class="sticky-cta"
		:class="{ 'sticky-cta--parked': parked }"
		:aria-hidden="parked ? 'true' : 'false'"
		:tabindex="parked ? -1 : 0"
		@click="track"
	>
		<span class="sticky-cta__icon" aria-hidden="true">⚡️</span>
		<span class="sticky-cta__text">
			<strong>Меню на неделю за 60 сек</strong>
			<span class="sticky-cta__hint">Бесплатно · без регистрации сначала</span>
		</span>
		<span class="sticky-cta__arrow" aria-hidden="true">→</span>
	</a>
</template>

<script setup lang="ts">
// Sticky bottom-bar CTA на каждой SEO-странице.
// При появлении футера в зоне видимости — плашка плавно паркуется ниже
// экрана, чтобы не закрывать ссылки в футере и не дублировать смысл CTA
// в зоне «после контента».
//
// Реализация: IntersectionObserver на элемент footer (через ref в layout).
// Когда footer становится intersecting — выставляем parked=true.
//
// Без window/DOM в SSG — работает только на клиенте, поэтому всё в onMounted.

import { ref, onMounted, onUnmounted } from 'vue';

const parked = ref(false);
let observer: IntersectionObserver | null = null;

onMounted(() => {
	const footer = document.querySelector('footer.footer');
	if (!footer) return;

	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				// Парк когда видна хоть какая-то часть футера (10% порог)
				parked.value = entry.isIntersecting && entry.intersectionRatio > 0.1;
			}
		},
		{ threshold: [0, 0.1, 0.5, 1] },
	);
	observer.observe(footer);
});

onUnmounted(() => {
	observer?.disconnect();
	observer = null;
});

function track() {
	if (typeof window !== 'undefined' && typeof (window as any).ym === 'function') {
		const counter = useRuntimeConfig().public.ymCounter;
		if (counter) (window as any).ym(counter, 'reachGoal', 'clicked_cta_menu');
	}
}
</script>

<style scoped>
.sticky-cta {
	position: fixed;
	bottom: 12px;
	left: 12px;
	right: 12px;
	max-width: 720px;
	margin: 0 auto;
	background: var(--brand-gradient);
	color: #fff;
	border-radius: var(--r-pill);
	box-shadow: var(--sh-cta);
	padding: 10px 16px;
	display: flex;
	align-items: center;
	gap: 12px;
	text-decoration: none;
	z-index: 100;
	transition: transform 0.3s var(--ease-spring),
	            opacity 0.25s var(--ease-out),
	            box-shadow 0.2s var(--ease-out);
	min-height: var(--touch);
	bottom: calc(12px + env(safe-area-inset-bottom));
}

.sticky-cta:hover {
	transform: translateY(-1px);
	box-shadow: 0 10px 28px rgba(69, 174, 107, 0.45);
	color: #fff;
}

.sticky-cta:active {
	transform: translateY(0) scale(0.98);
}

.sticky-cta:focus-visible {
	outline: 3px solid #fff;
	outline-offset: 2px;
}

/* Когда виден футер — плашка съезжает вниз и становится прозрачной.
   pointer-events: none гарантирует, что она не перехватывает клики
   по ссылкам внутри футера. */
.sticky-cta--parked {
	transform: translateY(150%);
	opacity: 0;
	pointer-events: none;
}

.sticky-cta__icon {
	font-size: 22px;
	line-height: 1;
}

.sticky-cta__text {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.sticky-cta__text strong {
	font-weight: 700;
	font-size: 0.95rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.sticky-cta__hint {
	font-size: 0.72rem;
	opacity: 0.85;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.sticky-cta__arrow {
	font-size: 22px;
	line-height: 1;
}

@media (min-width: 768px) {
	.sticky-cta__hint {
		font-size: 0.8rem;
	}
}

@media (prefers-reduced-motion: reduce) {
	.sticky-cta {
		transition: none;
	}
}
</style>
