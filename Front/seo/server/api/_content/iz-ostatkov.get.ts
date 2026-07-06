import { loadYaml } from '../../utils/load-content';

export default defineEventHandler(async (event) => {
	const slug = getQuery(event).slug as string | undefined;
	const data = await loadYaml<any[]>('iz-ostatkov.yaml');

	if (slug) {
		const item = data.find((x) => x.slug === slug);
		if (!item) throw createError({ statusCode: 404, statusMessage: 'Not found' });
		return item;
	}
	return data.map((x) => ({
		slug: x.slug,
		name: x.name,
		source_name: x.source_name,
		emoji: x.emoji,
		short_answer: x.short_answer,
	}));
});
