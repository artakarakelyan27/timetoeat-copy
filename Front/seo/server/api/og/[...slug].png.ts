/**
 * Программный генератор Open Graph картинок — S0.3
 *
 * Закрывает проблему отсутствия фотографий рецептов:
 *   • Шаблон 1200×630 с emoji + bg_color рецепта + название + время + КБЖУ
 *   • Брендовая плашка «Время Есть» с логотипом
 *   • Цвета строго из @plus-time/design-tokens
 *   • Шрифты Playfair Display (DM Sans fallback) — соответствует брендбуку
 *
 * Маршрут: GET /og/<тип>/<slug>.png
 * Примеры:
 *   /og/recepty/borsch.png
 *   /og/iz/kuritsa.png
 *   /og/spravochnik/zameny/yajco.png
 *   /og/default.png — лого-only вариант для главных хабов
 *
 * Логика:
 *   • На основе path получаем тип сущности и slug
 *   • Ходим в FastAPI /api/seo/og-data?type=<>&slug=<> за данными
 *   • Рендерим SVG через satori, конвертим в PNG через @resvg/resvg-js
 *   • Кешируем 24 часа (Cache-Control: public, max-age=86400, s-maxage=86400)
 *
 * Шрифты грузим из node_modules один раз при cold start.
 *
 * Замечание для прода: на heavy-нагрузке (>10 RPS) выноси генерацию в build-time
 * (nuxt generate + publicAssetsDir). Сейчас оставляем on-demand — для соло-проекта
 * проще и достаточно.
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { colors, brand } from '@plus-time/design-tokens';
import { mealVisual } from '@plus-time/design-tokens/meals';

// ─── Кеширование шрифтов в памяти процесса ──────────────────────────
let fontsCache: { name: string; data: Buffer; weight: 400 | 700 | 800; style: 'normal' }[] | null = null;

async function loadFonts() {
	if (fontsCache) return fontsCache;
	// Шрифты должны лежать в seo/assets/fonts/.
	// Скачать один раз:
	//   curl -L -o seo/assets/fonts/PlayfairDisplay-Bold.ttf \
	//     https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf
	const base = resolve(process.cwd(), 'assets/fonts');
	const [pf, dmRegular, dmBold] = await Promise.all([
		readFile(`${base}/PlayfairDisplay-Bold.ttf`),
		readFile(`${base}/DMSans-Regular.ttf`),
		readFile(`${base}/DMSans-Bold.ttf`),
	]);
	fontsCache = [
		{ name: 'Playfair Display', data: pf, weight: 800, style: 'normal' },
		{ name: 'DM Sans', data: dmRegular, weight: 400, style: 'normal' },
		{ name: 'DM Sans', data: dmBold, weight: 700, style: 'normal' },
	];
	return fontsCache;
}

// ─── Типы данных для OG ─────────────────────────────────────────────
interface OgData {
	kind: 'recipe' | 'ingredient' | 'menu' | 'reference' | 'hub' | 'default';
	title: string;
	emoji?: string;
	bgColor?: string;
	mealType?: string;
	timeMin?: number;
	kcal?: number;
	subtitle?: string;
}

// ─── JSX через объекты (satori принимает React-подобную структуру) ───
function template(d: OgData) {
	const bg = d.bgColor || (d.mealType ? mealVisual(d.mealType).bg : colors.gp);
	const fg = d.mealType ? mealVisual(d.mealType).fg : colors.t1;

	return {
		type: 'div',
		props: {
			style: {
				width: '1200px',
				height: '630px',
				display: 'flex',
				flexDirection: 'column',
				padding: '60px 80px',
				background: bg,
				fontFamily: 'DM Sans',
				color: fg,
				position: 'relative',
			},
			children: [
				// Верхний бренд-бар
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '14px',
							fontSize: '24px',
							fontWeight: 800,
							fontFamily: 'Playfair Display',
							color: colors.gd,
						},
						children: [
							// Логомарк
							{
								type: 'div',
								props: {
									style: {
										width: '40px',
										height: '40px',
										borderRadius: '8px',
										background: brand.gradient,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									},
									children: [
										{
											type: 'div',
											props: {
												style: {
													width: '24px',
													height: '24px',
													borderRadius: '50%',
													background: '#fff',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												},
												children: [
													{
														type: 'div',
														props: {
															style: { width: '8px', height: '8px', borderRadius: '50%', background: colors.g },
														},
													},
												],
											},
										},
									],
								},
							},
							{ type: 'span', props: { children: 'Время Есть' } },
						],
					},
				},

				// Основная зона — гигантский emoji + текст
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '50px',
							marginTop: '60px',
							flex: 1,
						},
						children: [
							// Emoji-плашка
							d.emoji
								? {
										type: 'div',
										props: {
											style: {
												width: '280px',
												height: '280px',
												borderRadius: '32px',
												background: '#fff',
												boxShadow: '0 16px 48px rgba(26,46,34,0.18)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: '180px',
												lineHeight: 1,
												flexShrink: 0,
											},
											children: [{ type: 'span', props: { children: d.emoji } }],
										},
									}
								: null,

							// Текстовый блок
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										flexDirection: 'column',
										gap: '20px',
										flex: 1,
									},
									children: [
										{
											type: 'div',
											props: {
												style: {
													fontSize: '56px',
													fontWeight: 800,
													fontFamily: 'Playfair Display',
													lineHeight: 1.15,
													color: colors.t1,
												},
												children: [{ type: 'span', props: { children: d.title } }],
											},
										},
										d.subtitle && {
											type: 'div',
											props: {
												style: {
													fontSize: '28px',
													fontWeight: 500,
													color: colors.t2,
												},
												children: [{ type: 'span', props: { children: d.subtitle } }],
											},
										},
									].filter(Boolean),
								},
							},
						].filter(Boolean),
					},
				},

				// Нижний бар — мета-цифры
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '32px',
							fontSize: '24px',
							fontWeight: 700,
							color: colors.gd,
							marginTop: '20px',
						},
						children: [
							d.timeMin
								? { type: 'div', props: { children: `⏱ ${d.timeMin} мин` } }
								: null,
							d.kcal
								? { type: 'div', props: { children: `🔥 ${d.kcal} ккал` } }
								: null,
							{
								type: 'div',
								props: {
									style: { marginLeft: 'auto', color: colors.t3, fontSize: '20px' },
									children: 'plus-time.ru',
								},
							},
						].filter(Boolean),
					},
				},
			],
		},
	};
}

// ─── Endpoint ────────────────────────────────────────────────────────
export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const slugParts = getRouterParam(event, 'slug') || 'default';
	// slug может быть «default» или «recepty/borsch»
	const segments = String(slugParts).replace(/\.png$/, '').split('/');

	// Распознавание типа сущности
	let kind: OgData['kind'] = 'default';
	let lookupSlug = '';
	if (segments[0] === 'recepty') {
		kind = 'recipe';
		lookupSlug = segments[1] || '';
	} else if (segments[0] === 'iz' || segments[0] === 'iz-ostatkov') {
		kind = 'ingredient';
		lookupSlug = segments[1] || '';
	} else if (segments[0] === 'menyu-na-nedelyu') {
		kind = 'menu';
		lookupSlug = segments[1] || '';
	} else if (segments[0] === 'spravochnik') {
		kind = 'reference';
		lookupSlug = segments.slice(1).join('/');
	} else if (
		segments[0] === 'chto-prigotovit' ||
		segments[0] === 'sezon' ||
		segments[0] === 'gotovim-vprok'
	) {
		kind = 'hub';
		lookupSlug = segments.slice(1).join('/');
	}

	// Тянем данные с бэка (FastAPI отвечает с эмодзи/цветом/КБЖУ)
	let data: OgData = {
		kind,
		title: 'Меню на неделю за 60 секунд',
		subtitle: 'plus-time.ru',
		emoji: '🍽️',
		bgColor: colors.gp,
	};

	if (kind !== 'default' && lookupSlug) {
		try {
			const fetched = await $fetch<OgData>(`${config.apiBase}/api/seo/og-data`, {
				query: { kind, slug: lookupSlug },
			});
			if (fetched) data = { ...data, ...fetched, kind };
		} catch (err) {
			// Если бэк не ответил — продолжаем с дефолтом, не падаем
			console.warn('[og] backend lookup failed', err);
		}
	}

	// Рендер
	const fonts = await loadFonts();
	const svg = await satori(template(data) as any, { width: 1200, height: 630, fonts });
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

	setHeader(event, 'Content-Type', 'image/png');
	setHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
	return png;
});
