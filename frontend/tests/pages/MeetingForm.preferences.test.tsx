import { render, fireEvent } from "@testing-library/react-native";
import { MeetingForm } from "../../src/pages/meeting-form";

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 1, 12));
});
afterEach(() => jest.useRealTimers());

test("сохраняет более шести кухонь каталога и бюджет выше 5000", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.changeText(ui.getByDisplayValue(""), "Встреча с полными фильтрами");
  for (const name of ["Грузинская", "Чешская", "Азербайджанская", "Веганская", "Суши"]) await fireEvent.press(ui.getByText(name));
  expect(ui.getByLabelText("Бюджет на человека").props.maximumValue).toBe(7200);
  await fireEvent(ui.getByLabelText("Бюджет на человека"), "valueChange", 7200);
  await fireEvent.press(ui.getByRole("button", {name:"Создать встречу"}));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({budget:7200,cuisines:expect.arrayContaining(["Грузинская","Чешская","Азербайджанская","Веганская","Суши"])}));
  expect(onSave.mock.calls[0][0].cuisines).toHaveLength(7);
});

test("новая встреча по умолчанию использует текущую дату", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.changeText(ui.getByDisplayValue(""), "Новая встреча");
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ date: "2026-11-01" }),
  );
});

test("выбор прошедшей даты блокирует создание встречи", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.changeText(ui.getByDisplayValue(""), "Новая встреча");
  await fireEvent.press(ui.getByLabelText("Предыдущий месяц"));
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(
    ui.getByText("Дата и время встречи должны быть позже текущего момента"),
  ).toBeOnTheScreen();
  expect(onSave).not.toHaveBeenCalled();
});

test("сохраняет выбранный ползунком бюджет", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.changeText(ui.getByDisplayValue(""), "Новая встреча");
  await fireEvent(ui.getByLabelText("Бюджет на человека"), "valueChange", 5000);
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ budget: 5000 }),
  );
});

test("позволяет сохранить отсутствие предпочтений по кухне", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.changeText(ui.getByDisplayValue(""), "Новая встреча");
  await fireEvent.press(ui.getByText("Итальянская"));
  await fireEvent.press(ui.getByText("Кофе"));
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ cuisines: [] }),
  );
});

test("сохраняет формат без выбора района", async () => {
  const onSave = jest.fn();
  const ui = await render(<MeetingForm onSave={onSave} />);
  await fireEvent.changeText(ui.getByDisplayValue(""), "Новая встреча");
  await fireEvent.press(ui.getByText("На улице"));
  await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ format: "На улице" }),
  );
});
