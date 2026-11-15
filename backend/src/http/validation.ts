import isEmail from "validator/lib/isEmail";
import isUUID from "validator/lib/isUUID";
import { BadRequestError } from "./errors";
import { ProfileInput } from "../application/users.service";
import { PlaceFilters } from "../application/discovery.service";

/** Проверки выполняются обычными функциями до обращения к сервисам и БД */
function invalid(field: string): never {
  throw new BadRequestError("Некорректное поле: " + field);
}

// проверяется, что значение является объектом с разрешёнными полями
function fields(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestError("Ожидается объект с параметрами");
  }
  // проверяется, что в объекте нет неизвестных полей
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new BadRequestError("Неизвестное поле: " + key);
  }
  return value as Record<string, unknown>;
}

// проверка строки - передана ли строка, не слишком ли она короткая или длинная
function text(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string" || [...value].length < min || [...value].length > max) invalid(field);
  return value;
}

// проверяется число в заданном диапазоне, отклоняется NaN и бесконечность
function number(value: unknown, field: string, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) invalid(field);
  if (integer && !Number.isInteger(value)) invalid(field);
  return value;
}

// проверяется, что значение является булевым
function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") invalid(field);
  return value;
}

// проверяется, что значение является корректным адресом электронной почты
function email(value: unknown): string {
  const result = text(value, "email", 1, 254); // проверка длины
  if (!isEmail(result)) invalid("email"); // проверка формата email
  return result;
}

// проверяется, что значение является корректным UUID
export function uuid(value: unknown, field = "id"): string { // если имя поля не указано, в сообщении об ошибке используется "id"
  if (typeof value !== "string" || !isUUID(value)) invalid(field);
  return value;
}

// проверка списка кухонь
// проверяется, что переданное значение массив
// массив не более чем из 100 элементов 
// каждый элемент массива проверяется как строка длиной от 1 до 80 символов
// проверяется, что в массиве нет дубликатов 
// проверяется, что размер списка после преобразования в JSON-строку не превышает 2000 символов
function cuisines(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100) invalid("cuisines");
  const result = value.map(item => text(item, "cuisines", 1, 80));
  if (new Set(result).size !== result.length || JSON.stringify(result).length > 2000) invalid("cuisines");
  return result;
}

// проверка бюджета участника
// это должно быть целое число
// от 500 до 100 000
// кратное 100
function budget(value: unknown): number {
  const result = number(value, "budget", 500, 100000, true);
  if (result % 100 !== 0) invalid("budget");
  return result;
}

// проверка данных для входа
// проверяется, что переданное значение содержит поля email и password
// проверяется, что email является корректным адресом электронной почты
// проверяется, что пароль является строкой длиной от 1 до 128 символов
export function login(value: unknown) {
  const data = fields(value, ["email", "password"]);
  return { email: email(data.email), password: text(data.password, "password", 1, 128) };
}

// проверка данных для регистрации
// проверяется, что переданное значение содержит поля name, email и password
// проверяется, что имя является строкой длиной от 2 до 30 символов, начинается и заканчивается буквой, внутри содержит буквы, пробелы или дефисы
// проверяется, что email является корректным адресом электронной почты
// проверяется, что пароль является строкой длиной от 8 до 128 символов, содержит маленькую и большую латинские буквы, цифру и специальный символ
export function registration(value: unknown) {
  const data = fields(value, ["name", "email", "password"]);
  const name = text(data.name, "name", 2, 30);
  if (!/^[\p{L}][\p{L} -]{0,28}[\p{L}]$/u.test(name)) invalid("name");
  const password = text(data.password, "password", 8, 128);
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/.test(password)) invalid("password");
  return { name, email: email(data.email), password };
}

// проверка данных для обновления токена
// проверяется, что переданное значение содержит поле refreshToken
// проверяется, что refreshToken является строкой длиной от 40 до 200 символов
export function refresh(value: unknown) {
  const data = fields(value, ["refreshToken"]);
  return { refreshToken: text(data.refreshToken, "refreshToken", 40, 200) };
}

// проверка данных для профиля
// проверяется, что переданное значение содержит поля name, email, dark, calendar и avatarId
// проверяется, что имя является строкой длиной от 2 до 30 символов, начинается и заканчивается буквой, внутри содержит буквы, пробелы или дефисы
// проверяется, что email является корректным адресом электронной почты
// проверяется, что dark и calendar являются логическими значениями
// проверяется, что avatarId является UUID или null
export function profile(value: unknown): ProfileInput {
  const data = fields(value, ["name", "email", "dark", "calendar", "avatarId"]);
  const result: ProfileInput = {};
  if (data.name != null) {
    result.name = text(data.name, "name", 2, 30);
    if (!/^[\p{L}][\p{L} -]*[\p{L}]$/u.test(result.name)) invalid("name");
  }
  if (data.email != null) result.email = email(data.email);
  if (data.dark != null) result.dark = boolean(data.dark, "dark");
  if (data.calendar != null) result.calendar = boolean(data.calendar, "calendar");
  if (data.avatarId != null) result.avatarId = uuid(data.avatarId, "avatarId");
  if (data.avatarId === null) result.avatarId = null;
  return result;
}

// проверка параметров встречи
// проверяется, что переданное значение содержит поля title, date, time, budget, cuisines, city и format
// проверяется, что название является строкой длиной от 2 до 100 символов и содержит хотя бы одну букву или цифру
// проверяется, что дата имеет формат YYYY-MM-DD
// проверяется, что время имеет формат HH:MM в 24-часовом формате
// проверяется, что бюджет является целым числом от 0 до 1000000
// проверяется, что кухни являются массивом уникальных строк длиной от 1 до 50 символов
// проверяется, что город является строкой длиной от 1 до 100 символов
// проверяется, что формат является строкой длиной от 1 до 30 символов и содержит одно из разрешенных значений
export function meeting(value: unknown) {
  const data = fields(value, ["title", "date", "time", "budget", "cuisines", "city", "format"]);
  const title = text(data.title, "title", 2, 100);
  if (!/^[^\p{Cc}\p{Zl}\p{Zp}]*[\p{L}\p{N}][^\p{Cc}\p{Zl}\p{Zp}]*$/u.test(title)) invalid("title");
  const date = text(data.date, "date", 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) invalid("date");
  const time = text(data.time, "time", 5, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) invalid("time");
  const format = text(data.format, "format", 1, 30);
  if (!["В помещении", "На улице", "Не важно"].includes(format)) invalid("format");
  let city: string | undefined;
  if (data.city != null) city = text(data.city, "city", 1, 100);
  return { title, date, time, budget: budget(data.budget), cuisines: cuisines(data.cuisines), city, format };
}

// проверка данных для предпочтений
// проверяется, что переданное значение содержит поля budget и cuisines, которые проходят соответствующие проверки

export function preferences(value: unknown) {
  const data = fields(value, ["budget", "cuisines"]);
  return { budget: budget(data.budget), cuisines: cuisines(data.cuisines) };
}

// проверка идентификатора ресторана
// проверяется, что переданное значение содержит поле restaurantId, которое является UUID
export function restaurantId(value: unknown) {
  const data = fields(value, ["restaurantId"]);
  return uuid(data.restaurantId, "restaurantId");
}

// проверка адреса электронной почты участника
// проверяется, что переданное значение содержит поле email, которое является адресом электронной почты
export function memberEmail(value: unknown) {
  return email(fields(value, ["email"]).email);
}

// проверка токена приглашения
// проверяется, что переданное значение содержит поле token, которое является строкой длиной от 40 до 200 символов
export function invitation(value: unknown) {
  return text(fields(value, ["token"]).token, "token", 40, 200);
}

// проверка данных сообщения
// text - строка длиной от 0 до 4000 символов
// fileId - UUID
// пустой текст разрешён, поскольку сообщение может содержать только вложение
export function message(value: unknown) {
  const data = fields(value, ["text", "fileId"]);
  let fileId: string | undefined;
  if (data.fileId != null) fileId = uuid(data.fileId, "fileId");
  return { text: text(data.text, "text", 0, 4000), fileId };
}

// проверка реакции на сообщение
// проверяется, что переданное значение содержит поле liked, которое является булевым значением
export function reaction(value: unknown) {
  return boolean(fields(value, ["liked"]).liked, "liked");
}

// проверка идентификатора встречи для загрузки
// проверяется, что переданное значение содержит поле meetingId, которое является UUID
export function upload(value: unknown) {
  const data = fields(value, ["meetingId"]);
  if (data.meetingId != null) return uuid(data.meetingId, "meetingId");
  return undefined;
}

// проверка фильтров мест
// q - строка длиной от 0 до 200 символов
// budget - число от 1 до 100000
// cuisine - строка длиной от 1 до 80 символов
// cuisines - массив из 100 или менее уникальных строк длиной от 1 до 80 символов
// openNow - булево значение
export function filters(value: unknown): PlaceFilters {
  const data = fields(value, ["q", "budget", "cuisine", "cuisines", "openNow"]);
  const result: PlaceFilters = {};
  if (data.q != null) result.q = text(data.q, "q", 0, 200);
  if (data.budget != null) {
    if (typeof data.budget !== "string" && typeof data.budget !== "number") invalid("budget");
    result.budget = number(Number(data.budget), "budget", 1, 100000, true);
  }
  if (data.cuisine != null) result.cuisine = text(data.cuisine, "cuisine", 1, 80);
  if (data.cuisines != null) {
    let values = data.cuisines;
    if (typeof values === "string") values = [values];
    if (!Array.isArray(values) || values.length > 100) invalid("cuisines");
    result.cuisines = values.map(item => text(item, "cuisines", 1, 80));
    if (new Set(result.cuisines).size !== result.cuisines.length) invalid("cuisines");
  }
  if (data.openNow != null) {
    let open = data.openNow;
    if (open === "true") open = true;
    if (open === "false") open = false;
    result.openNow = boolean(open, "openNow");
  }
  return result;
}

/** Для одиночных query-параметров не допускаются массивы и вложенные объекты
 * @param value - значение query-параметра
 * @param fallback - значение по умолчанию, если параметр не передан
 * @returns строка длиной от 0 до 4000 символов
 */
export function queryText(value: unknown, fallback = ""): string {
  if (value === undefined) return fallback;
  return text(value, "query", 0, 4000);
}
