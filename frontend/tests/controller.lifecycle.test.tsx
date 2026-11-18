import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState, BackHandler, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { api, restoreSession, setTokens } from "../src/shared/api/client";
import { useAppController } from "../src/app/model/useAppController";
import { renderController, controllerStore } from "./controllerFixture";

beforeEach(() => {
  jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() });
  jest.spyOn(BackHandler, "addEventListener").mockReturnValue({ remove: jest.fn() });
  jest.spyOn(Linking, "addEventListener").mockReturnValue({ remove: jest.fn() });
});
afterEach(() => jest.restoreAllMocks());

test.each([null, "1"])("без сессии открывается знакомство или вход: %s", async onboarded => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(onboarded);
  jest.mocked(restoreSession).mockResolvedValue(false);
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.loaded).toBe(true));
  expect(result.current.screen).toBe(onboarded ? "login" : "intro");
});
test.each(["login", "register"] as const)("%s сохраняет токены и открывает список встреч", async screen => {
  const { result } = await renderController();
  const implementation = jest.mocked(api).getMockImplementation()!;
  jest.mocked(api).mockImplementation(async (path, ...args) => path.startsWith("/auth/") ? { accessToken: "new", refreshToken: "refresh" } : implementation(path, ...args));
  await act(() => result.current.setScreen(screen));
  await act(() => result.current.enterSession("Анна", "a@example.com", "Password1!"));
  expect(api).toHaveBeenCalledWith(`/auth/${screen}`, "POST", screen === "login" ? { email: "a@example.com", password: "Password1!" } : { name: "Анна", email: "a@example.com", password: "Password1!" });
  expect(setTokens).toHaveBeenCalledWith({ accessToken: "new", refreshToken: "refresh" });
  expect(result.current.screen).toBe("meetings");
});
test("возврат устройства закрывает диалог и возвращает из чата к его источнику", async () => {
  let back!: () => boolean;
  const spy = jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, callback) => { back = callback as unknown as () => boolean; return { remove: jest.fn() }; });
  try {
    const { result } = await renderController();
    expect(back()).toBe(false);
    await act(() => result.current.setDialog("profile"));
    await act(() => { expect(back()).toBe(true); });
    expect(result.current.dialog).toBeNull();
    await act(() => result.current.openChat(result.current.meeting!.id, "list"));
    await act(() => { back(); });
    expect(result.current.screen).toBe("chats");
    await act(() => result.current.openChat(result.current.meeting!.id, "meeting"));
    await act(() => result.current.goBack());
    expect(result.current.screen).toBe("detail");
    await act(() => result.current.setScreen("edit"));
    await act(() => result.current.goBack());
    expect(result.current.screen).toBe("detail");
  } finally { spy.mockRestore(); }
});
test("Socket.IO и возврат приложения на экран обновляют встречи; подписки удаляются", async () => {
  const listeners: Record<string, (...args: any[]) => any> = {};
  const socket = { on: jest.fn((event, callback) => { listeners[event] = callback; }), disconnect: jest.fn(), connect: jest.fn() };
  jest.mocked(io).mockReturnValueOnce(socket as any);
  let onState!: (state: "active" | "background") => void;
  const remove = jest.fn();
  const spy = jest.spyOn(AppState, "addEventListener").mockImplementation((_event, callback) => { onState = callback; return { remove }; });
  try {
    const { unmount } = await renderController();
    const auth = jest.mocked(io).mock.calls.at(-1)![1]!.auth as Function, authCallback = jest.fn();
    auth(authCallback);
    expect(authCallback).toHaveBeenCalledWith({ token: "access" });
    jest.mocked(api).mockClear();
    await act(async () => { listeners["meeting.changed"](); });
    expect(api).toHaveBeenCalledWith("/meetings");
    jest.mocked(api).mockClear();
    await act(async () => { onState("background"); });
    expect(api).not.toHaveBeenCalled();
    await act(async () => { onState("active"); });
    expect(api).toHaveBeenCalledWith("/users/me");
    await act(async () => { listeners.disconnect("io server disconnect"); });
    expect(socket.connect).toHaveBeenCalledTimes(1);
    await unmount();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  } finally { spy.mockRestore(); }
});
test("приглашение из ссылки принимается вошедшим пользователем", async () => {
  let onURL!: (event: { url: string }) => void;
  const spy = jest.spyOn(Linking, "addEventListener").mockImplementation((_event, callback) => { onURL = callback as typeof onURL; return { remove: jest.fn() }; });
  try {
    const { result } = await renderController();
    const implementation = jest.mocked(api).getMockImplementation()!;
    jest.mocked(api).mockImplementation(async (path, ...args) => path === "/meetings/invitations/accept" ? { meetingId: "team" } : implementation(path, ...args));
    await act(async () => { onURL({ url: "https://example.com" }); onURL({ url: "meetly://invite" }); });
    expect(api).not.toHaveBeenCalledWith("/meetings/invitations/accept", expect.anything(), expect.anything());
    await act(async () => { onURL({ url: "meetly://invite?token=invitation" }); });
    expect(api).toHaveBeenCalledWith("/meetings/invitations/accept", "POST", { token: "invitation" });
    expect(result.current.screen).toBe("detail");
  } finally { spy.mockRestore(); }
});
test("участник редактирует только свои предпочтения", async () => {
  const { result } = await renderController();
  const implementation = jest.mocked(api).getMockImplementation()!;
  jest.mocked(api).mockImplementation(async (path, ...args) => {
    const response = await implementation(path, ...args);
    return path === "/meetings" ? (response as any[]).map(m => ({ ...m, ownerId: "another-user" })) : response;
  });
  await act(() => result.current.refreshMeetings());
  await act(() => result.current.setScreen("edit"));
  await act(() => result.current.saveMeeting(result.current.meeting!));
  expect(api).toHaveBeenCalledWith("/meetings/team/preferences", "PUT", { budget: result.current.meeting!.budget, cuisines: result.current.meeting!.cuisines });
});
test("страницы сообщений сохраняют авторство, реакции и порядок при загрузке истории", async () => {
  const { result } = await renderController();
  const implementation = jest.mocked(api).getMockImplementation()!;
  let page = 0;
  jest.mocked(api).mockImplementation(async (path, ...args) => {
    if (path.includes("/messages") && (!args[0] || args[0] === "GET")) return { items: [{ id: ++page === 1 ? "new" : "old", senderId: "owner", text: "Привет", name: "Анна", createdAt: "2026-01-01T10:00:00Z", reactions: [{ userId: "owner" }, { userId: "friend" }] }], nextCursor: page === 1 ? "cursor" : null };
    return implementation(path, ...args);
  });
  await act(() => result.current.refreshMeetings());
  // Отправка сообщения вызывает загрузку последней страницы.
  await act(() => result.current.sendMessage("Привет"));
  expect(result.current.hasOlderMessages).toBe(true);
  await act(() => result.current.loadOlderMessages());
  expect(api).toHaveBeenCalledWith("/meetings/team/messages?before=cursor");
  expect(result.current.store.messages.team.map(m => m.id)).toEqual(["old", "new"]);
  expect(result.current.store.messages.team[1]).toMatchObject({ mine: true, liked: true, otherLikes: 1 });
  await act(() => result.current.toggleMessageLike("new"));
  expect(api).toHaveBeenCalledWith("/meetings/team/messages/new/reaction", "PUT", { liked: false });
});
test("пустой набор встреч безопасно обрабатывает действия и рекомендации", async () => {
  const store = controllerStore(); store.meetings = [];
  const { result } = await renderController(store);
  await act(() => result.current.sharePlaceInChat());
  expect(result.current.toast?.message).toBe("Сначала предложите место");
  await act(() => result.current.recommend());
  expect(result.current.toast?.message).toContain("выберите встречу");
});

test("автоподбор показывает предупреждение и обновляет изменённые варианты", async () => {
  const setup = await renderController();
  const implementation = jest.mocked(api).getMockImplementation()!;
  await setup.unmount();
  jest.mocked(api).mockImplementation(async (path, ...args) => path.endsWith("/recommendations/apply") ? { changed: true, warning: "Найден компромисс" } : implementation(path, ...args));
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.discoveryError).toBe("Найден компромисс"));
  await waitFor(() => expect(result.current.discoveryBusy).toBe(false));
  await act(() => result.current.recommend());
  expect(result.current.discoveryError).toBe("Найден компромисс");
});
test("ошибка автоподбора снимает индикатор загрузки и сохраняет текст ошибки", async () => {
  const setup = await renderController();
  const implementation = jest.mocked(api).getMockImplementation()!;
  await setup.unmount();
  jest.mocked(api).mockImplementation(async (path, ...args) => {
    if (path.endsWith("/recommendations/apply")) throw new Error("Подбор недоступен");
    return implementation(path, ...args);
  });
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.discoveryError).toBe("Подбор недоступен"));
  expect(result.current.discoveryBusy).toBe(false);
});
test("прохождение знакомства сохраняется локально без запроса к серверу", async () => {
  const { result } = await renderController();
  jest.mocked(api).mockClear();
  await act(() => result.current.update({ onboarded: true }));
  expect(AsyncStorage.setItem).toHaveBeenCalledWith("meetly.onboarded", "1");
  expect(api).not.toHaveBeenCalled();
});
test("при ошибке выхода на сервере локальная сессия всё равно очищается", async () => {
  const { result } = await renderController();
  jest.mocked(api).mockRejectedValueOnce(new Error("Нет сети"));
  await act(() => result.current.signOut());
  expect(result.current.store.session).toBe(false);
  expect(result.current.screen).toBe("login");
  expect(result.current.toast?.message).toContain("Локальный выход выполнен");
});
