/**
 * useSeoHead — стандартизированный набор метаданных + OG для любой страницы.
 *
 * Использование:
 *
 * useSeoHead({
 *   title: 'Борщ — классический рецепт',
 *   description: 'Пошаговый рецепт борща за 60 минут. КБЖУ на порцию: 312/24/8/32.',
 *   path: '/recepty/borsch',
 *   ogSlug: 'recepty/borsch',   // ключ для /og/[slug].png
 * });
 */

interface SeoHeadOptions {
	title: string;
	description: string;
	path: string;
	ogSlug?: string;       // для динамического OG; если пусто — используется дефолтный лого-OG
	noindex?: boolean;
}

export function useSeoHead(opts: SeoHeadOptions) {
	const { siteUrl } = useRuntimeConfig().public;
	const canonical = `${siteUrl}${opts.path}`;
	const ogImage = opts.ogSlug
		? `${siteUrl}/og/${opts.ogSlug}.png`
		: `${siteUrl}/og/default.png`;

	useSeoMeta({
		title: opts.title,
		description: opts.description,
		ogTitle: opts.title,
		ogDescription: opts.description,
		ogUrl: canonical,
		ogImage,
		ogImageAlt: opts.title,
		ogType: 'website',
		ogSiteName: 'Время Есть',
		ogLocale: 'ru_RU',
		twitterCard: 'summary_large_image',
		twitterTitle: opts.title,
		twitterDescription: opts.description,
		twitterImage: ogImage,
		robots: opts.noindex ? 'noindex, follow' : 'index, follow',
	});

	useHead({
		link: [
			{ rel: 'canonical', href: canonical },
		],
	});
}
