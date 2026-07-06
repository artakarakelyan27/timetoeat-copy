/**
 * Серверный загрузчик YAML-контента (только server-side, в момент SSG).
 *
 * Используется в:
 *   - composables/useReferenceData.ts (через server route)
 *   - pages/spravochnik/zameny/[slug].vue (через useAsyncData + $fetch к /api/_content/*)
 *
 * Зачем сделано через server route, а не прямой fs.readFile в page.vue:
 *   • Nuxt запрещает Node API в client-bundle
 *   • Через server route — есть кеш в Nitro, есть управление 404
 *   • Тип данных — единый shared interface
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const CACHE = new Map<string, any>();

export async function loadYaml<T = any>(relPath: string): Promise<T> {
	if (CACHE.has(relPath)) return CACHE.get(relPath);
	const full = resolve(process.cwd(), 'content', relPath);
	const text = await readFile(full, 'utf8');
	const parsed = parse(text) as T;
	// Кешируем только в проде (в dev — каждый раз свежо для удобства)
	if (process.env.NODE_ENV === 'production') CACHE.set(relPath, parsed);
	return parsed;
}
