import { act } from "@testing-library/react-native";
import { api, upload, setTokens } from "../src/shared/api/client";
import { renderController, controllerStore } from "./controllerFixture";
import { chooseAvatar, chooseAttachment } from "../src/shared/api/device";
import { exportCalendar } from "../src/features/calendar-export/lib/exportCalendar";
import { Share } from "react-native";
import { restaurants } from "./data";

jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

describe("controller", () => {
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


  describe("Участники", () => {
    test("удаление использует id пользователя", async () => {
      const { result } = await renderController();
      await act(() => result.current.removeParticipant("member-id"));
      expect(api).toHaveBeenCalledWith(
        "/meetings/team/members/member-id",
        "DELETE",
        undefined,
      );
    });
  });


  describe("Голосование", () => {
    test("голос отправляется серверу без имени подставного пользователя", async () => {
      const { result } = await renderController();
      await act(() => result.current.vote("restaurant"));
      expect(api).toHaveBeenCalledWith("/meetings/team/vote", "PUT", {
        restaurantId: "restaurant",
      });
    });
  });


  describe("Профиль", () => {
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
  });
});

describe("controller.actions", () => {
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
});

describe("controller.meetings", () => {
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
});
