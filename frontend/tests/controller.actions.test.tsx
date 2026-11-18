import { act } from "@testing-library/react-native";
import { api, upload, setTokens } from "../src/shared/api/client";
import { chooseAvatar, chooseAttachment } from "../src/shared/api/device";
import { exportCalendar } from "../src/features/calendar-export/lib/exportCalendar";
import { Share } from "react-native";
import { renderController } from "./controllerFixture";
import { restaurants } from "./data";

test("выбранный аватар загружается, затем привязывается к профилю", async () => {
  const { result } = await renderController();
  jest.mocked(chooseAvatar).mockResolvedValueOnce({ uri: "photo", name: "photo.jpg", mimeType: "image/jpeg" });
  jest.mocked(upload).mockResolvedValueOnce({ id: "avatar", url: "url", name: "photo.jpg", mime: "image/jpeg" });
  await act(() => result.current.pickAvatar());
  expect(upload).toHaveBeenCalledWith("photo", "photo.jpg", "image/jpeg");
  expect(api).toHaveBeenCalledWith("/users/me", "PATCH", { avatarId: "avatar" });
});
test("отмена выбора фото не изменяет профиль", async () => {
  const { result } = await renderController();
  jest.mocked(chooseAvatar).mockResolvedValueOnce(null);
  await act(() => result.current.pickAvatar());
  expect(upload).not.toHaveBeenCalled();
  expect(jest.mocked(api).mock.calls.some(([path, method]) => path === "/users/me" && method === "PATCH")).toBe(false);
});
test("ошибка загрузки фото видна пользователю, профиль не изменяется", async () => {
  const { result } = await renderController();
  jest.mocked(chooseAvatar).mockResolvedValueOnce({ uri: "photo", name: "p.jpg", mimeType: "image/jpeg" });
  jest.mocked(upload).mockRejectedValueOnce(new Error("Нет сети"));
  await act(() => result.current.pickAvatar());
  expect(result.current.toast?.message).toBe("Нет сети");
  expect(result.current.busy).toBe(false);
  expect(jest.mocked(api).mock.calls.some(([path, method]) => path === "/users/me" && method === "PATCH")).toBe(false);
});
test("вложение загружается в выбранную встречу и отправляется сообщением", async () => {
  const { result } = await renderController();
  const id = result.current.meeting!.id;
  jest.mocked(chooseAttachment).mockResolvedValueOnce({ uri: "doc", name: "report.pdf", mimeType: "application/pdf", image: false });
  jest.mocked(upload).mockResolvedValueOnce({ id: "attachment", url: "url", name: "report.pdf", mime: "application/pdf" });
  await act(() => result.current.pickAttachment());
  expect(upload).toHaveBeenCalledWith("doc", "report.pdf", "application/pdf", id);
  expect(api).toHaveBeenCalledWith(`/meetings/${id}/messages`, "POST", { text: "report.pdf", fileId: "attachment" });
  expect(result.current.dialog).toBeNull();
});
test("отмена выбора вложения не отправляет сообщение", async () => {
  const { result } = await renderController();
  jest.mocked(chooseAttachment).mockResolvedValueOnce(null);
  await act(() => result.current.pickAttachment());
  expect(upload).not.toHaveBeenCalled();
});
test.each([
  ["selectLeader", "/select", "POST"],
  ["cancelCurrentBooking", "/booking", "DELETE"],
])("действие %s отправляет запрос и закрывает диалог", async (action, suffix, method) => {
  const { result } = await renderController();
  const id = result.current.meeting!.id;
  await act(() => result.current.setDialog("menu"));
  await act(() => (result.current[action as "selectLeader"] as () => Promise<void>)());
  expect(api).toHaveBeenCalledWith(`/meetings/${id}${suffix}`, method, ...(method === "POST" ? [{}] : []));
  expect(result.current.dialog).toBeNull();
});
test("бронь требует выбора ресторана, после подтверждения открывает завершённые встречи", async () => {
  const { result } = await renderController();
  const id = result.current.meeting!.id;
  await act(() => result.current.confirmCurrentBooking());
  expect(result.current.toast?.message).toBe("Выберите заведение");
  await act(() => result.current.book(restaurants[0]));
  expect(result.current.dialog).toBe("booking");
  await act(() => result.current.confirmCurrentBooking());
  expect(api).toHaveBeenCalledWith(`/meetings/${id}/booking`, "POST", { restaurantId: restaurants[0].id });
  expect(result.current.screen).toBe("meetings");
  expect(result.current.meetingSection).toBe("completed");
});
test("нельзя забронировать невыбранное место", async () => {
  const { result } = await renderController();
  await act(() => result.current.book(undefined));
  expect(result.current.toast?.message).toContain("завершите голосование");
});
test("приглашение по email убирает пробелы и очищает поле", async () => {
  const { result } = await renderController();
  const id = result.current.meeting!.id;
  await act(() => result.current.setInviteName(" friend@example.com "));
  await act(() => result.current.inviteParticipant());
  expect(api).toHaveBeenCalledWith(`/meetings/${id}/members`, "POST", { email: "friend@example.com" });
  expect(result.current.inviteName).toBe("");
});
test("календарный экспорт получает файл с сервера и передаёт системному экспорту", async () => {
  const { result } = await renderController();
  jest.mocked(api).mockResolvedValueOnce("BEGIN:VCALENDAR");
  await act(() => result.current.exportMeeting("one"));
  expect(api).toHaveBeenCalledWith("/meetings/one/calendar.ics");
  expect(exportCalendar).toHaveBeenCalledWith("BEGIN:VCALENDAR", "one");
});
test("ссылка приглашения передаётся системному меню отправки", async () => {
  const share = jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
  try {
    const { result } = await renderController();
    jest.mocked(api).mockResolvedValueOnce({ url: "meetly://invite?token=test" });
    await act(() => result.current.share());
    expect(share).toHaveBeenCalledWith({ message: expect.stringContaining("meetly://invite?token=test") });
  } finally { share.mockRestore(); }
});
test("выход очищает сессию, выбранную встречу и открытый диалог", async () => {
  const { result } = await renderController();
  await act(() => result.current.setDialog("profile"));
  await act(() => result.current.signOut());
  expect(setTokens).toHaveBeenCalledWith(null);
  expect(result.current.store.session).toBe(false);
  expect(result.current.selected).toBe("");
  expect(result.current.dialog).toBeNull();
  expect(result.current.screen).toBe("login");
});
test("действия без выбранной встречи показывают ошибку и не отправляют запрос", async () => {
  const { result } = await renderController();
  await act(() => result.current.openMeeting("missing"));
  jest.mocked(api).mockClear();
  await act(() => result.current.sendMessage("Привет"));
  expect(result.current.toast?.message).toContain("выберите встречу");
  expect(api).not.toHaveBeenCalled();
  await act(() => result.current.dismissToast());
  expect(result.current.toast).toBeNull();
});
