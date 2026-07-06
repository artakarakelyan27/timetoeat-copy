/**
 * Цветовая система приёмов пищи — раздел 09 брендбука.
 * Используется в карточках меню, OG-картинках по типу блюда, фильтрах.
 */
export const meals = {
	breakfast: {
		bg: '#FEF3C7',
		fg: '#633806',
		dot: '#D97706',
		label: 'Завтрак',
		emojiHint: '☀️',
	},
	lunch: {
		bg: '#EBF8F1',
		fg: '#085041',
		dot: '#1D9E75',
		label: 'Обед',
		emojiHint: '🍲',
	},
	dinner: {
		bg: '#EEEDFE',
		fg: '#3C3489',
		dot: '#7F77DD',
		label: 'Ужин',
		emojiHint: '🍽️',
	},
	snack: {
		bg: '#E6F1FB',
		fg: '#0C447C',
		dot: '#378ADD',
		label: 'Перекус',
		emojiHint: '🍎',
	},
};

/**
 * Маппер meal_type из БД (как в app/models/recipe.py) → визуал.
 * Принимает любое строковое значение, возвращает defaultMeal для неизвестных.
 */
export function mealVisual(mealType) {
	const normalized = (mealType || '').toLowerCase().trim();
	switch (normalized) {
		case 'завтрак':
		case 'breakfast':
			return meals.breakfast;
		case 'обед':
		case 'lunch':
			return meals.lunch;
		case 'ужин':
		case 'dinner':
			return meals.dinner;
		case 'перекус':
		case 'snack':
			return meals.snack;
		default:
			return meals.lunch; // нейтральный зелёный — самый «съедобный»
	}
}
