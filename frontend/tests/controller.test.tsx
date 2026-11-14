import { act } from "@testing-library/react-native";
import { api } from "../src/shared/api/client";
import { renderController } from "./controllerFixture";
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
test("сервер определяет текущего пользователя и состав встреч", async () => {
  const { result } = await renderController();
  expect(result.current.store.userId).toBe("owner");
  expect(result.current.store.meetings.length).toBe(3);
  expect(result.current.meeting?.members?.[0].id).toBe("owner");
});
test("при ошибке API показывает сообщение и снимает индикатор загрузки", async () => {
  const { result } = await renderController();
  jest.mocked(api).mockRejectedValueOnce(new Error("Сервер недоступен"));
  await act(() => result.current.selectLeader());
  expect(result.current.toast?.message).toBe("Сервер недоступен");
  expect(result.current.busy).toBe(false);
});
