const namePattern = /^[A-Za-zА-Яа-яЁё-](?:[A-Za-zА-Яа-яЁё -]*[A-Za-zА-Яа-яЁё-])?$/;

/**
 * Проверяет имя участника и исключает повторы без учёта регистра.
 * @param name - Введённое имя без автоматического удаления пробелов.
 * @param participants - Уже добавленные имена.
 * @returns Текст ошибки или пустая строка.
 */
export function validateParticipant(name: string, participants: string[] = []) {
  if (!name) return "Введите имя участника";
  if (name.length < 2 || name.length > 30) return "Имя должно содержать от 2 до 30 символов";
  if (!namePattern.test(name)) return "Допустимы буквы, пробел и дефис; пробелы по краям запрещены";
  if (participants.some((item) => item.toLowerCase() === name.toLowerCase()))
    return "Этот участник уже добавлен";
  return "";
}
