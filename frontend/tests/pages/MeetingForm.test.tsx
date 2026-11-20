import { render, fireEvent } from "@testing-library/react-native";
import { MeetingForm } from "../../src/pages/meeting-form";
import { makeController } from ".././fixtures";

describe("MeetingForm", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 1, 12));
  });
  afterEach(() => jest.useRealTimers());
  test("не сохраняет пустое название", async () => {
    const onSave = jest.fn();
    const ui = await render(<MeetingForm onSave={onSave} />);
    await fireEvent.changeText(ui.getByDisplayValue(""), "   ");
    await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
    expect(ui.getByText("Введите название встречи")).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
  test("создаёт встречу с введённым названием и выбранной датой", async () => {
    const onSave = jest.fn();
    const ui = await render(<MeetingForm onSave={onSave} />);
    await fireEvent.changeText(ui.getByDisplayValue(""), " Новая встреча ");
    await fireEvent.press(ui.getByText("15"));
    await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Новая встреча",
        date: "2026-11-15",
        status: "voting",
        votes: {},
      }),
    );
  });
  test("часы и минуты выбираются отдельно, район отсутствует в форме и сохранённых данных", async () => {
    const onSave = jest.fn();
    const ui = await render(<MeetingForm onSave={onSave} />);
    await fireEvent.changeText(ui.getByDisplayValue(""), "Вечерняя встреча");
    await fireEvent.press(ui.getByText("15"));
    await fireEvent.press(ui.getByRole("combobox", {name:"Часы встречи"}));
    await fireEvent.press(ui.getByRole("button", {name:"23"}));
    await fireEvent.press(ui.getByRole("combobox", {name:"Минуты встречи"}));
    await fireEvent.press(ui.getByRole("button", {name:"47"}));
    expect(ui.queryByText("Район")).toBeNull();
    await fireEvent.press(ui.getByRole("button", {name:"Создать встречу"}));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({time:"23:47"}));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("district");
  });
  test("передаёт изменённое название, сохраняя id и результаты голосования", async () => {
    const c = makeController(),
      onSave = jest.fn();
    const ui = await render(
      <MeetingForm meeting={c.meeting} onSave={onSave} />,
    );
    await fireEvent.changeText(
      ui.getByDisplayValue(c.meeting.title),
      "Новое название",
    );
    await fireEvent.press(
      ui.getByRole("button", { name: "Сохранить предпочтения" }),
    );
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Новое название",
        id: c.meeting.id,
        votes: c.meeting.votes,
      }),
    );
  });
});


describe("MeetingForm: предпочтения и текущая дата", () => {
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
});
