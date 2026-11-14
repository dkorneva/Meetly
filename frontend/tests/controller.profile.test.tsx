import { act } from "@testing-library/react-native";
import { api } from "../src/shared/api/client";
import { renderController } from "./controllerFixture";
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
test("настройки профиля сохраняются на сервере", async () => {
  const { result } = await renderController();
  await act(() => result.current.update({ dark: true }));
  expect(api).toHaveBeenCalledWith("/users/me", "PATCH", { dark: true });
});
test("имя и почта передаются серверу после редактирования", async () => {
  const { result } = await renderController();
  await act(() => {
    result.current.setEditName("Новое Имя");
    result.current.setEditEmail("new@example.com");
  });
  await act(() => result.current.saveProfile());
  expect(api).toHaveBeenCalledWith("/users/me", "PATCH", {
    name: "Новое Имя",
    email: "new@example.com",
  });
});
