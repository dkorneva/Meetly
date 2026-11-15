/** Чистые правила предметной области: не зависят от HTTP-сервера и базы данных */
export class RuleViolation extends Error {}
/**
 * Запрещает изменение голосования после выбора места
 * @param status Текущий статус встречи
 */
export function requireVoting(status: string) {
  if (status !== "voting") throw new RuleViolation("Голосование завершено");
}
/**
 * Возвращает ID единственного лидера голосования; отклоняет пустое голосование и ничью
 * @param votes Голоса участников, учитываемые при выборе лидера
 * @throws RuleViolation, если голосов нет или несколько заведений делят первое место
 * @returns ID единственного заведения с максимальным числом голосов
 */
export function chooseWinner(votes: { restaurantId: string }[]): string {
  if (!votes.length)
    throw new RuleViolation("Сначала участники должны проголосовать");
  const counts = new Map<string, number>();
  for (const vote of votes)
    counts.set(vote.restaurantId, (counts.get(vote.restaurantId) ?? 0) + 1);
  const ordered = [...counts].sort((a, b) => b[1] - a[1]);
  if (ordered.length > 1 && ordered[0][1] === ordered[1][1]) // проверка ничьей - голоса получили хотя бы 2 разных заведения и количество голосов у первого и второго одинаковое
    throw new RuleViolation("Ничья: участникам нужно изменить голоса");
  return ordered[0][0];
}
/**
 * Проверяет календарную дату и время и преобразует московское время в UTC независимо от часового пояса процесса
 * @param date Дата YYYY-MM-DD
 * @param time Время HH:mm по Москве
 * @throws RuleViolation для несуществующей даты или некорректного времени
 * @returns Проверенный момент времени Date
 */
export function meetingInstant(date: string, time: string): Date {
  const result = new Date(`${date}T${time}:00+03:00`); // дата с указанием московского времени
  if (
    // проверка, что после преобразования получились те же дата и время, которые ввёл пользователь
    !Number.isFinite(result.getTime()) ||
    new Date(result.getTime() + 10800000).toISOString().slice(0, 16) !==
      `${date}T${time}`
  )
    throw new RuleViolation("Некорректная дата или время");
  return result;
}
