import { act } from "@testing-library/react-native";
import { controllerStore, renderController } from "./controllerFixture";

jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

test("создаёт встречу и её чат, сохраняя прежние встречи и сообщения", async () => {
  const store = controllerStore();
  const created = { ...store.meetings[0], id: "new-meeting", title: "Новая встреча", votes: {} };
  const { result } = await renderController(store);
  await act(() => result.current.setScreen("new"));

  await act(() => result.current.saveMeeting(created));

  expect(result.current.store.meetings).toEqual([created, ...store.meetings]);
  expect(result.current.store.messages[created.id]).toEqual([
    expect.objectContaining({ kind: "system", text: `${store.name.split(" ")[0]} создала встречу` }),
  ]);
  expect(result.current.store.messages.team).toEqual(store.messages.team);
  expect(result.current.selected).toBe(created.id);
  expect(result.current.screen).toBe("detail");
});

test("редактирует выбранную встречу без создания копии и изменения остальных встреч и чатов", async () => {
  const store = controllerStore();
  const original = store.meetings.find((meeting) => meeting.id === "team")!;
  const edited = { ...original, title: "Другое название", budget: 2000 };
  const { result } = await renderController(store);
  await act(() => result.current.setScreen("edit"));

  await act(() => result.current.saveMeeting(edited));

  expect(result.current.store.meetings).toEqual(store.meetings.map((meeting) => meeting.id === original.id ? edited : meeting));
  expect(result.current.meeting.votes).toEqual(original.votes);
  expect(result.current.store.messages).toEqual(store.messages);
  expect(result.current.selected).toBe(original.id);
  expect(result.current.screen).toBe("detail");
});
