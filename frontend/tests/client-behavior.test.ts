import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: jest.fn() }));
const client = jest.requireActual<typeof import("../src/shared/api/client")>("../src/shared/api/client");
const originalFetch = global.fetch;
const originalOS = Platform.OS;
const originalBlob = global.Blob;
const originalStorage = global.sessionStorage;
const response = (value: unknown, status = 200, contentType = "application/json") => ({ status, ok: status < 400, headers: { get: () => contentType }, json: async () => value, text: async () => value });
beforeEach(async () => {
  Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
  await client.setTokens(null);
  global.fetch = jest.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
  global.Blob = originalBlob;
  Object.defineProperty(Platform, "OS", { configurable: true, value: originalOS });
  Object.defineProperty(global, "sessionStorage", { configurable: true, value: originalStorage });
});

test("сессия восстанавливается и удаляется из защищённого хранилища", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  expect(await client.restoreSession()).toBe(false);
  const tokens = { accessToken: "access", refreshToken: "refresh" };
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(tokens));
  expect(await client.restoreSession()).toBe(true);
  expect(client.accessToken()).toBe("access");
  expect(client.refreshToken()).toBe("refresh");
  await client.setTokens(tokens);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith("meetly.session", JSON.stringify(tokens));
  await client.setTokens(null);
  expect(client.accessToken()).toBeUndefined();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("meetly.session");
});
test("web-сессия хранится в sessionStorage", async () => {
  Object.defineProperty(Platform, "OS", { value: "web" });
  const storage = { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn() };
  Object.defineProperty(global, "sessionStorage", { configurable: true, value: storage });
  expect(await client.restoreSession()).toBe(false);
  await client.setTokens({ accessToken: "a", refreshToken: "r" });
  expect(storage.setItem).toHaveBeenCalledWith("meetly.session", JSON.stringify({ accessToken: "a", refreshToken: "r" }));
  await client.setTokens(null);
  expect(storage.removeItem).toHaveBeenCalledWith("meetly.session");
});
test("после 401 клиент обновляет токены и повторяет исходный запрос", async () => {
  await client.setTokens({ accessToken: "old", refreshToken: "refresh" });
  const fetch = jest.mocked(global.fetch);
  fetch.mockResolvedValueOnce(response({}, 401) as unknown as Response)
    .mockResolvedValueOnce(response({ accessToken: "new", refreshToken: "next" }) as unknown as Response)
    .mockResolvedValueOnce(response({ name: "Анна" }) as unknown as Response);
  expect(await client.api("/users/me")).toEqual({ name: "Анна" });
  expect(fetch).toHaveBeenNthCalledWith(2, `${client.serverUrl}/api/auth/refresh`, expect.objectContaining({ method: "POST", body: JSON.stringify({ refreshToken: "refresh" }) }));
  expect(fetch).toHaveBeenNthCalledWith(3, `${client.serverUrl}/api/users/me`, expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer new" }) }));
});
test("конкурентные запросы используют одно обновление сессии", async () => {
  await client.setTokens({ accessToken: "old", refreshToken: "r" });
  jest.mocked(global.fetch).mockImplementation(async (url, options) => {
    if (String(url).endsWith("/auth/refresh")) return response({ accessToken: "new", refreshToken: "next" }) as unknown as Response;
    return response({ ok: true }, (options?.headers as Record<string, string>).Authorization === "Bearer old" ? 401 : 200) as unknown as Response;
  });
  expect(await Promise.all([client.api("/users/me"), client.api("/meetings")])).toEqual([{ ok: true }, { ok: true }]);
  expect(jest.mocked(global.fetch).mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh"))).toHaveLength(1);
});
test("неудачное обновление сессии очищает токены без бесконечного повтора", async () => {
  await client.setTokens({ accessToken: "old", refreshToken: "r" });
  jest.mocked(global.fetch).mockResolvedValue(response({ message: "expired" }, 401) as unknown as Response);
  await expect(client.api("/users/me")).rejects.toThrow("Сессия истекла");
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(client.refreshToken()).toBeUndefined();
});
test.each([
  [{ message: { message: "Вложенная ошибка" } }, "Вложенная ошибка"],
  [{ message: ["Ошибка имени", "Ошибка почты"] }, "Ошибка имени\nОшибка почты"],
  [{ message: { other: true } }, "Не удалось выполнить запрос"],
  [{}, "Ошибка сервера 500"],
])("ошибки API отображаются понятным текстом: %j", async (body, expected) => {
  jest.mocked(global.fetch).mockResolvedValue(response(body, 500) as unknown as Response);
  await expect(client.api("/users/me")).rejects.toThrow(expected);
});
test("невалидный JSON ошибки не скрывает HTTP-код", async () => {
  jest.mocked(global.fetch).mockResolvedValue({ ...response(null, 502), json: async () => { throw new SyntaxError(); } } as unknown as Response);
  await expect(client.api("/users/me")).rejects.toThrow("Ошибка сервера 502");
});
test("календарный ответ возвращается текстом", async () => {
  jest.mocked(global.fetch).mockResolvedValue(response("BEGIN:VCALENDAR", 200, "text/calendar") as unknown as Response);
  expect(await client.api("/meetings/one/calendar.ics")).toBe("BEGIN:VCALENDAR");
});
test("загрузка с телефона передаёт байты файла и не задаёт JSON Content-Type", async () => {
  // Настоящий Blob позволяет проверить содержимое, которое получит multipart-кодировщик Expo.
  global.Blob = require("node:buffer").Blob;
  const { File } = require("expo-file-system");
  File.mockImplementation(() => ({ exists: true, size: 3, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }));
  jest.mocked(global.fetch).mockResolvedValue(response({ id: "file" }) as unknown as Response);
  expect(await client.upload("file:///photo.jpg", "photo.jpg", "image/jpeg", "meeting")).toEqual({ id: "file" });
  const options = jest.mocked(global.fetch).mock.calls[0][1]!;
  expect(options.headers).not.toHaveProperty("Content-Type");
  const parts = [...(options.body as FormData).entries()];
  const blob = parts.find(([key]) => key === "file")![1] as Blob;
  expect(blob.type).toBe("image/jpeg");
  expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([1, 2, 3]);
  expect(parts).toContainEqual(["meetingId", "meeting"]);
});
test.each([
  [{ exists: false }, "недоступен"],
  [{ exists: true, size: 10 * 1024 * 1024 + 1 }, "слишком большой"],
])("недоступный или слишком большой файл не отправляется: %j", async (file, message) => {
  require("expo-file-system").File.mockImplementation(() => file);
  await expect(client.upload("file:///photo.jpg", "photo.jpg", "image/jpeg")).rejects.toThrow(message);
  expect(global.fetch).not.toHaveBeenCalled();
});
