import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppController } from "../src/app/model/useAppController";
import { loadStore, saveStore } from "../src/app/lib/storage/localStore";
import { makeController } from "./fixtures";
import { restaurants } from "../src/entities/meeting";

// Подменяем загрузку шрифта, но оставляем настоящие контроллер и сохранение данных.
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

beforeEach(async () => {
  await AsyncStorage.clear();
});

test("переключение разделов оставляет только встречи соответствующего статуса", async () => {
  const store = makeController().store;
  const active = { ...store.meetings[0], id: "team", status: "voting" as const };
  const completed = { ...store.meetings[0], id: "completed", status: "completed" as const };
  store.meetings = [active, completed];
  await saveStore(store);
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  expect(result.current.meetingSection).toBe("active");
  expect(result.current.matchingMeetings).toEqual([active]);

  await act(() => result.current.setMeetingSection("completed"));
  expect(result.current.matchingMeetings).toEqual([completed]);

  await act(() => result.current.setMeetingSection("active"));
  expect(result.current.matchingMeetings).toEqual([active]);
});

test("подтверждение брони завершает встречу и сохраняет её состояние", async () => {
  const store = makeController().store;
  const meeting = store.meetings.find((item) => item.id === "team")!;
  meeting.status = "voting";
  await saveStore(store);
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  await act(() => result.current.confirmCurrentBooking());

  expect(result.current.meeting).toMatchObject({
    status: "completed",
    restaurantId: result.current.booking.id,
    bookedAt: expect.any(String),
    completedAt: expect.any(String),
  });
  expect(result.current.meetingSection).toBe("completed");
  await waitFor(async () => {
    const saved = await loadStore();
    expect(saved?.meetings.find((item) => item.id === meeting.id)).toEqual(result.current.meeting);
  });
});

test("отмена брони возвращает завершённую встречу в активные и очищает даты", async () => {
  const store = makeController().store;
  const meeting = store.meetings.find((item) => item.id === "team")!;
  Object.assign(meeting, {
    status: "completed",
    restaurantId: restaurants[0].id,
    bookedAt: "2026-09-25T12:00:00.000Z",
    completedAt: "2026-09-25T12:00:00.000Z",
  });
  await saveStore(store);
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  await act(() => result.current.cancelCurrentBooking());

  expect(result.current.meeting.status).toBe("selected");
  expect(result.current.meeting.restaurantId).toBe(meeting.restaurantId);
  expect(result.current.meeting.bookedAt).toBeUndefined();
  expect(result.current.meeting.completedAt).toBeUndefined();
  expect(result.current.meetingSection).toBe("active");
});

test("отправка сообщения добавляет его только в чат выбранной встречи", async () => {
  const store = makeController().store;
  store.messages.coffee = [{ id: "other-chat-message", name: "Маша", text: "Другой чат", time: "12:00" }];
  await saveStore(store);
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.loaded).toBe(true));
  const selected = result.current.selected;
  const previous = store.messages[selected] ?? [];

  await act(() => result.current.sendMessage("До встречи!"));

  expect(result.current.store.messages[selected]).toEqual([
    ...previous,
    expect.objectContaining({ text: "До встречи!", mine: true, name: store.name.split(" ")[0] }),
  ]);
  expect(result.current.store.messages.coffee).toEqual(store.messages.coffee);
});
