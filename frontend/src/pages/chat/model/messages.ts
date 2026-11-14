import type { Message } from "../../../entities/meeting";

/** Возвращает день сообщения для группировки. */
export function messageDay(message?: Message) {
  return message?.createdAt ? new Date(message.createdAt).toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" }) : "";
}

/** Проверяет продолжение группы сообщений одного автора. */
export function continuesGroup(previous: Message | undefined, current: Message) {
  return !!previous && !previous.kind && !current.kind && messageDay(previous) === messageDay(current)
    && (previous.senderId && current.senderId ? previous.senderId === current.senderId
      : previous.name === current.name && !!previous.mine === !!current.mine);
}

/** Форматирует подпись дня переписки. */
export function dayLabel(message: Message) {
  if (!message.createdAt) return "";
  const day = messageDay(message);
  const now = new Date();
  if (day === messageDay({ ...message, createdAt: now.toISOString() })) return "Сегодня";
  now.setDate(now.getDate() - 1);
  if (day === messageDay({ ...message, createdAt: now.toISOString() })) return "Вчера";
  return new Date(message.createdAt).toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "long", year: "numeric" });
}
