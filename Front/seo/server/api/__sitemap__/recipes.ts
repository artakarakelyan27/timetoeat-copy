/**
 * Динамический sitemap для рецептов. Тянет slug-list из FastAPI.
 * Бэкенд: GET /api/seo/sitemap?type=recipes (см. backend-additions/seo.py)
 */

export default defineSitemapEventHandler(async () => {
	const config = useRuntimeConfig();
	try {
		const items = await $fetch<Array<{ slug: string; updated_at?: string }>>(
			`${config.apiBase}/api/seo/sitemap`,
			{ query: { type: 'recipes' } },
		);
		return items.map((r) => ({
			loc: `/recepty/${r.slug}`,
			lastmod: r.updated_at || new Date().toISOString(),
			priority: 0.7,
		}));
	} catch (err) {
		console.error('[sitemap] recipes lookup failed', err);
		return [];
	}
});
