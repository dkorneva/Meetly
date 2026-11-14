import { act } from "@testing-library/react-native";
import { api } from "../src/shared/api/client";
import { renderController } from "./controllerFixture";
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
