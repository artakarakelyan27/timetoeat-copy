#!/usr/bin/env node
/**
 * check-links.mjs — постгенерационная проверка целостности всех локальных ссылок
 * в .output/public.
 *
 * Что делает:
 *   1. Проходит все HTML-файлы в .output/public
 *   2. Извлекает все href=, src= с локальными путями (начинающимися с /)
 *   3. Для каждого пути проверяет: существует ли файл в .output/public,
 *      или это известный SPA-роут (/, /menu, /auth, /profile…), или это
 *      внешний URL который запасли как rel="nofollow"
 *   4. Печатает таблицу битых ссылок с указанием в какой странице найдены
 *   5. Возвращает exit code 1 если хотя бы одна битая → CI падает
 *
 * Запуск:
 *   node scripts/check-links.mjs
 *   node scripts/check-links.mjs --report-only   (для отчёта без exit 1)
 *
 * Принцип: соло-проект не может позволить себе битые ссылки даже временные —
 * пользователь, который видит «упс, не работает», теряет доверие. Лучше build
 * упадёт и автор сам поправит, чем выехать с битой выдачей.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';

const ROOT = resolve(process.cwd(), '.output/public');
const reportOnly = process.argv.includes('--report-only');

// Известные SPA-маршруты — их в .output не будет, но они валидные на проде.
// nginx-конфиг отдаёт их из dist/, не из seo/.output/public/.
const SPA_ROUTES = new Set([
	'/menu',
	'/auth',
	'/profile',
	'/lk',
	'/saved',
	'/recipes',
	'/recipes/create',
	'/prices',
	'/onboarding',
	'/share-target',
]);

// Префиксы для SPA — динамические подпути
const SPA_PREFIXES = ['/menu', '/auth', '/profile', '/lk', '/saved', '/recipes', '/prices', '/onboarding'];

// Сборка всех HTML-файлов
async function walk(dir) {
	const out = [];
	for (const name of await readdir(dir)) {
		const full = join(dir, name);
		const s = await stat(full);
		if (s.isDirectory()) {
			out.push(...(await walk(full)));
		} else if (name.endsWith('.html')) {
			out.push(full);
		}
	}
	return out;
}

// Парсер тегов href= и src= — простой regex, не идеально, но достаточно
const ATTR_RE = /(?:href|src)\s*=\s*["']([^"']+)["']/g;

function extractLinks(html) {
	const out = [];
	let m;
	while ((m = ATTR_RE.exec(html)) !== null) {
		out.push(m[1]);
	}
	return out;
}

function isLocal(url) {
	if (!url) return false;
	if (url.startsWith('//')) return false;
	if (url.startsWith('http://')) return false;
	if (url.startsWith('https://')) return false;
	if (url.startsWith('mailto:')) return false;
	if (url.startsWith('tel:')) return false;
	if (url.startsWith('javascript:')) return false;
	if (url.startsWith('data:')) return false;
	if (url.startsWith('#')) return false;
	return true;
}

function normalize(url) {
	const noHash = url.split('#')[0];
	const noQuery = noHash.split('?')[0];
	return noQuery;
}

// Существует ли путь как файл или как директория с index.html
async function exists(urlPath) {
	if (!urlPath || urlPath === '/') return true;
	const trimmed = urlPath.replace(/^\//, '');
	const direct = join(ROOT, trimmed);
	try {
		const s = await stat(direct);
		if (s.isFile()) return true;
		if (s.isDirectory()) {
			try {
				await stat(join(direct, 'index.html'));
				return true;
			} catch {
				/* fallthrough */
			}
		}
	} catch {
		/* fallthrough */
	}
	// Также пробуем как .html
	try {
		await stat(join(ROOT, `${trimmed}.html`));
		return true;
	} catch {
		return false;
	}
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
	console.log(`▸ Проверка ссылок в ${ROOT}\n`);
	let files;
	try {
		files = await walk(ROOT);
	} catch (err) {
		console.error(`✗ Не найдена директория ${ROOT}. Сначала запусти nuxt generate.`);
		process.exit(2);
	}

	console.log(`▸ Найдено ${files.length} HTML-файлов\n`);

	const broken = []; // [{ file, link, normalized }]
	let totalLocal = 0;

	for (const file of files) {
		const html = await readFile(file, 'utf8');
		const links = extractLinks(html);
		const local = links.filter(isLocal);
		totalLocal += local.length;

		for (const link of local) {
			const norm = normalize(link);
			if (!norm.startsWith('/')) continue; // относительные внутри одной странницы, не трогаем

			// Известный SPA-маршрут
			if (SPA_ROUTES.has(norm)) continue;
			// SPA-префиксы (например /menu/123 → /menu валидно)
			if (SPA_PREFIXES.some((p) => norm === p || norm.startsWith(p + '/'))) continue;
			// Динамические Nuxt-роуты, отдаваемые сервером
			if (norm.startsWith('/og/')) continue;
			if (norm === '/sitemap.xml') continue;
			if (norm.startsWith('/api/')) continue;

			const ok = await exists(norm);
			if (!ok) {
				broken.push({
					file: file.replace(ROOT, '').replace(/\\/g, '/'),
					link,
					normalized: norm,
				});
			}
		}
	}

	console.log(`▸ Всего локальных ссылок проверено: ${totalLocal}`);
	console.log(`▸ Битых: ${broken.length}\n`);

	if (broken.length === 0) {
		console.log('✓ Все ссылки валидны.');
		process.exit(0);
	}

	console.error('✗ Битые ссылки:\n');
	const byTarget = new Map();
	for (const b of broken) {
		if (!byTarget.has(b.normalized)) byTarget.set(b.normalized, []);
		byTarget.get(b.normalized).push(b.file);
	}

	for (const [target, sources] of byTarget) {
		console.error(`  ${target}`);
		for (const src of sources.slice(0, 5)) {
			console.error(`    ← ${src}`);
		}
		if (sources.length > 5) console.error(`    … и ещё в ${sources.length - 5} страницах`);
		console.error('');
	}

	console.error('\nПравь:');
	console.error('  — Yaml в seo/content/* (если ссылка из карточки замены/срока хранения/остатков)');
	console.error('  — vue-страницы в seo/pages/* (если ссылка в хедере/футере/хлебных крошках)');
	console.error('  — или удали страницу-источник, если она устарела.');
	console.error('После правок: rm -rf .nuxt .output && pnpm run generate && node scripts/check-links.mjs\n');

	process.exit(reportOnly ? 0 : 1);
}

main().catch((err) => {
	console.error('✗ Ошибка проверки:', err);
	process.exit(2);
});
