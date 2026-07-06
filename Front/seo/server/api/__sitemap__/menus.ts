export default defineSitemapEventHandler(async () => {
	const config = useRuntimeConfig();
	try {
		const items = await $fetch<Array<{ slug: string; updated_at?: string }>>(
			`${config.apiBase}/api/seo/sitemap`,
			{ query: { type: 'menus' } },
		);
		return items.map((m) => ({
			loc: `/menyu-na-nedelyu/${m.slug}`,
			lastmod: m.updated_at || new Date().toISOString(),
			priority: 0.9, // конверсионные страницы — высокий приоритет
		}));
	} catch (err) {
		return [];
	}
});
