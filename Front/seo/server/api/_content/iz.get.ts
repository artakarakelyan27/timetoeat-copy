/**
 * Агрегатор данных по ингредиенту для /iz/[ingredient].
 *
 * Ключевое:
 *   - slug ингредиента (например "drozhzhi") и slug yaml-карточки (например
 *     "drozhzhi-suhie") могут отличаться. Возвращаем точные slug'и связанных
 *     карточек, чтобы в шаблоне линковать на /spravochnik/zameny/drozhzhi-suhie,
 *     а не на /spravochnik/zameny/drozhzhi (404).
 */

import { loadYaml } from '../../utils/load-content';

async function collectKnownSlugs(): Promise<Set<string>> {
	const slugs = new Set<string>();

	for (const file of [
		'reference/zameny.yaml',
		'reference/srok-khraneniya.yaml',
	]) {
		try {
			const items = await loadYaml<any[]>(file);
			for (const it of items || []) {
				if (it.linked_ingredient) slugs.add(it.linked_ingredient);
				if (it.slug) slugs.add(it.slug);
			}
		} catch {
			/* ignore */
		}
	}

	try {
		const ostatki = await loadYaml<any[]>('iz-ostatkov.yaml');
		for (const it of ostatki || []) {
			if (it.linked_ingredient) slugs.add(it.linked_ingredient);
		}
	} catch {
		/* ignore */
	}

	return slugs;
}

interface IngredientInfo {
	slug: string;
	name: string;
	emoji: string;
	// Точные slug'и связанных карточек (могут отличаться от slug ингредиента)
	zamenySlug: string | null;
	zamenyShort: string | null;
	srokKhraneniyaSlug: string | null;
	srokKhraneniyaShort: string | null;
	ostatkiSlug: string | null;
	ostatkiShort: string | null;
}

async function buildIngredient(slug: string): Promise<IngredientInfo | null> {
	const known = await collectKnownSlugs();
	if (!known.has(slug)) return null;

	const out: IngredientInfo = {
		slug,
		name: slug,
		emoji: '🥘',
		zamenySlug: null,
		zamenyShort: null,
		srokKhraneniyaSlug: null,
		srokKhraneniyaShort: null,
		ostatkiSlug: null,
		ostatkiShort: null,
	};

	// zameny — ищем по slug ИЛИ по linked_ingredient
	try {
		const zameny = await loadYaml<any[]>('reference/zameny.yaml');
		const z = zameny.find((x: any) => x.slug === slug || x.linked_ingredient === slug);
		if (z) {
			out.zamenySlug = z.slug;             // ← реальный slug yaml-карточки
			out.zamenyShort = z.short_answer || null;
			out.name = z.name || out.name;
			out.emoji = z.emoji || out.emoji;
		}
	} catch {
		/* ignore */
	}

	// srok-khraneniya
	try {
		const sk = await loadYaml<any[]>('reference/srok-khraneniya.yaml');
		const s = sk.find((x: any) => x.slug === slug || x.linked_ingredient === slug);
		if (s) {
			out.srokKhraneniyaSlug = s.slug;
			out.srokKhraneniyaShort = s.short_answer || null;
			if (out.name === slug) out.name = s.name;
			if (out.emoji === '🥘') out.emoji = s.emoji;
		}
	} catch {
		/* ignore */
	}

	// iz-ostatkov
	try {
		const ostatki = await loadYaml<any[]>('iz-ostatkov.yaml');
		const o = ostatki.find((x: any) => x.linked_ingredient === slug);
		if (o) {
			out.ostatkiSlug = o.slug;
			out.ostatkiShort = o.short_answer || null;
			if (out.name === slug) out.name = o.source_name || o.name;
			if (out.emoji === '🥘') out.emoji = o.emoji;
		}
	} catch {
		/* ignore */
	}

	return out;
}

export default defineEventHandler(async (event) => {
	const slug = getQuery(event).slug as string | undefined;

	if (slug) {
		const data = await buildIngredient(slug);
		if (!data) {
			throw createError({ statusCode: 404, statusMessage: 'Ингредиент не найден' });
		}
		return data;
	}

	const known = await collectKnownSlugs();
	const list: IngredientInfo[] = [];
	for (const s of known) {
		const info = await buildIngredient(s);
		if (info) list.push(info);
	}
	list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
	return list;
});
