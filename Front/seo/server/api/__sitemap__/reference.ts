export default defineSitemapEventHandler(async () => {
	const config = useRuntimeConfig();
	try {
		const items = await $fetch<Array<{ slug: string; subtype: string; updated_at?: string }>>(
			`${config.apiBase}/api/seo/sitemap`,
			{ query: { type: 'reference' } },
		);
		return items.map((r) => ({
			loc: `/spravochnik/${r.subtype}/${r.slug}`,
			lastmod: r.updated_at || new Date().toISOString(),
			priority: 0.65,
		}));
	} catch (err) {
		return [];
	}
});
