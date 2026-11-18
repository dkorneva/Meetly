import { act, render, fireEvent } from "@testing-library/react-native";
import { Chat } from "../src/pages/chat";
import { openExternalLink } from "../src/shared/api/device";
import { makeController } from "./fixtures";
import { dayLabel, messageDay, continuesGroup } from "../src/pages/chat/model/messages";
import type { Message } from "../src/entities/meeting";
const message = (patch: Partial<Message> = {}): Message => ({ id: "one", name: "Анна", text: "Документ", time: "12:00", createdAt: "2026-01-01T09:00:00Z", ...patch });
test("вложение открывается системным приложением, реакции передают ID сообщения", async () => {
  const onLike = jest.fn(), onLoadOlder = jest.fn();
  const item = message({ attachment: { uri: "https://example.test/file", image: true, name: "Фото" }, liked: true });
  const ui = await render(<Chat meeting={makeController().meeting} messages={[item]} leader="Кафе" onLeader={jest.fn()} onSend={jest.fn()} onLike={onLike} onAttach={jest.fn()} hasOlderMessages onLoadOlder={onLoadOlder} />);
  await act(async () => { await fireEvent.press(ui.getByText("Документ")); });
  expect(openExternalLink).toHaveBeenCalledWith("https://example.test/file");
  await fireEvent(ui.getByText("Документ"), "longPress");
  expect(onLike).toHaveBeenCalledWith("one");
  await fireEvent.press(ui.getByLabelText("Реакция на сообщение"));
  expect(onLike).toHaveBeenCalledTimes(2);
  await fireEvent.press(ui.getByText("Загрузить более ранние сообщения"));
  expect(onLoadOlder).toHaveBeenCalledTimes(1);
});
test("день сообщения определяется по Москве, подписи сегодня и вчера учитывают дату", () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-11-18T10:00:00Z"));
  try {
    expect(dayLabel(message({ createdAt: "2026-11-18T09:00:00Z" }))).toBe("Сегодня");
    expect(dayLabel(message({ createdAt: "2026-11-17T09:00:00Z" }))).toBe("Вчера");
    expect(dayLabel(message({ createdAt: undefined }))).toBe("");
    expect(messageDay(message({ createdAt: undefined }))).toBe("");
    expect(messageDay(message({ createdAt: "2026-11-17T22:00:00Z" }))).toBe(messageDay(message({ createdAt: "2026-11-18T01:00:00Z" })));
  } finally { jest.useRealTimers(); }
});
test("группировка учитывает ID автора, день, системные сообщения и старые сообщения без ID", () => {
  const first = message({ senderId: "author" });
  expect(continuesGroup(first, message({ senderId: "author", name: "Другое имя" }))).toBe(true);
  expect(continuesGroup(first, message({ senderId: "other" }))).toBe(false);
  expect(continuesGroup(first, message({ senderId: "author", kind: "system" }))).toBe(false);
  expect(continuesGroup(message(), message())).toBe(true);
  expect(continuesGroup(message(), message({ mine: true }))).toBe(false);
  expect(continuesGroup(undefined, message())).toBe(false);
});
