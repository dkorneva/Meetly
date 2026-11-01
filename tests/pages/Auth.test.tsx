import { render, fireEvent } from "@testing-library/react-native";
import { Auth } from "../../src/pages/auth";

const props = () => ({ register: false, onSwitch: jest.fn(), onBack: jest.fn(), onEnter: jest.fn() });

describe("Auth: вход и управление формой", () => {
  test.each([
    ["", "x", "Введите электронную почту"],
    ["непочта", "x", "Введите корректную электронную почту"],
    ["mail@example.ru", "", "Введите пароль"],
  ])("блокирует вход: %s / %s", async (email, password, error) => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    await fireEvent.changeText(ui.getByPlaceholderText("name@example.ru"), email);
    await fireEvent.changeText(ui.getByPlaceholderText("Введите пароль"), password);
    await fireEvent.press(ui.getByRole("button", { name: "Войти" }));
    expect(ui.getByText(error)).toBeOnTheScreen();
    expect(p.onEnter).not.toHaveBeenCalled();
  });

  test("при входе принимает непустой пароль без проверки сложности", async () => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    expect(ui.queryByPlaceholderText("Как к вам обращаться")).toBeNull();
    expect(ui.queryByPlaceholderText("Повторите пароль")).toBeNull();
    await fireEvent.changeText(ui.getByPlaceholderText("name@example.ru"), "mail@example.ru");
    await fireEvent.changeText(ui.getByPlaceholderText("Введите пароль"), "x");
    await fireEvent.press(ui.getByRole("button", { name: "Войти" }));
    expect(p.onEnter).toHaveBeenCalledWith("Аня", "mail@example.ru");
  });

  test("позволяет показать и снова скрыть пароль", async () => {
    const ui = await render(<Auth {...props()} />);
    expect(ui.getByPlaceholderText("Введите пароль").props.secureTextEntry).toBe(true);
    await fireEvent.press(ui.getByText("Показать"));
    expect(ui.getByPlaceholderText("Введите пароль").props.secureTextEntry).toBe(false);
    await fireEvent.press(ui.getByText("Скрыть"));
    expect(ui.getByPlaceholderText("Введите пароль").props.secureTextEntry).toBe(true);
  });

  test.each([
    ["Назад", "onBack"],
    ["Зарегистрироваться", "onSwitch"],
  ] as const)("обрабатывает «%s»", async (label, handler) => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    await fireEvent.press(ui.getByText(label));
    expect(p[handler]).toHaveBeenCalledTimes(1);
  });
});
