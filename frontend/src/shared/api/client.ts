import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
export const serverUrl = (
  // В локальной web-версии используем тот же компьютер, на котором открыт Expo.
  // Для опубликованного приложения адрес API по-прежнему задаётся явно.
  Platform.OS === "web" && typeof window !== "undefined" &&
  ["8081", "19006"].includes(window.location.port)
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
type Tokens = { accessToken: string; refreshToken: string };
let tokens: Tokens | null = null;
let refreshPending: Promise<void> | null = null;
/** Восстанавливает токены сессии из хранилища. */
export async function restoreSession() {
  const raw =
    Platform.OS === "web"
      ? globalThis.sessionStorage?.getItem("meetly.session")
      : await SecureStore.getItemAsync("meetly.session");
  tokens = raw ? JSON.parse(raw) : null;
  return !!tokens;
}
/** Сохраняет или удаляет токены сессии. */
export async function setTokens(value: Tokens | null) {
  tokens = value;
  if (Platform.OS === "web") {
    if (value)
      globalThis.sessionStorage.setItem(
        "meetly.session",
        JSON.stringify(value),
      );
    else globalThis.sessionStorage.removeItem("meetly.session");
  } else if (value)
    await SecureStore.setItemAsync("meetly.session", JSON.stringify(value));
  else await SecureStore.deleteItemAsync("meetly.session");
}
/** Возвращает текущий access-токен. */
export const accessToken = () => tokens?.accessToken;
/** Возвращает текущий refresh-токен. */
export const refreshToken = () => tokens?.refreshToken;
/** Вызывает API и обновляет истёкшую сессию при необходимости. */
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  retry = true,
): Promise<T> {
  let response: Response;
  try {
  response = await fetch(`${serverUrl}/api${path}`, {
    method,
    headers: {
      ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    signal: AbortSignal.timeout(35000),
  });
  } catch {
    throw new Error(`Не удалось связаться с сервером ${serverUrl}. Проверьте, что бэкенд запущен и адрес сервера указан правильно.`);
  }
  if (response.status === 401 && retry && tokens) {
    if (!refreshPending)
      refreshPending = api<Tokens>(
        "/auth/refresh",
        "POST",
        { refreshToken: tokens.refreshToken },
        false,
      )
        .then(setTokens)
        .finally(() => {
          refreshPending = null;
        });
    try {
      await refreshPending;
    } catch {
      await setTokens(null);
      throw new Error("Сессия истекла. Войдите снова");
    }
    return api<T>(path, method, body, false);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message =
      error?.message?.message ??
      error?.message ??
      `Ошибка сервера ${response.status}`;
    throw new Error(
      Array.isArray(message)
        ? message.join("\n")
        : typeof message === "string"
          ? message
          : "Не удалось выполнить запрос",
    );
  }
  return (
    response.headers.get("content-type")?.includes("text/calendar")
      ? await response.text()
      : await response.json()
  ) as T;
}
/** Загружает файл на сервер. */
export async function upload(
  uri: string,
  name: string,
  mime: string,
  meetingId?: string,
) {
  const form = new FormData();
  if (Platform.OS === "web")
    form.append("file", await (await fetch(uri)).blob(), name);
  else form.append("file", { uri, name, type: mime } as unknown as Blob);
  if (meetingId) form.append("meetingId", meetingId);
  return api<{ id: string; url: string; name: string; mime: string }>(
    "/files",
    "POST",
    form,
  );
}
