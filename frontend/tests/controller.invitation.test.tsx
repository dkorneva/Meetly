import { act } from "@testing-library/react-native";
import { api } from "../src/shared/api/client";
import { renderController } from "./controllerFixture";
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
test("участника добавляют по email аккаунта", async () => {
  const { result } = await renderController();
  await act(() => result.current.setInviteName("member@example.com"));
  await act(() => result.current.inviteParticipant());
  expect(api).toHaveBeenCalledWith("/meetings/team/members", "POST", {
    email: "member@example.com",
  });
});
test("удаление использует id пользователя", async () => {
  const { result } = await renderController();
  await act(() => result.current.removeParticipant("member-id"));
  expect(api).toHaveBeenCalledWith(
    "/meetings/team/members/member-id",
    "DELETE",
    undefined,
  );
});
