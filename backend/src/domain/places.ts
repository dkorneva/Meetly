export const MOSCOW_CENTER = { latitude: 55.7558, longitude: 37.6176 };
const LABELS: Record<string, string> = {
  italian:"Итальянская", japanese:"Японская", russian:"Русская", coffee:"Кофе", coffee_shop:"Кофе", cafe:"Кофе", bar:"Бар", pub:"Бар",
  vegetarian:"Вегетарианская", vegan:"Веганская", european:"Европейская", mixed:"Смешанная", author:"Авторская", french:"Французская",
  georgian:"Грузинская", chinese:"Китайская", asian:"Азиатская", american:"Американская", seafood:"Морепродукты", fish:"Рыбная", meat:"Мясная",
  uzbek:"Узбекская", mediterranean:"Средиземноморская", indian:"Индийская", korean:"Корейская", turkish:"Турецкая", jewish:"Еврейская",
  mexican:"Мексиканская", serbian:"Сербская", oriental:"Восточная", spanish:"Испанская", burger:"Бургеры", international:"Международная",
  regional:"Региональная", thai:"Тайская", vietnamese:"Вьетнамская", armenian:"Армянская", greek:"Греческая", peruvian:"Перуанская",
  lebanese:"Ливанская", arab:"Арабская", azerbaijan:"Азербайджанская", belgian:"Бельгийская", breakfast:"Завтраки", brunch:"Бранчи",
  buryat:"Бурятская", czech:"Чешская", juice:"Соки", pasta:"Паста", pizza:"Пицца", ramen:"Рамен", salad:"Салаты", soup:"Супы",
  steak_house:"Стейки", sushi:"Суши", ukrainian:"Украинская",
};
export const CUISINES: Record<string, string[]> = {};
for (const [code, label] of Object.entries(LABELS)) (CUISINES[label] ??= []).push(code);
// Existing broad preferences remain compatible with saved meetings.
CUISINES["Итальянская"].push("pizza");
CUISINES["Японская"].push("sushi", "ramen");
CUISINES["Вегетарианская"].push("vegan");
/**
 * Возвращает русскую подпись кода кухни; неизвестный код сохраняется для доступности новых данных.
 * @param code Код кухни источника.
 */
export function cuisineName(code: string) { return LABELS[code] ?? code; }
/**
 * Разворачивает название кухни в коды, включая совместимые группы прежних предпочтений.
 * @param cuisine Название кухни или код из фильтра.
 */
export function cuisineCodes(cuisine: string) { return CUISINES[cuisine] ?? [cuisine.toLowerCase()]; }
/**
 * Проверяет точное совпадение токенов кухни с выбранным кодом или группой.
 * @param value Сохранённые коды кухонь либо значение заголовка.
 * @param cuisine Название кухни или код из фильтра.
 */
export function matchesCuisine(value: string, cuisine: string) {
  const codes = new Set(value.toLowerCase().split(/[;,\s]+/));
  return cuisineCodes(cuisine).some(code => codes.has(code));
}
/**
 * Формирует неповторяющиеся подписи кухонь для карточки заведения.
 * @param value Сохранённые коды кухонь либо значение заголовка.
 */
export function cuisineLabel(value: string) {
  return [...new Set(value.split(/[;,\s]+/).filter(Boolean).map(cuisineName))].join(", ");
}
