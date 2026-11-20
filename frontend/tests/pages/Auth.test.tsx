import { render, fireEvent } from "@testing-library/react-native";
import { Auth } from "../../src/pages/auth";

const props = () => ({
  register: false,
  onSwitch: jest.fn(),
  onBack: jest.fn(),
  onEnter: jest.fn(),
});

describe("Auth: вход и управление формой", () => {
  test.each([
    ["", "x", "Введите электронную почту"],
    ["непочта", "x", "Введите корректную электронную почту"],
    ["mail@example.ru", "", "Введите пароль"],
  ])("блокирует вход: %s / %s", async (email, password, error) => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    await fireEvent.changeText(
      ui.getByPlaceholderText("name@example.ru"),
      email,
    );
    await fireEvent.changeText(
      ui.getByPlaceholderText("Введите пароль"),
      password,
    );
    await fireEvent.press(ui.getByRole("button", { name: "Войти" }));
    expect(ui.getByText(error)).toBeOnTheScreen();
    expect(p.onEnter).not.toHaveBeenCalled();
  });

  test("при входе принимает непустой пароль без проверки сложности", async () => {
    const p = props();
    const ui = await render(<Auth {...p} />);
    expect(ui.queryByPlaceholderText("Как к вам обращаться")).toBeNull();
    expect(ui.queryByPlaceholderText("Повторите пароль")).toBeNull();
    await fireEvent.changeText(
      ui.getByPlaceholderText("name@example.ru"),
      "mail@example.ru",
    );
    await fireEvent.changeText(ui.getByPlaceholderText("Введите пароль"), "x");
    await fireEvent.press(ui.getByRole("button", { name: "Войти" }));
    expect(p.onEnter).toHaveBeenCalledWith("", "mail@example.ru", "x");
  });

  test("позволяет показать и снова скрыть пароль", async () => {
    const ui = await render(<Auth {...props()} />);
    expect(
      ui.getByPlaceholderText("Введите пароль").props.secureTextEntry,
    ).toBe(true);
    await fireEvent.press(ui.getByText("Показать"));
    expect(
      ui.getByPlaceholderText("Введите пароль").props.secureTextEntry,
    ).toBe(false);
    await fireEvent.press(ui.getByText("Скрыть"));
    expect(
      ui.getByPlaceholderText("Введите пароль").props.secureTextEntry,
    ).toBe(true);
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


describe("Auth: регистрация", () => {
  async function registration() {
    const onEnter = jest.fn();
    const ui = await render(
      <Auth register onSwitch={jest.fn()} onBack={jest.fn()} onEnter={onEnter} />,
    );
    await fireEvent.changeText(
      ui.getByPlaceholderText("Как к вам обращаться"),
      "Маша",
    );
    await fireEvent.changeText(
      ui.getByPlaceholderText("name@example.ru"),
      "mail@example.ru",
    );
    await fireEvent.changeText(
      ui.getByPlaceholderText("Не менее 8 символов"),
      "Qw1!erty",
    );
    await fireEvent.changeText(
      ui.getByPlaceholderText("Повторите пароль"),
      "Qw1!erty",
    );
    return { ui, onEnter };
  }

  test("регистрация передаёт корректное имя и почту", async () => {
    const { ui, onEnter } = await registration();
    await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter).toHaveBeenCalledWith("Маша", "mail@example.ru", "Qw1!erty");
  });

  test.each([
    [
      "Как к вам обращаться",
      " Маша ",
      "Допустимы буквы, пробел и дефис; пробелы по краям запрещены",
    ],
    [
      "Не менее 8 символов",
      "abcdefgh",
      "Пароль должен содержать строчную и заглавную латинские буквы, цифру и специальный символ",
    ],
    ["Повторите пароль", "", "Подтвердите пароль"],
    ["Повторите пароль", "Qw1!other", "Пароли не совпадают"],
  ])(
    "блокирует регистрацию при ошибке поля %s: %s",
    async (field, value, error) => {
      const { ui, onEnter } = await registration();
      await fireEvent.changeText(ui.getByPlaceholderText(field), value);
      await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
      expect(ui.getByText(error)).toBeOnTheScreen();
      expect(onEnter).not.toHaveBeenCalled();
    },
  );

  test("повторно проверяет подтверждение при изменении основного пароля", async () => {
    const { ui, onEnter } = await registration();
    await fireEvent.changeText(
      ui.getByPlaceholderText("Не менее 8 символов"),
      "NewPass1!",
    );
    expect(ui.getByText("Пароли не совпадают")).toBeOnTheScreen();
    await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
    expect(onEnter).not.toHaveBeenCalled();
    await fireEvent.changeText(
      ui.getByPlaceholderText("Повторите пароль"),
      "NewPass1!",
    );
    expect(ui.queryByText("Пароли не совпадают")).toBeNull();
    await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
