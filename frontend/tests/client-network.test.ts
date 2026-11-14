const actual = jest.requireActual<typeof import("../src/shared/api/client")>("../src/shared/api/client");
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test("сетевая ошибка объясняет, какой сервер недоступен", async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(actual.api("/auth/login", "POST", {})).rejects.toThrow(`Не удалось связаться с сервером ${actual.serverUrl}`);
});
test("ошибка авторизации остаётся ответом сервера, а не ошибкой сети", async () => {
  global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false, json: async () => ({ message: "Неверная почта или пароль" }) });
  await expect(actual.api("/auth/login", "POST", {})).rejects.toThrow("Неверная почта или пароль");
});
