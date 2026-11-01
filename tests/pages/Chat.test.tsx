import { render, fireEvent } from "@testing-library/react-native";
import { Chat } from "../../src/pages/chat";
import { restaurants } from "../../src/entities/meeting";
import { makeController } from ".././fixtures";

describe("Chat", () => {
  const props = () => ({ meeting: makeController().meeting, messages: [], leader: restaurants[0].name, onLeader: jest.fn(), onSend: jest.fn(), onLike: jest.fn(), onAttach: jest.fn() });
  test("отправляет очищенный текст и очищает поле", async () => {
    const p = props();
    const ui = await render(<Chat {...p} />);
    await fireEvent.changeText(ui.getByPlaceholderText("Сообщение"), " Привет! ");
    await fireEvent.press(ui.getByLabelText("Отправить сообщение"));
    expect(p.onSend).toHaveBeenCalledWith("Привет!");
    expect(ui.getByPlaceholderText("Сообщение").props.value).toBe("");
  });
  test("не отправляет сообщение из пробелов", async () => {
    const p = props();
    const ui = await render(<Chat {...p} />);
    await fireEvent.changeText(ui.getByPlaceholderText("Сообщение"), "   ");
    await fireEvent.press(ui.getByLabelText("Отправить сообщение"));
    expect(p.onSend).not.toHaveBeenCalled();
  });
  test("вызывает открытие вложений", async () => {
    const p = props();
    const ui = await render(<Chat {...p} />);
    await fireEvent.press(ui.getByLabelText("Прикрепить файл"));
    expect(p.onAttach).toHaveBeenCalledTimes(1);
  });
  test("показывает системное сообщение и карточку выбранного места", async () => {
    const p = props();
    const messages = [
      { id: "sys", name: "", time: "", kind: "system" as const, text: "Встреча создана" },
      { id: "place", name: "", time: "", kind: "selected" as const, text: "Терраса завтра" },
    ];
    const ui = await render(<Chat {...p} messages={messages} />);
    expect(ui.getByText("Встреча создана")).toBeOnTheScreen();
    expect(ui.getByText("Место выбрано")).toBeOnTheScreen();
    expect(ui.getByText("Терраса завтра")).toBeOnTheScreen();
  });
  test("передаёт идентификатор сообщения при долгом нажатии", async () => {
    const p = props();
    const ui = await render(<Chat {...p} messages={[{ id: "msg", name: "Маша", time: "12:00", text: "Привет" }]} />);
    await fireEvent(ui.getByText("Привет"), "longPress");
    expect(p.onLike).toHaveBeenCalledWith("msg");
  });
});
