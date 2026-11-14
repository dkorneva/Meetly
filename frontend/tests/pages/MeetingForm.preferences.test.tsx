import { render, fireEvent } from "@testing-library/react-native";
import { MeetingForm } from "../../src/pages/meeting-form";

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 1, 12));
});
afterEach(() => jest.useRealTimers());

test("новая встреча по умолчанию использует текущую дату", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-11-01" }));
});

test("выбор прошедшей даты блокирует создание встречи", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.press(ui.getByLabelText("Предыдущий месяц"));
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(ui.getByText("Дата и время встречи должны быть позже текущего момента")).toBeOnTheScreen();
  expect(onSave).not.toHaveBeenCalled();
});

test("ошибка имени показывается, участник не попадает в сохраняемый список", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.press(ui.getByText("Пригласить"));
  await fireEvent.changeText(ui.getByPlaceholderText("Имя участника"), "Саша1");
  await fireEvent.press(ui.getByRole("button", { name: "Добавить" }));
  expect(ui.getByText("Допустимы буквы, пробел и дефис; пробелы по краям запрещены")).toBeOnTheScreen();
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ participants: ["Аня", "Полина", "Маша", "Илья"] }));
});

test("сохраняет выбранный ползунком бюджет", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent(ui.getByLabelText("Бюджет на человека"), "valueChange", 5000);
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ budget: 5000 }));
});

test("позволяет сохранить отсутствие предпочтений по кухне", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.press(ui.getByText("Итальянская"));
  await fireEvent.press(ui.getByText("Кофе"));
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ cuisines: [] }));
});

test("сохраняет выбранные район и формат", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.press(ui.getByText("Центр"));
  await fireEvent.press(ui.getByText("Арбат"));
  await fireEvent.press(ui.getByText("На улице"));
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ district: "Арбат", format: "На улице" }));
});
