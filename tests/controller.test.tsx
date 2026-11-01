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
  for (const [id, messages] of Object.entries(store.messages)) {
    if (id !== selected) expect(result.current.store.messages[id]).toEqual(messages);
  }
});
