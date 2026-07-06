/**
 * @plus-time/design-tokens
 *
 * JS-экспорты токенов для использования в:
 *  - satori (OG-генератор) — нужны hex-значения, не CSS-переменные
 *  - Tailwind / UnoCSS конфиги — если решишь подключить utility-CSS
 *  - test snapshots, Storybook, etc.
 *
 * Источник правды: tokens.css. При изменении — синхронизируй оба файла.
 */

export const colors = {
	// Text
	t1: '#1A2E22',
	t2: '#3A5445',
	t3: '#5C7A68',
	tDis: '#8AA898',

	// Green palette
	g: '#45AE6B',
	gd: '#1E6D38',
	gl: '#7FD4A0',
	gp: '#EBF8F1',
	gpp: '#C8EDD8',

	// Accent
	amb: '#D97706',
	ambp: '#FEF3C7',
	pur: '#7F77DD',
	purp: '#EEEDFE',
	coral: '#C94040',
	coralp: '#FDF0F0',
	blue: '#378ADD',
	bluep: '#E6F1FB',

	// Surfaces
	bg: '#F7FAF7',
	surf: '#FFFFFF',
	surf2: '#F0F5F1',

	// Borders (rgba для прозрачности)
	bdr: 'rgba(69, 174, 107, 0.15)',
	bdr2: 'rgba(69, 174, 107, 0.28)',
};

export const shadows = {
	sh1: '0 1px 4px rgba(26, 46, 34, 0.08), 0 4px 12px rgba(26, 46, 34, 0.05)',
	sh2: '0 4px 20px rgba(26, 46, 34, 0.10), 0 1px 4px rgba(26, 46, 34, 0.06)',
	sh3: '0 16px 48px rgba(26, 46, 34, 0.18)',
	logo: '0 2px 8px rgba(69, 174, 107, 0.35)',
	cta: '0 4px 14px rgba(69, 174, 107, 0.35)',
};

export const motion = {
	easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
	easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
};

export const layout = {
	touch: 44,
	topbarH: 56,
	navH: 60,
	filterH: 52,
};

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	xxxl: 32,
};

export const radius = {
	chip: 4,
	card: 15,
	pill: 22,
	logo: 10,
};

export const typography = {
	display: '"Playfair Display", Georgia, serif',
	text: '"DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
};

export const brand = {
	gradient: 'linear-gradient(140deg, #45AE6B, #1E6D38)',
	// Для satori, который не умеет linear-gradient через CSS — даём угол и стопы
	gradientStops: [
		{ color: '#45AE6B', offset: 0 },
		{ color: '#1E6D38', offset: 1 },
	],
	gradientAngle: 140,
};

// Цвета для приёмов пищи (раздел 09 брендбука)
export { meals } from './meals.js';
