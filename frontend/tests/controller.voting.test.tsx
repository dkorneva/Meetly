import { act } from "@testing-library/react-native";
import { api } from "../src/shared/api/client";
import { renderController } from "./controllerFixture";
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
test("голос отправляется серверу без имени подставного пользователя", async () => {
  const { result } = await renderController();
  await act(() => result.current.vote("restaurant"));
  expect(api).toHaveBeenCalledWith("/meetings/team/vote", "PUT", {
    restaurantId: "restaurant",
  });
});
test("победитель вычисляется сервером", async () => {
  const { result } = await renderController();
  await act(() => result.current.selectLeader());
  expect(api).toHaveBeenCalledWith("/meetings/team/select", "POST", {});
});
