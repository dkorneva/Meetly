/**
 * Экранирует специальные символы текстовых полей.
 */
const escapeText = (s: string) =>
  s
    .replace(/\\/g, "\\\\") // экранирование обратного слеша
    .replace(/\r?\n/g, "\\n") // экранирование переноса строки
    .replace(/;/g, "\\;") // экранирование точки с запятой
    .replace(/,/g, "\\,"); // экранирование запятой
/**
 * Форматирует дату UTC в представление календаря YYYYMMDDTHHmmssZ.
 */
const utc = (d: Date) =>
  d
    .toISOString() // преобразование даты в строку ISO
    .replace(/[-:]/g, "") // удаление дефисов и двоеточий
    .replace(/\.\d{3}/, ""); // удаление миллисекунд
/** RFC 5545: CRLF и переносы длинных строк по октетам, без разрыва UTF-8 символа. */
function fold(line: string) {
  const lines: string[] = [];
  let current = "";
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > 75) {
      lines.push(current);
      current = " ";
    }
    current += char;
  }
  lines.push(current);
  return lines.join("\r\n");
}
/**
 * Формирует событие ICS длительностью два часа с экранированием текста и корректными переносами UTF-8.
 * @param meeting Встреча, для которой выполняется действие.
 * @param location Название и адрес места календарного события.
 * @param now Момент формирования события; задаётся явно для воспроизводимых проверок.
 * @returns Календарь с одним VEVENT и окончаниями строк CRLF.
 */
export function calendarEvent(
  meeting: { id: string; title: string; startsAt: Date; version: number },
  location: string,
  now = new Date(),
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meetly//Meetings//RU",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${meeting.id}@meetly`,
    `DTSTAMP:${utc(now)}`,
    `SEQUENCE:${meeting.version}`,
    `DTSTART:${utc(meeting.startsAt)}`,
    `DTEND:${utc(new Date(meeting.startsAt.getTime() + 2 * 3600000))}`,
    `SUMMARY:${escapeText(meeting.title)}`,
    `LOCATION:${escapeText(location)}`,
    "DESCRIPTION:Встреча в Meetly. Продолжительность по умолчанию 2 часа.",
  ];
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
