import { Linking, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: jest.fn(), Paths: { cache: "cache" } }));
const device = jest.requireActual<typeof import("../src/shared/api/device")>("../src/shared/api/device");
const calendar = jest.requireActual<typeof import("../src/features/calendar-export/lib/exportCalendar")>("../src/features/calendar-export/lib/exportCalendar");

test("отмена выбора фото и вложения не создаёт файл", async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null });
  jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });
  expect(await device.chooseAvatar()).toBeNull();
  expect(await device.chooseAttachment()).toBeNull();
});
test("фото без имени получает имя и MIME-тип JPEG", async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: "file:///photo", width: 10, height: 10 }] });
  expect(await device.chooseAvatar()).toEqual({ uri: "file:///photo", name: "avatar.jpg", mimeType: "image/jpeg" });
});
test.each(["image/png", "application/pdf", undefined])("выбор вложения сохраняет тип %s и признак изображения", async mimeType => {
  jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: "file:///doc", name: "doc", lastModified: 0, mimeType }] });
  expect(await device.chooseAttachment()).toEqual({ uri: "file:///doc", name: "doc", mimeType: mimeType ?? "application/octet-stream", image: mimeType === "image/png" });
});
test("именованное фото сохраняет исходные данные", async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: "photo", fileName: "photo.png", mimeType: "image/png", width: 10, height: 10 }] });
  expect(await device.chooseAvatar()).toEqual({ uri: "photo", name: "photo.png", mimeType: "image/png" });
});
test("ошибка системного выбора передаётся вызывающему коду", async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockRejectedValue(new Error("Нет доступа к фото"));
  await expect(device.chooseAvatar()).rejects.toThrow("Нет доступа к фото");
});
test("внешняя ссылка передаётся операционной системе", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await device.openExternalLink("tel:+79990000000");
  expect(open).toHaveBeenCalledWith("tel:+79990000000");
  open.mockRestore();
});
test("экспорт на телефоне записывает ICS и открывает меню отправки", async () => {
  const write = jest.fn();
  require("expo-file-system").File.mockImplementation(() => ({ write, uri: "file:///event.ics" }));
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
  await calendar.exportCalendar("BEGIN:VCALENDAR", "one");
  expect(write).toHaveBeenCalledWith("BEGIN:VCALENDAR");
  expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///event.ics", { mimeType: "text/calendar", UTI: "public.calendar-event" });
});
test("экспорт сообщает, что отправка недоступна на устройстве", async () => {
  require("expo-file-system").File.mockImplementation(() => ({ write: jest.fn(), uri: "file:///event.ics" }));
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(false);
  await expect(calendar.exportCalendar("text", "one")).rejects.toThrow("недоступна отправка");
  expect(Sharing.shareAsync).not.toHaveBeenCalled();
});
test("web-экспорт скачивает ICS и освобождает временный URL", async () => {
  const os = Platform.OS;
  const previousDocument = global.document;
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
  const click = jest.fn(), link = { href: "", download: "", click };
  jest.useFakeTimers();
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  global.document = { createElement: jest.fn(() => link) } as any;
  URL.createObjectURL = jest.fn(() => "blob:calendar");
  URL.revokeObjectURL = jest.fn();
  try {
    await calendar.exportCalendar("text", "one");
    expect(link.download).toBe("meetly-one.ics");
    expect(link.href).toBe("blob:calendar");
    expect(click).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:calendar");
  } finally {
    Object.defineProperty(Platform, "OS", { value: os });
    global.document = previousDocument;
    URL.createObjectURL = create; URL.revokeObjectURL = revoke;
    jest.useRealTimers();
  }
});
