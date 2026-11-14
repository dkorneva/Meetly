import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppController } from "../src/app/model/useAppController";
import { saveStore } from "../src/app/lib/storage/localStore";
import { makeController } from "./fixtures";

jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

beforeEach(async () => {
  await AsyncStorage.clear();
  const store = makeController().store;
  store.meetings.find((meeting) => meeting.id === "team")!.participants = ["Аня", "Полина"];
  await saveStore(store);
});

test("добавляет корректного участника, очищает поле и закрывает приглашение", async () => {
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.loaded).toBe(true));
  await act(() => {
    result.current.setInviteName("Анна-Мария");
    result.current.setDialog("invite");
  });

  await act(() => result.current.inviteParticipant());

  expect(result.current.meeting.participants).toEqual(["Аня", "Полина", "Анна-Мария"]);
  expect(result.current.inviteName).toBe("");
  expect(result.current.dialog).toBeNull();
});

test.each(["Саша1", "пОлИнА"])("контроллер отклоняет имя %s и сохраняет окно открытым", async (name) => {
  const { result } = await renderHook(() => useAppController());
  await waitFor(() => expect(result.current.loaded).toBe(true));
  await act(() => {
    result.current.setInviteName(name);
    result.current.setDialog("invite");
  });

  await act(() => result.current.inviteParticipant());

  expect(result.current.meeting.participants).toEqual(["Аня", "Полина"]);
  expect(result.current.inviteName).toBe(name);
  expect(result.current.dialog).toBe("invite");
  expect(result.current.toast).toMatchObject({ type: "error" });
});
