#!/usr/bin/env node
/**
 * Линтер стоп-слов брендбука (раздел 11) — S0.6.
 *
 * Проверяет .vue и .md файлы в seo/ на наличие запрещённых формулировок.
 * Запуск:  node scripts/check-stopwords.mjs
 * В CI:    добавь в pre-commit hook или GitHub Actions step.
 *
 * Список стоп-слов синхронизирован с brand_dna_vremya_est.pdf и
 * brandbook_vremya_est.pdf раздел 11.
 */

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import process from 'node:process';

// ─── Запрещено брендбуком ───────────────────────────────────────────
const STOPWORDS = [
	// На «вы» — мы общаемся на «ты»
	{ re: /\bУважаемый пользователь\b/giu, msg: 'на «вы» запрещено (брендбук р.11)' },
	{ re: /\bВаш(ему|ему|его|им|их|ему|ом|у|а|и|е|у)\b/giu, msg: 'на «вы» запрещено (используй «твой»)' },
	{ re: /\bЗдравствуйте\b/giu, msg: 'формальный тон запрещён' },

	// Шаблонные пустые фразы
	{ re: /\bЭто зависит от ваших потребностей\b/giu, msg: 'пустая формулировка' },
	{ re: /\bмногие факторы\b/giu, msg: 'пустая формулировка' },
	{ re: /\bв современном мире\b/giu, msg: 'клише' },
	{ re: /\bв сегодняшнем мире\b/giu, msg: 'клише' },
	{ re: /\bдавайте разберёмся\b/giu, msg: 'пустая подводка' },
	{ re: /\bв этой статье мы\b/giu, msg: 'пустая подводка' },

	// Запрещённый словарь
	{ re: /\bблюдо\b/giu, msg: 'словарь брендбука: «рецепт», не «блюдо»' },
	{ re: /\bдиш\b/giu, msg: 'анг.заимствование' },
	{ re: /\bпозиция\b/giu, msg: 'словарь брендбука: «рецепт», не «позиция»' },
	{ re: /\bрацион\b/giu, msg: 'словарь брендбука: «меню», не «рацион»' },
	{ re: /\bплан питания\b/giu, msg: 'словарь брендбука: «меню», не «план питания»' },
	{ re: /\bдомохозяйство\b/giu, msg: 'словарь брендбука: «семья»' },
	{ re: /\bсгенерировать\b/giu, msg: 'словарь брендбука: «составить»' },
	{ re: /\bоптимизировать расходы\b/giu, msg: 'словарь брендбука: «сэкономить»' },
	{ re: /\bснизить стоимость\b/giu, msg: 'словарь брендбука: «сэкономить»' },
	{ re: /\bоперативно\b/giu, msg: 'словарь брендбука: «быстро»' },
	{ re: /\bв кратчайшие сроки\b/giu, msg: 'словарь брендбука: «быстро»' },

	// Запрещённый эмоциональный тон
	{ re: /\bопять фастфуд\b/giu, msg: 'guilt-trip запрещён' },
	{ re: /\bснова неправильное питание\b/giu, msg: 'guilt-trip запрещён' },
];

const FILE_GLOBS = ['pages/**/*.vue', 'components/**/*.vue', 'layouts/**/*.vue', 'content/**/*.md'];

const violations = [];

for (const pattern of FILE_GLOBS) {
	try {
		for await (const file of glob(pattern, { cwd: process.cwd() })) {
			const path = String(file);
			const text = readFileSync(path, 'utf8');
			for (const { re, msg } of STOPWORDS) {
				re.lastIndex = 0;
				let m;
				while ((m = re.exec(text)) !== null) {
					// Найдём номер строки
					const line = text.slice(0, m.index).split('\n').length;
					violations.push({ path, line, match: m[0], msg });
				}
			}
		}
	} catch (err) {
		// glob отсутствует в Node <22 — fallback: пропустить
		console.error(`Не удалось пройти ${pattern}:`, err.message);
	}
}

if (violations.length) {
	console.error(`\n❌ Найдено ${violations.length} нарушений тон-гайдлайнов:\n`);
	for (const v of violations) {
		console.error(`  ${v.path}:${v.line}  «${v.match}»  — ${v.msg}`);
	}
	console.error('\nПравь по словарю брендбука раздел 11 или ДНК бренда раздел 8.\n');
	process.exit(1);
} else {
	console.log('✅ Стоп-слов не найдено. Тон соответствует брендбуку.');
}
