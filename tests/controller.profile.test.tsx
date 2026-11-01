import { act } from "@testing-library/react-native";
import { controllerStore, renderController } from "./controllerFixture";

jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

test("сохраняет имя и почту профиля и закрывает окно редактирования", async () => {
  const store = controllerStore();
  const { result } = await renderController(store);
  await act(() => {
    result.current.setDialog("profile");
    result.current.setEditName(" Мария ");
    result.current.setEditEmail("maria@example.ru");
  });

  await act(() => result.current.saveProfile());

  expect(result.current.store).toEqual({ ...store, name: "Мария", email: "maria@example.ru" });
  expect(result.current.dialog).toBeNull();
});

test.each([
  ["   ", "maria@example.ru"],
  ["Мария", "непочта"],
])("не сохраняет некорректный профиль: %s / %s", async (name, email) => {
  const store = controllerStore();
  const { result } = await renderController(store);
  await act(() => {
    result.current.setDialog("profile");
    result.current.setEditName(name);
    result.current.setEditEmail(email);
  });

  await act(() => result.current.saveProfile());

  expect(result.current.store).toEqual(store);
  expect(result.current.dialog).toBe("profile");
  expect(result.current.toast).toMatchObject({ type: "error", message: "Проверьте имя и электронную почту" });
});
