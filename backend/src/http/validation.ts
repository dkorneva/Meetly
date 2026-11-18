import isEmail from "validator/lib/isEmail";
import isUUID from "validator/lib/isUUID";
import { BadRequestError } from "./errors";
import { ProfileInput } from "../application/users.service";
import { PlaceFilters } from "../application/discovery.service";

/** Проверки выполняются обычными функциями до обращения к сервисам и БД */
function invalid(field: string): never {
  throw new BadRequestError("Некорректное поле: " + field);
}

/** Проверяет, что передан объект и в нём нет неизвестных полей. Возвращает проверенный объект. */
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

/** Проверяет, что передана строка допустимой длины. Возвращает строку или вызывает ошибку с именем поля. */
function text(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string" || [...value].length < min || [...value].length > max) invalid(field);
  return value;
}

/** Проверяет число и допустимый диапазон. При integer = true дополнительно требует целое число. */
function number(value: unknown, field: string, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) invalid(field);
  if (integer && !Number.isInteger(value)) invalid(field);
  return value;
}

/** Проверяет, что передано true или false. При другом значении вызывает ошибку с именем поля. */
function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") invalid(field);
  return value;
}

/** Проверяет длину и формат адреса электронной почты. Возвращает проверенный адрес. */
function email(value: unknown): string {
  const result = text(value, "email", 1, 254); // проверка длины
  if (!isEmail(result)) invalid("email"); // проверка формата email
  return result;
}

/** Проверяет формат UUID — уникального идентификатора записи. При ошибке указывает имя поля. */
export function uuid(value: unknown, field = "id"): string { // если имя поля не указано, в сообщении об ошибке используется "id"
  if (typeof value !== "string" || !isUUID(value)) invalid(field);
  return value;
}

/** Проверяет список кухонь: до 100 уникальных строк длиной от 1 до 80 символов и до 2000 символов в JSON. */
function cuisines(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100) invalid("cuisines");
  const result = value.map(item => text(item, "cuisines", 1, 80));
  if (new Set(result).size !== result.length || JSON.stringify(result).length > 2000) invalid("cuisines");
  return result;
}

/** Проверяет бюджет: целое число от 500 до 100 000, кратное 100. Возвращает проверенную сумму. */
function budget(value: unknown): number {
  const result = number(value, "budget", 500, 100000, true);
  if (result % 100 !== 0) invalid("budget");
  return result;
}

/** Проверяет адрес электронной почты и пароль для входа. Возвращает данные или вызывает ошибку 400. */
export function login(value: unknown) {
  const data = fields(value, ["email", "password"]);
  return { email: email(data.email), password: text(data.password, "password", 1, 128) };
}

/** Проверяет имя, адрес электронной почты и сложность пароля нового пользователя. Возвращает данные регистрации. */
export function registration(value: unknown) {
  const data = fields(value, ["name", "email", "password"]);
  const name = text(data.name, "name", 2, 30);
  if (!/^[\p{L}][\p{L} -]{0,28}[\p{L}]$/u.test(name)) invalid("name");
  const password = text(data.password, "password", 8, 128);
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/.test(password)) invalid("password");
  return { name, email: email(data.email), password };
}

/** Проверяет, что передан refresh-токен длиной от 40 до 200 символов. Возвращает объект с токеном. */
export function refresh(value: unknown) {
  const data = fields(value, ["refreshToken"]);
  return { refreshToken: text(data.refreshToken, "refreshToken", 40, 200) };
}

/** Проверяет переданные поля профиля. Разрешает частичное обновление и null для удаления аватара. */
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

/** Проверяет название, формат даты и времени, бюджет, кухни, город и формат встречи. Существование даты проверяется отдельно при создании момента времени. */
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

/** Проверяет бюджет и список кухонь участника. Возвращает проверенные предпочтения. */
export function preferences(value: unknown) {
  const data = fields(value, ["budget", "cuisines"]);
  return { budget: budget(data.budget), cuisines: cuisines(data.cuisines) };
}

/** Извлекает из объекта ID ресторана и проверяет, что он имеет формат UUID. */
export function restaurantId(value: unknown) {
  const data = fields(value, ["restaurantId"]);
  return uuid(data.restaurantId, "restaurantId");
}

/** Извлекает из объекта адрес электронной почты участника и проверяет его формат. */
export function memberEmail(value: unknown) {
  return email(fields(value, ["email"]).email);
}

/** Извлекает строку токена приглашения и проверяет её длину. Само приглашение проверяется в сервисе встреч. */
export function invitation(value: unknown) {
  return text(fields(value, ["token"]).token, "token", 40, 200);
}

/** Проверяет текст сообщения и необязательный ID вложения. Пустой текст допускается для сообщения с файлом. */
export function message(value: unknown) {
  const data = fields(value, ["text", "fileId"]);
  let fileId: string | undefined;
  if (data.fileId != null) fileId = uuid(data.fileId, "fileId");
  return { text: text(data.text, "text", 0, 4000), fileId };
}

/** Проверяет поле liked и возвращает true или false для изменения реакции на сообщение. */
export function reaction(value: unknown) {
  return boolean(fields(value, ["liked"]).liked, "liked");
}

/** Проверяет необязательный ID встречи при загрузке файла. Если ID не передан, возвращает undefined. */
export function upload(value: unknown) {
  const data = fields(value, ["meetingId"]);
  if (data.meetingId != null) return uuid(data.meetingId, "meetingId");
  return undefined;
}

/** Проверяет фильтры ресторанов из запроса. Преобразует строковый бюджет в число, а строки true и false — в логические значения. */
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
