/**
 * Собственный генератор sitemap.xml (без модуля @nuxtjs/sitemap).
 * Собирает:
 *  - статические маршруты (хардкод)
 *  - все slug'и из content/*.yaml
 *  - все рецепты/ингредиенты из API_BASE (если задан)
 *
 * Маршрут: GET /sitemap.xml
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';

interface SitemapUrl {
	loc: string;
	lastmod?: string;
	priority?: number;
	changefreq?: string;
}

const STATIC_URLS: SitemapUrl[] = [
	{ loc: '/', priority: 1.0 },
	{ loc: '/o-proekte', priority: 0.6 },
	{ loc: '/recepty', priority: 0.9 },
	{ loc: '/chto-prigotovit', priority: 0.9 },
	{ loc: '/chto-prigotovit/iz-togo-chto-est', priority: 0.95 },
	{ loc: '/menyu-na-nedelyu', priority: 0.95 },
	{ loc: '/spravochnik', priority: 0.7 },
	{ loc: '/iz', priority: 0.75 },
	{ loc: '/iz-ostatkov', priority: 0.85 },
	{ loc: '/gotovim-vprok', priority: 0.6 },
	{ loc: '/blog', priority: 0.5 },
];

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '');
	const urls: SitemapUrl[] = [...STATIC_URLS];

	// 1. Локальные yaml-массивы
	for (const [file, prefix] of [
		['content/reference/zameny.yaml', '/spravochnik/zameny'],
		['content/reference/srok-khraneniya.yaml', '/spravochnik/srok-khraneniya'],
		['content/iz-ostatkov.yaml', '/iz-ostatkov'],
	] as const) {
		try {
			const text = await readFile(resolve(process.cwd(), file), 'utf8');
			const items: any[] = parse(text);
			for (const it of items || []) {
				if (!it?.slug) continue;
				urls.push({
					loc: `${prefix}/${it.slug}`,
					lastmod: it.updated,
					priority: 0.7,
				});
			}
		} catch {
			// нет файла — окей
		}
	}

	// 1b. Меню-лендинги — каждый в своём yaml-файле
	try {
		const { readdir } = await import('node:fs/promises');
		const menyuDir = resolve(process.cwd(), 'content/menyu');
		for (const f of await readdir(menyuDir).catch(() => [])) {
			if (!f.endsWith('.yaml')) continue;
			const text = await readFile(resolve(menyuDir, f), 'utf8');
			const data: any = parse(text);
			if (!data?.slug) continue;
			urls.push({
				loc: `/menyu-na-nedelyu/${data.slug}`,
				lastmod: data.updated,
				priority: 0.95, // главная конверсия
			});
		}
	} catch (err) {
		console.warn('[sitemap] menyu skipped:', err);
	}

	// 1c. /iz/[ingredient] — все slug'и которые встречаются в справочных yaml
	const izSlugs = new Set<string>();
	for (const file of [
		'content/reference/zameny.yaml',
		'content/reference/srok-khraneniya.yaml',
		'content/iz-ostatkov.yaml',
	]) {
		try {
			const text = await readFile(resolve(process.cwd(), file), 'utf8');
			const items: any[] = parse(text);
			for (const it of items || []) {
				if (it?.linked_ingredient) izSlugs.add(it.linked_ingredient);
				if (it?.slug && (file.includes('zameny') || file.includes('srok-khraneniya'))) {
					izSlugs.add(it.slug);
				}
			}
		} catch {
			/* ignore */
		}
	}
	for (const s of izSlugs) {
		urls.push({ loc: `/iz/${s}`, priority: 0.7 });
	}

	// 2. Бэкенд (если жив) — здесь $fetch уже работает, в отличие от nitro:config хука
	const apiBase = config.apiBase as string;
	if (apiBase) {
		try {
			const recipes = await $fetch<Array<{ slug: string; updated_at?: string }>>(
				`${apiBase}/api/seo/sitemap`,
				{ query: { type: 'recipes' } },
			).catch(() => []);
			for (const r of recipes) {
				if (r.slug) {
					urls.push({ loc: `/recepty/${r.slug}`, lastmod: r.updated_at, priority: 0.7 });
				}
			}
		} catch (err) {
			console.warn('[sitemap] backend skipped:', err);
		}
	}

	// 3. Рендер XML
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `	<url>
		<loc>${siteUrl}${u.loc}</loc>${u.lastmod ? `\n		<lastmod>${u.lastmod}</lastmod>` : ''}${u.priority ? `\n		<priority>${u.priority}</priority>` : ''}
	</url>`,
	)
	.join('\n')}
</urlset>`;

	setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
	return xml;
});
