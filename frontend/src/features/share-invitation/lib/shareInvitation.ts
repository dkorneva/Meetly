import type { Meeting } from "../../../entities/meeting";
import { shareText } from "../../../shared/api/device";

// Формируем приглашение из данных встречи и открываем меню «Поделиться».
// Пользователь сам выбирает, кому и через какое приложение его отправить.
/**
 * Формирует текст приглашения из данных встречи и передаёт его системному меню отправки.
 *
 * @param meeting - Встреча, над которой выполняется операция.
 * @returns Результат операции; для обработчиков без результата — void.
 * @throws При ошибке системного API или восстановления данных возвращённый Promise отклоняется.
 */
export function shareInvitation(meeting: Meeting) {
  return shareText(
    `Приглашаю на встречу «${meeting.title}» в Meetly! ${meeting.date}, ${meeting.time}.`
  );
}
