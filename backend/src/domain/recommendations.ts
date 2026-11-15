import { matchesCuisine } from "./places";
type Preference = { budget: number; cuisines: string[] };
/**
 * Даёт каждому участнику один балл за подходящую кухню и один за чек в пределах бюджета
 * @param place Коды кухонь, средний чек и наличие открытой площадки
 * @param preferences Бюджет и кухни каждого участника; пустой список кухонь означает отсутствие ограничений
 * @param format Для «На улице» обязательна подтверждённая открытая площадка
 * @returns Сумма баллов либо -1 для неподходящего формата
 */
export function recommendationScore(
  place: { cuisine: string; price: number; outdoor: boolean },
  preferences: Preference[],
  format: string,
) {
  if (format === "На улице" && !place.outdoor) return -1;
  let score = 0;
  for (const p of preferences) {
    if (
      !p.cuisines.length ||
      p.cuisines.some((c) => matchesCuisine(place.cuisine, c))
    )
      score += 1;
    if (place.price <= p.budget) score += 1;
  }
  return score;
}
