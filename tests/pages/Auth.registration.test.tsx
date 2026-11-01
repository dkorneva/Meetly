import { render, fireEvent } from "@testing-library/react-native";
import { Auth } from "../../src/pages/auth";

async function registration() {
  const onEnter = jest.fn();
  const ui = await render(<Auth register onSwitch={jest.fn()} onBack={jest.fn()} onEnter={onEnter} />);
  await fireEvent.changeText(ui.getByPlaceholderText("Как к вам обращаться"), "Маша");
  await fireEvent.changeText(ui.getByPlaceholderText("name@example.ru"), "mail@example.ru");
  await fireEvent.changeText(ui.getByPlaceholderText("Не менее 6 символов"), "Qw1!er");
  await fireEvent.changeText(ui.getByPlaceholderText("Повторите пароль"), "Qw1!er");
  return { ui, onEnter };
}

test("регистрация передаёт корректное имя и почту", async () => {
  const { ui, onEnter } = await registration();
  await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(onEnter).toHaveBeenCalledWith("Маша", "mail@example.ru");
});

test.each([
  ["Как к вам обращаться", " Маша ", "Допустимы буквы, пробел и дефис; пробелы по краям запрещены"],
  ["Не менее 6 символов", "abcdef", "Пароль должен содержать строчную и заглавную латинские буквы, цифру и специальный символ"],
  ["Повторите пароль", "", "Подтвердите пароль"],
  ["Повторите пароль", "Qw1!other", "Пароли не совпадают"],
])("блокирует регистрацию при ошибке поля %s: %s", async (field, value, error) => {
  const { ui, onEnter } = await registration();
  await fireEvent.changeText(ui.getByPlaceholderText(field), value);
  await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
  expect(ui.getByText(error)).toBeOnTheScreen();
  expect(onEnter).not.toHaveBeenCalled();
});

test("повторно проверяет подтверждение при изменении основного пароля", async () => {
  const { ui, onEnter } = await registration();
  await fireEvent.changeText(ui.getByPlaceholderText("Не менее 6 символов"), "NewPass1!");
  expect(ui.getByText("Пароли не совпадают")).toBeOnTheScreen();
  await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
  expect(onEnter).not.toHaveBeenCalled();
  await fireEvent.changeText(ui.getByPlaceholderText("Повторите пароль"), "NewPass1!");
  expect(ui.queryByText("Пароли не совпадают")).toBeNull();
  await fireEvent.press(ui.getByRole("button", { name: "Создать аккаунт" }));
  expect(onEnter).toHaveBeenCalledTimes(1);
});
