import { loadYaml } from '../../utils/load-content';

const KNOWN_SLUGS = ['dlya-semi', 'pp', 'byudzhetnoe'];

export default defineEventHandler(async (event) => {
	const slug = getQuery(event).slug as string | undefined;

	if (slug) {
		if (!KNOWN_SLUGS.includes(slug)) {
			throw createError({ statusCode: 404, statusMessage: 'Меню не найдено' });
		}
		const data = await loadYaml<any>(`menyu/${slug}.yaml`);
		return data;
	}

	// Без slug — список всех меню (для индексной страницы /menyu-na-nedelyu)
	const out = [];
	for (const s of KNOWN_SLUGS) {
		try {
			const d = await loadYaml<any>(`menyu/${s}.yaml`);
			out.push({
				slug: d.slug,
				title: d.title,
				emoji: d.emoji,
				short_answer: d.short_answer,
				audience: d.audience,
				avg_kcal: d.totals?.avg_kcal || d.totals?.avg_kcal_per_person || d.totals?.avg_kcal_adult,
				weekly_budget_hint: d.weekly_budget_hint,
				updated: d.updated,
			});
		} catch {
			/* skip missing */
		}
	}
	return out;
});
