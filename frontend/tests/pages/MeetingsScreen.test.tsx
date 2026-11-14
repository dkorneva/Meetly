import { render, fireEvent } from "@testing-library/react-native";
import { MeetingsScreen } from "../../src/pages/meetings";
import { makeController } from ".././fixtures";

describe("MeetingsScreen", () => {
  test("передаёт идентификатор открываемой встречи", async () => {
    const c = makeController();
    const ui = await render(<MeetingsScreen controller={c} />);
    await fireEvent.press(ui.getByText(c.meeting.title));
    expect(c.openMeeting).toHaveBeenCalledWith(c.meeting.id);
  });
  test("передаёт поисковую строку контроллеру", async () => {
    const c = makeController();
    const ui = await render(<MeetingsScreen controller={c} />);
    await fireEvent.changeText(ui.getByPlaceholderText("Поиск по встречам"), "Кофе");
    expect(c.setSearch).toHaveBeenCalledWith("Кофе");
  });
  test("вызывает переключение на завершённые встречи", async () => {
    const c = makeController();
    const ui = await render(<MeetingsScreen controller={c} />);
    await fireEvent.press(ui.getByRole("tab", { name: "Завершённые" }));
    expect(c.setMeetingSection).toHaveBeenCalledWith("completed");
  });
  test("вызывает переход к созданию встречи", async () => {
    const c = makeController();
    const ui = await render(<MeetingsScreen controller={c} />);
    await fireEvent.press(ui.getByLabelText("Создать встречу"));
    expect(c.setScreen).toHaveBeenCalledWith("new");
  });
  test("объясняет отсутствие результатов поиска", async () => {
    const c = makeController({ matchingMeetings: [], search: "Нет такой встречи" });
    const ui = await render(<MeetingsScreen controller={c} />);
    expect(ui.getByText("Встречи не найдены")).toBeOnTheScreen();
  });
});
