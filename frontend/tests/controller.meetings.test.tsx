import { act } from "@testing-library/react-native";
import { api } from "../src/shared/api/client";
import { controllerStore, renderController } from "./controllerFixture";
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
test("создание не отправляет локальные id, голоса и права", async () => {
  const { result } = await renderController();
  await act(() => result.current.setScreen("new"));
  await act(() =>
    result.current.saveMeeting({
      ...result.current.meeting!,
      title: "Новая встреча",
    }),
  );
  expect(api).toHaveBeenCalledWith(
    "/meetings",
    "POST",
    expect.objectContaining({ title: "Новая встреча" }),
  );
  const body = jest
    .mocked(api)
    .mock.calls.find((c) => c[0] === "/meetings" && c[1] === "POST")?.[2];
  expect(body).not.toHaveProperty("votes");
  expect(body).not.toHaveProperty("ownerId");
});
test("изменения сохраняются запросом PATCH", async () => {
  const { result } = await renderController();
  await act(() => result.current.setScreen("edit"));
  await act(() =>
    result.current.saveMeeting({
      ...result.current.meeting!,
      title: "Изменено",
    }),
  );
  expect(api).toHaveBeenCalledWith(
    "/meetings/team",
    "PATCH",
    expect.objectContaining({ title: "Изменено" }),
  );
});

test("предложение с карты отправляется во встречу из списка, сохраняя текущую встречу", async () => {
  const store = controllerStore();
  store.meetings[1].status = "voting";
  const { result } = await renderController(store);
  expect(result.current.selected).toBe("team");
  await act(() => result.current.propose({ id: "restaurant-42" } as import("../src/entities/meeting").Restaurant, "coffee"));
  expect(api).toHaveBeenCalledWith("/meetings/coffee/candidates", "POST", { restaurantId: "restaurant-42" });
  expect(result.current.selected).toBe("team");
  expect(result.current.toast?.message).toBe("Место добавлено в голосование");
});

test("завершённая или удалённая встреча не получает предложение с карты", async () => {
  const { result } = await renderController();
  const place = { id: "restaurant-42" } as import("../src/entities/meeting").Restaurant;
  jest.mocked(api).mockClear();
  await act(() => result.current.propose(place, "coffee"));
  expect(result.current.toast?.message).toBe("Голосование в этой встрече завершено");
  await act(() => result.current.propose(place, "removed"));
  expect(result.current.toast?.message).toBe("Встреча больше недоступна");
  expect(api).not.toHaveBeenCalled();
});
