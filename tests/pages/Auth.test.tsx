import { render, fireEvent } from "@testing-library/react-native";
import { Auth } from "../../src/pages/auth";

describe("Auth", () => {
  const props = () => ({ register: true, onSwitch: jest.fn(), onBack: jest.fn(), onEnter: jest.fn() });
  test.each([
    ["", "mail@example.ru", "12345678", "Укажите имя"],
    ["Маша", "непочта", "12345678", "Введите корректную электронную почту"],
    ["Маша", "mail@example.ru", "123", "Пароль должен содержать не менее 8 символов"],
  ])("проверяет поля: %s / %s", async (name, email, password, error) => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    await fireEvent.changeText(ui.getByPlaceholderText("Как к вам обращаться"), name);
    await fireEvent.changeText(ui.getByPlaceholderText("name@example.ru"), email);
    await fireEvent.changeText(ui.getByPlaceholderText("Не менее 8 символов"), password);
    await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
    expect(ui.getByText(error)).toBeOnTheScreen();
    expect(p.onEnter).not.toHaveBeenCalled();
  });
  test("передаёт корректные данные родителю", async () => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    await fireEvent.changeText(ui.getByPlaceholderText("Как к вам обращаться"), " Маша ");
    await fireEvent.changeText(ui.getByPlaceholderText("name@example.ru"), "mail@example.ru");
    await fireEvent.changeText(ui.getByPlaceholderText("Не менее 8 символов"), "12345678");
    await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
    expect(p.onEnter).toHaveBeenCalledWith("Маша", "mail@example.ru");
  });
  test("режим входа скрывает имя", async () => {
    const p = { ...props(), register: false };
    const ui = await render(<Auth {...p} />);
    expect(ui.queryByPlaceholderText("Как к вам обращаться")).toBeNull();
  });
  test("позволяет показать и снова скрыть пароль", async () => {
    const ui = await render(<Auth {...props()} register={false} />);
    const input = ui.getByPlaceholderText("Введите пароль");
    expect(input.props.secureTextEntry).toBe(true);
    await fireEvent.press(ui.getByText("Показать"));
    expect(ui.getByPlaceholderText("Введите пароль").props.secureTextEntry).toBe(false);
    await fireEvent.press(ui.getByText("Скрыть"));
    expect(ui.getByPlaceholderText("Введите пароль").props.secureTextEntry).toBe(true);
  });
  test("вызывает возврат", async () => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    await fireEvent.press(ui.getByText("Назад"));
    expect(p.onBack).toHaveBeenCalledTimes(1);
  });
  test("из формы входа вызывает переход к регистрации", async () => {
    const p = { ...props(), register: false };
    const ui = await render(<Auth {...p} />);
    await fireEvent.press(ui.getByText("Зарегистрироваться"));
    expect(p.onSwitch).toHaveBeenCalledTimes(1);
  });
});
