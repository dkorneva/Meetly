import type { Meeting } from "../../../entities/meeting";
import { validateParticipant } from "../../../shared/lib/participants";
export { validateParticipant } from "../../../shared/lib/participants";

export const cuisineOptions = ["Итальянская", "Японская", "Русская", "Кофе", "Бар", "Вегетарианская"];
export const districtOptions = ["Центр", "Арбат", "Тверской", "Патриаршие", "Не важно"];
export const formatOptions = ["В помещении", "На улице", "Не важно"];

type FormValues = Pick<Meeting, "title" | "date" | "time" | "participants" | "budget" | "cuisines" | "district" | "format">;

/**
 * Проверяет поля перед сохранением встречи, разрешая прежнее время редактируемой встречи.
 * @param values - Значения полей формы.
 * @param original - Исходная встреча при редактировании.
 * @param now - Текущий момент по местному времени; передаётся явно в тестах.
 * @returns Первая ошибка или пустая строка, если форма корректна.
 */
export function validateMeetingForm(values: FormValues, original?: Meeting, now = new Date()) {
  const title = values.title.trim();
  if (!title) return "Введите название встречи";
  if (Array.from(title).length < 2 || Array.from(title).length > 100)
    return "Название должно содержать от 2 до 100 символов";
  if (/[\p{Cc}\p{Zl}\p{Zp}]/u.test(values.title) || !/[\p{L}\p{N}]/u.test(title))
    return "Название должно содержать букву или цифру, без переносов строк и управляющих символов";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time))
    return "Выберите корректные дату и время";
  const [year, month, day] = values.date.split("-").map(Number);
  const [hour, minute] = values.time.split(":").map(Number);
  const scheduled = new Date(year, month - 1, day, hour, minute);
  if (scheduled.getFullYear() !== year || scheduled.getMonth() !== month - 1 || scheduled.getDate() !== day ||
      scheduled.getHours() !== hour || scheduled.getMinutes() !== minute)
    return "Выберите корректные дату и время";
  const unchanged = original?.date === values.date && original.time === values.time;
  if (!unchanged && scheduled.getTime() <= now.getTime())
    return "Дата и время встречи должны быть позже текущего момента";

  for (let index = 0; index < values.participants.length; index++) {
    const error = validateParticipant(values.participants[index], values.participants.slice(0, index));
    if (error) return error;
  }
  if (!Number.isFinite(values.budget) || !Number.isInteger(values.budget) ||
      values.budget < 500 || values.budget > 5000 || values.budget % 100 !== 0)
    return "Бюджет должен быть от 500 до 5000 ₽ с шагом 100 ₽";
  if (values.cuisines.some((item) => !cuisineOptions.includes(item)) ||
      new Set(values.cuisines).size !== values.cuisines.length)
    return "Выберите кухни из списка без повторов";
  if (!districtOptions.includes(values.district)) return "Выберите район из списка";
  if (!formatOptions.includes(values.format)) return "Выберите формат встречи из списка";
  return "";
}
