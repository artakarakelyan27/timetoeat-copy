// seo/nuxt.config.ts
//
// Минимальный конфиг под стабильный Nuxt 3.13.x.
// • SSG (nuxt generate) — все страницы пререндерятся, отдаются nginx как статика.
// • OG-картинки — server route /og/* (динамика, на ходу).
// • Sitemap — собственный server route /sitemap.xml (без модуля, чтоб не ловить
//   несовместимости версий).
// • Schema.org — через JSON-LD в страницах (без модуля).

export default defineNuxtConfig({
	srcDir: '.',
	compatibilityDate: '2024-09-01',
	devtools: { enabled: true },

	app: {
		head: {
			htmlAttrs: { lang: 'ru' },
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
				{ name: 'theme-color', content: '#45AE6B' },
				{ name: 'format-detection', content: 'telephone=no' },
			],
			link: [
				{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
				{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
				{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
				{
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,800&family=DM+Sans:wght@400;500;600;700&display=swap',
				},
			],
		},
	},

	css: [
		'@plus-time/design-tokens/css',
		'~/assets/css/base.css',
	],

	// модули не нужны — sitemap и robots делаем руками
	modules: [],

	runtimeConfig: {
		apiBase: process.env.API_BASE || '',
		public: {
			siteUrl: process.env.SITE_URL || 'https://timetoeat.tw1.ru',
			ymCounter: process.env.YM_COUNTER || '',
		},
	},

	hooks: {
		// Динамически добавляем маршруты из локальных yaml в pre-render.
		async 'nitro:config'(nitroConfig) {
			if (!nitroConfig.prerender) nitroConfig.prerender = {};
			const routes = new Set<string>(nitroConfig.prerender.routes || []);

			try {
				const { readFile } = await import('node:fs/promises');
				const { parse } = await import('yaml');
				const { resolve } = await import('node:path');

				for (const [file, prefix] of [
					['content/reference/zameny.yaml', '/spravochnik/zameny'],
					['content/reference/srok-khraneniya.yaml', '/spravochnik/srok-khraneniya'],
					['content/iz-ostatkov.yaml', '/iz-ostatkov'],
				] as const) {
					try {
						const text = await readFile(resolve(file), 'utf8');
						const items: any[] = parse(text);
						for (const it of items || []) {
							if (it?.slug) routes.add(`${prefix}/${it.slug}`);
						}
					} catch {
						// yaml ещё не лежит — нормально
					}
				}
			} catch (err) {
				console.warn('[prerender] yaml lookup failed', err);
			}

			// Динамика из бэка — только если API_BASE задан.
			// ВАЖНО: в этом хуке $fetch ещё не определён (Nuxt не инициализирован).
			// Используем нативный fetch из Node 18+.
			const apiBase = process.env.API_BASE;
			if (apiBase) {
				const fetchJson = async (url: string) => {
					try {
						const r = await fetch(url);
						if (!r.ok) return [];
						return (await r.json()) as any[];
					} catch {
						return [];
					}
				};

				try {
					const recipes = await fetchJson(`${apiBase}/api/seo/sitemap?type=recipes`);
					for (const r of recipes || []) if (r?.slug) routes.add(`/recepty/${r.slug}`);
					console.log(`[prerender] подтянуто ${recipes.length} рецептов с бэка`);

					const ings = await fetchJson(`${apiBase}/api/seo/sitemap?type=ingredients`);
					for (const i of ings || []) if (i?.slug) routes.add(`/iz/${i.slug}`);
					console.log(`[prerender] подтянуто ${ings.length} ингредиентов с бэка`);
				} catch (err) {
					console.warn('[prerender] backend lookup failed', err);
				}
			} else {
				console.log('[prerender] API_BASE не задан — рецепты из БД не префендерим');
			}

			// Локальные меню-лендинги (S1.7) — из yaml
			try {
				const { readdir, readFile } = await import('node:fs/promises');
				const { resolve } = await import('node:path');
				const { parse } = await import('yaml');

				const menyuDir = resolve('content/menyu');
				const files = await readdir(menyuDir).catch(() => []);
				for (const f of files) {
					if (f.endsWith('.yaml')) {
						const slug = f.replace('.yaml', '');
						routes.add(`/menyu-na-nedelyu/${slug}`);
					}
				}

				// /iz/[ingredient] — все slug'и из всех yaml-карточек справочника + остатков
				const izSlugs = new Set<string>();
				for (const file of [
					'content/reference/zameny.yaml',
					'content/reference/srok-khraneniya.yaml',
					'content/iz-ostatkov.yaml',
				]) {
					try {
						const text = await readFile(resolve(file), 'utf8');
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
				for (const s of izSlugs) routes.add(`/iz/${s}`);
			} catch (err) {
				console.warn('[prerender] menyu/iz lookup failed', err);
			}

			nitroConfig.prerender.routes = Array.from(routes);
		},
	},

	nitro: {
		prerender: {
			crawlLinks: true,
			failOnError: false,
			ignore: [
				// исключаем потенциально проблемные роуты, которые могут уйти в 500
				'/api/_content',
				'/og',
				// SPA-роуты — обслуживаются Vue приложением, не Nuxt.
				// crawler не должен пытаться их пререндерить.
				'/onboarding',
				'/menu',
				'/auth',
				'/profile',
				'/saved',
				'/recipes',
				'/prices',
				'/lk',
				'/share-target',
			],
			routes: [
				'/',
				'/o-proekte',
				'/recepty',
				'/chto-prigotovit',
				'/chto-prigotovit/iz-togo-chto-est',
				'/menyu-na-nedelyu',
				'/spravochnik',
				'/iz-ostatkov',
				'/blog',
				'/robots.txt',
				'/sitemap.xml',
			],
		},
	},

	typescript: {
		strict: false,
		shim: false,
	},
});
