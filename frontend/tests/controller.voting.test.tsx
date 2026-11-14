import { act } from "@testing-library/react-native";
import { controllerStore, renderController } from "./controllerFixture";
import { restaurants } from "../src/entities/meeting";

jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

test("записывает голос только в выбранную встречу, сохраняя голоса других участников", async () => {
  const store = controllerStore();
  const meeting = store.meetings.find((item) => item.id === "team")!;
  meeting.status = "voting";
  meeting.votes = { Маша: restaurants[0].id };
  const { result } = await renderController(store);

  await act(() => result.current.vote(restaurants[1].id));

  expect(result.current.meeting.votes).toEqual({ Маша: restaurants[0].id, Аня: restaurants[1].id });
  expect(result.current.store.meetings.filter((item) => item.id !== "team"))
    .toEqual(store.meetings.filter((item) => item.id !== "team"));
});

test("смена выбора заменяет прежний голос, а не добавляет второй", async () => {
  const store = controllerStore();
  const meeting = store.meetings.find((item) => item.id === "team")!;
  meeting.status = "voting";
  meeting.votes = { Аня: restaurants[0].id, Маша: restaurants[0].id };
  const { result } = await renderController(store);

  await act(() => result.current.vote(restaurants[1].id));

  expect(result.current.meeting.votes).toEqual({ Аня: restaurants[1].id, Маша: restaurants[0].id });
});

test.each(["selected", "booked", "completed"] as const)("не меняет голоса при статусе %s", async (status) => {
  const store = controllerStore();
  const meeting = store.meetings.find((item) => item.id === "team")!;
  meeting.status = status;
  const { result } = await renderController(store);

  await act(() => result.current.vote(restaurants[1].id));

  expect(result.current.store.meetings).toEqual(store.meetings);
  expect(result.current.toast).toMatchObject({ type: "info", message: "Голосование завершено" });
});

test("удаляет участника вместе с его голосом только из выбранной встречи", async () => {
  const store = controllerStore();
  const meeting = store.meetings.find((item) => item.id === "team")!;
  meeting.participants = ["Аня", "Полина", "Маша"];
  meeting.votes = { Аня: restaurants[0].id, Полина: restaurants[1].id, Маша: restaurants[0].id };
  const { result } = await renderController(store);

  await act(() => result.current.removeParticipant("Полина"));

  expect(result.current.meeting.participants).toEqual(["Аня", "Маша"]);
  expect(result.current.meeting.votes).toEqual({ Аня: restaurants[0].id, Маша: restaurants[0].id });
  expect(result.current.store.meetings.filter((item) => item.id !== "team"))
    .toEqual(store.meetings.filter((item) => item.id !== "team"));
});
