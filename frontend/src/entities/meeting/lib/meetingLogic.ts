import { restaurants } from "../model/demo";
import type { Meeting,Message,Restaurant } from "../model/models";

export type MapFilters = { budget: string; cuisine: string; distance: string };

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
 * Возвращает ресторан с наибольшим числом голосов; при равенстве сохраняет порядок демонстрационного каталога.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getLeader(meeting: Meeting): Restaurant {
  // sort меняет массив, поэтому сначала создаём копию каталога через [...restaurants].
  // Разность голосов сортирует по убыванию; [0] берёт первый ресторан.
  // При равенстве голосов сохраняется порядок каталога, в том числе когда голосов нет.
  return [...restaurants].sort(
    (a, b) => voteCount(meeting, b.id) - voteCount(meeting, a.id)
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

// Возвращает рестораны, подходящие одновременно под фильтры карты и поисковую строку.

/**
 * Отбирает рестораны одновременно по бюджету, кухне, расстоянию и поисковой строке.
 *
 * @param filters - Ограничения бюджета, кухни и расстояния; «Все» отключает ограничение.
 * @param query - Текст поиска по названию ресторана и кухне, без учёта регистра.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function filterRestaurants(filters: MapFilters, query = "") {
  // match находит число в надписи, например «До 1500 ₽» → «1500», Number превращает его в число.
  // ?. безопасно обращается к результату поиска; ?? Infinity убирает ограничение, если числа нет («Все»).
  const maxBudget = Number(filters.budget.match(/\d+/)?.[0] ?? Infinity);
  const maxDistance = Number(filters.distance.match(/\d+/)?.[0] ?? Infinity);
  // filter создаёт новый массив. && требует выполнения всех условий ниже.
  return restaurants.filter(
    (r) =>
      r.price <= maxBudget && // Средний чек не превышает выбранный бюджет.
      // Расстояние хранится строкой: заменяем десятичную запятую точкой и переводим в число.
      Number(r.distance.replace(",", ".")) <= maxDistance &&
      // «Все» пропускает любую кухню, иначе ищем выбранную кухню в описании ресторана.
      (filters.cuisine === "Все" || r.cuisine.includes(filters.cuisine)) &&
      // Ищем текст в названии и кухне без учёта регистра. Пустой query подходит к любой строке.
      (r.name + " " + r.cuisine).toLowerCase().includes(query.toLowerCase())
  );
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

// Возвращает копию сообщения с переключённой реакцией пользователя: true <-> false.
// Исходный объект не меняется; обновлённое сообщение затем записывает в состояние контроллер.

/**
 * Создаёт копию сообщения с переключённой реакцией пользователя, не меняя исходное сообщение.
 *
 * @param message - Сообщение для обработки.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function toggleReaction(message: Message): Message {
  return { ...message, liked: !message.liked };
}

// Возвращает выбранный ресторан встречи. Если он не найден или ещё не выбран — текущего лидера голосования.

/**
 * Возвращает выбранный ресторан или текущего лидера, если ресторан не задан или не найден.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function meetingPlace(meeting: Meeting): Restaurant {
  return (
    restaurants.find((r) => r.id === meeting.restaurantId) ?? getLeader(meeting)
  );
}

// Возвращает встречу с подтверждённой бронью. В текущем приложении подтверждение сразу завершает встречу.
// now — время подтверждения в формате ISO; по умолчанию текущее, но можно передать явно.

/**
 * Возвращает копию встречи с подтверждённой локальной бронью и статусом completed; завершённую встречу не меняет.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @param restaurantId - Идентификатор выбранного ресторана.
 * @param now - Время подтверждения в формате ISO; по умолчанию текущее.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function confirmBooking(
  meeting: Meeting,
  restaurantId: string,
  now = new Date().toISOString()
): Meeting {
  if (meeting.status === "completed") return meeting; // Повторное подтверждение ничего не меняет.
  return {
    ...meeting, // Создаём новый объект, сохраняя остальные поля встречи.
    restaurantId,
    status: "completed",
    completedAt: now,
    bookedAt: meeting.bookedAt ?? now, // Существующее время бронирования не перезаписываем.
  };
}

// Отменяет бронь у завершённой или забронированной встречи; остальные статусы не меняет.

/**
 * Очищает даты брони и завершения и возвращает selected или voting; другие статусы не меняет.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function cancelBooking(meeting: Meeting): Meeting {
  if (meeting.status !== "completed" && meeting.status !== "booked")
    return meeting;
  return {
    ...meeting,
    // Если ресторан выбран, оставляем статус «место выбрано»; иначе возвращаем голосование.
    // Поэтому отмена брони не обязательно снова разрешает голосовать.
    status: meeting.restaurantId ? "selected" : "voting",
    // Очищаем даты брони и завершения. restaurantId при этом сохраняется из ...meeting.
    bookedAt: undefined,
    completedAt: undefined,
  };
}
