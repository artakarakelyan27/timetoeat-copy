export default defineSitemapEventHandler(async () => {
	const config = useRuntimeConfig();
	try {
		const items = await $fetch<Array<{ slug: string; updated_at?: string }>>(
			`${config.apiBase}/api/seo/sitemap`,
			{ query: { type: 'ingredients' } },
		);
		const out: Array<{ loc: string; lastmod: string; priority: number }> = [];
		for (const i of items) {
			out.push({
				loc: `/iz/${i.slug}`,
				lastmod: i.updated_at || new Date().toISOString(),
				priority: 0.75,
			});
			// Кросс-линковка с архетипом «из остатков» — отдельной таблицей бэк решит,
			// нужна ли страница; здесь генерируем только если бэк её одобрил.
		}
		return out;
	} catch (err) {
		console.error('[sitemap] ingredients lookup failed', err);
		return [];
	}
});
