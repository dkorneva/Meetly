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
