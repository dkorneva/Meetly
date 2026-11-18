import { act, render, fireEvent } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { CalendarExportDialog } from "../src/features/calendar-export";
import { BookingDialog } from "../src/features/booking";
import { ProfileScreen } from "../src/pages/profile";
import { DialogHost } from "../src/widgets/dialogs";
import PlacePhoto from "../src/shared/ui/PlacePhoto";
import { makeController } from "./fixtures";
import { openExternalLink } from "../src/shared/api/device";

test("календарь экспортирует выбранную встречу и сообщает об ошибке открытия сайта", async () => {
  const c = makeController();
  c.store.calendar = true;
  const ui = await render(<CalendarExportDialog controller={c} />);
  await fireEvent.press(ui.getAllByRole("radio")[1]);
  await fireEvent.press(ui.getByRole("button", { name: /Сохранить встречу/ }));
  expect(c.exportMeeting).toHaveBeenCalledWith(c.store.meetings[1].id);
  jest.mocked(openExternalLink).mockRejectedValueOnce(new Error("Нет браузера"));
  await fireEvent.press(ui.getByRole("button", { name: "Открыть Яндекс Календарь" }));
  expect(c.showToast).toHaveBeenCalledWith("error", "Не удалось открыть Яндекс Календарь");
});
test("запрет календарного экспорта блокирует сохранение и может быть отменён пользователем", async () => {
  const c = makeController(); c.store.calendar = false;
  const ui = await render(<CalendarExportDialog controller={c} />);
  await fireEvent.press(ui.getByRole("button", { name: /Сохранить встречу/ }));
  expect(c.exportMeeting).not.toHaveBeenCalled();
  await fireEvent.press(ui.getByRole("button", { name: "Включить экспорт" }));
  expect(c.update).toHaveBeenCalledWith({ calendar: true });
});
test("бронь показывает ошибки звонка и открытия карты", async () => {
  const c = makeController();
  const ui = await render(<BookingDialog controller={c} />);
  jest.mocked(openExternalLink).mockRejectedValueOnce(new Error("Нет телефона"));
  await fireEvent.press(ui.getByRole("button", { name: "Позвонить" }));
  expect(c.showToast).toHaveBeenCalledWith("info", "Звонок доступен на телефоне");
  jest.mocked(openExternalLink).mockRejectedValueOnce(new Error("Нет карт"));
  await fireEvent.press(ui.getByRole("button", { name: "Открыть в Яндекс Картах" }));
  expect(c.showToast).toHaveBeenCalledWith("error", "Не удалось открыть карту");
});
test("профиль открывает редактирование с текущими именем и почтой", async () => {
  const c = makeController();
  const ui = await render(<ProfileScreen controller={c} />);
  await fireEvent.press(ui.getByText(c.store.name[0]));
  expect(c.setEditName).toHaveBeenCalledWith(c.store.name);
  expect(c.setEditEmail).toHaveBeenCalledWith(c.store.email);
  expect(c.setDialog).toHaveBeenCalledWith("profile");
});
test("модальное окно закрывается системной кнопкой и нажатием фона", async () => {
  const c = makeController({ dialog: "profile" });
  const ui = await render(<DialogHost controller={c} />);
  const modal = ui.container.queryAll(node => !!node.props.onRequestClose)[0];
  await fireEvent(modal, "requestClose");
  expect(c.setDialog).toHaveBeenCalledWith(null);
  const background = ui.container.queryAll(node => StyleSheet.flatten(node.props.style)?.position === "absolute")[0];
  if (!background) throw new Error("Не найден фон модального окна");
  await fireEvent.press(background);
  expect(c.setDialog).toHaveBeenCalledTimes(2);
});
test("зависшая загрузка фотографии сменяется заглушкой через 20 секунд", async () => {
  jest.useFakeTimers();
  try {
    const ui = await render(<PlacePhoto id="photo" name="Кафе" image={{ uri: "https://example.test/photo" }} style={{}} />);
    expect(ui.getByLabelText("Загрузка фото")).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(20000));
    expect(ui.getByText("Нет фото")).toBeOnTheScreen();
  } finally { jest.useRealTimers(); }
});
