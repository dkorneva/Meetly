import { render, fireEvent } from "@testing-library/react-native";
import { MeetingForm } from "../../src/pages/meeting-form";
import { makeController } from ".././fixtures";

describe("MeetingForm", () => {
  test("не сохраняет пустое название", async () => {
    const onSave = jest.fn();
    const ui = await render(<MeetingForm onSave={onSave} />);
    await fireEvent.changeText(ui.getByDisplayValue("Ужин с командой"), "   ");
    await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
    expect(ui.getByText("Введите название встречи")).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
  test("создаёт встречу с введённым названием и выбранной датой", async () => {
    const onSave = jest.fn();
    const ui = await render(<MeetingForm onSave={onSave} />);
    await fireEvent.changeText(ui.getByDisplayValue("Ужин с командой"), " Новая встреча ");
    await fireEvent.press(ui.getByText("15"));
    await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Новая встреча", date: "2026-09-15", status: "voting", votes: {} }));
  });
  test("передаёт изменённое название, сохраняя id и результаты голосования", async () => {
    const c = makeController(), onSave = jest.fn();
    const ui = await render(<MeetingForm meeting={c.meeting} onSave={onSave} />);
    await fireEvent.changeText(ui.getByDisplayValue(c.meeting.title), "Новое название");
    await fireEvent.press(ui.getByRole("button", { name: "Сохранить предпочтения" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Новое название", id: c.meeting.id, votes: c.meeting.votes }));
  });
  test("добавляет нового участника", async () => {
    const onSave = jest.fn();
    const ui = await render(<MeetingForm onSave={onSave} />);
    await fireEvent.press(ui.getByText("Пригласить"));
    await fireEvent.changeText(ui.getByPlaceholderText("Имя участника"), "Саша");
    await fireEvent.press(ui.getByRole("button", { name: "Добавить" }));
    await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ participants: ["Аня", "Полина", "Маша", "Илья", "Саша"] }));
  });
  test("не добавляет участника с уже существующим именем", async () => {
    const onSave = jest.fn();
    const ui = await render(<MeetingForm onSave={onSave} />);
    await fireEvent.press(ui.getByText("Пригласить"));
    await fireEvent.changeText(ui.getByPlaceholderText("Имя участника"), " Полина ");
    await fireEvent.press(ui.getByRole("button", { name: "Добавить" }));
    await fireEvent.press(ui.getByRole("button", { name: "Создать встречу" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ participants: ["Аня", "Полина", "Маша", "Илья"] }));
  });
});
