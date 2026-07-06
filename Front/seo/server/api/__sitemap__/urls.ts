/**
 * Прокси для @nuxtjs/sitemap.
 * Возвращает базовый список статических SEO-маршрутов с lastmod.
 * Динамические (рецепты, ингредиенты, меню) — в отдельных endpoint'ах.
 */

export default defineSitemapEventHandler(async () => {
	const now = new Date().toISOString();
	return [
		{ loc: '/o-proekte', lastmod: now, priority: 0.6 },
		{ loc: '/recepty', lastmod: now, priority: 0.9 },
		{ loc: '/chto-prigotovit', lastmod: now, priority: 0.9 },
		{ loc: '/chto-prigotovit/iz-togo-chto-est', lastmod: now, priority: 0.95 },
		{ loc: '/menyu-na-nedelyu', lastmod: now, priority: 0.95 },
		{ loc: '/spravochnik', lastmod: now, priority: 0.7 },
		{ loc: '/iz-ostatkov', lastmod: now, priority: 0.8 },
		{ loc: '/gotovim-vprok', lastmod: now, priority: 0.8 },
		{ loc: '/sezon', lastmod: now, priority: 0.7 },
		{ loc: '/blog', lastmod: now, priority: 0.6 },
	];
});
