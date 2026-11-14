import type { Meeting, Message, Restaurant } from "../model/models";

export type MapFilters = { budget: string; cuisine: string[]; openNow?: boolean; q?: string };

// Возвращает количество с правильным окончанием: «1 участник», «2 участника», «5 участников».

/**
 * Возвращает число участников с подходящим русским окончанием, включая исключения 11–14.
 *
 * @param count - Количество участников.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function participantLabel(count: number) {
  const last = count % 10; // Последняя цифра: например, у 21 это 1.
  const teens = count % 100; // Последние две цифры: нужны для исключений 11–14, 111–114 и т. д.
  return `${count} ${
    teens >= 11 && teens <= 14
      ? "участников"
      : last === 1
        ? "участник"
        : last >= 2 && last <= 4
          ? "участника"
          : "участников"
  }`;
}

// Превращает дату вида «2024-05-24» в название дня недели: «Пятница».

/**
 * Преобразует дату YYYY-MM-DD в русское название дня недели с заглавной буквы.
 *
 * @param date - Дата встречи в формате YYYY-MM-DD.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function meetingDate(date: string) {
  // Добавляем местное время 12:00, чтобы строка разбиралась как местная дата, а не как полночь UTC.
  const value = new Date(date + "T12:00:00").toLocaleDateString("ru-RU", {
    weekday: "long",
  });
  return value[0].toUpperCase() + value.slice(1); // Первую букву делаем заглавной, остальную строку сохраняем.
}

// Возвращает ресторан с наибольшим числом голосов в этой встрече.

/**
 * Возвращает ресторан с наибольшим числом голосов; при равенстве сохраняет порядок предложенных мест; окончательный выбор проверяет сервер.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getLeader(meeting: Meeting): Restaurant | undefined {
  // Сортируем копию вариантов встречи по убыванию голосов.
  return [...(meeting.candidates ?? [])].sort(
    (a, b) => voteCount(meeting, b.id) - voteCount(meeting, a.id),
  )[0];
}

// id — ID ресторана. В votes ключи — имена участников, значения — ID выбранных ресторанов.

/**
 * Считает голоса, отданные за ресторан с указанным идентификатором.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @param id - Идентификатор обрабатываемого объекта.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function voteCount(meeting: Meeting, id: string) {
  // Получаем все значения голосов, оставляем совпавшие с id и считаем их количество.
  return Object.values(meeting.votes).filter((v) => v === id).length;
}

// Общее число реакций: реакции других людей плюс одна, если текущий пользователь поставил свою.

/**
 * Суммирует реакции других участников и реакцию текущего пользователя.
 *
 * @param message - Сообщение для обработки.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function reactionCount(message: Message) {
  // Если otherLikes отсутствует, считаем его равным нулю.
  return (message.otherLikes ?? 0) + (message.liked ? 1 : 0);
}

// Возвращает выбранный ресторан встречи. Если он не найден или ещё не выбран — текущего лидера голосования.

/**
 * Возвращает выбранный ресторан или текущего лидера, если ресторан не задан или не найден.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function meetingPlace(meeting: Meeting): Restaurant | undefined {
  return (
    (meeting.candidates ?? []).find((r) => r.id === meeting.restaurantId) ??
    getLeader(meeting)
  );
}
