/**
 * Возвращает текущее местное время устройства в формате часов и минут.
 *
 * @returns Результат операции; для обработчиков без результата — void.
 */
export function timeNow() {
  return new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
