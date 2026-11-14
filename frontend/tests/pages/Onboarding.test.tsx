import { render, fireEvent } from "@testing-library/react-native";
import { Onboarding } from "../../src/pages/onboarding";

describe("Onboarding", () => {
  test("после последнего слайда завершает знакомство", async () => {
    const onDone = jest.fn(), onLogin = jest.fn();
    const ui = await render(<Onboarding onDone={onDone} onLogin={onLogin} />);
    await fireEvent.press(ui.getByRole("button", { name: "Далее" }));
    expect(ui.getByText("Мы подберём место за вас")).toBeOnTheScreen();
    await fireEvent.press(ui.getByRole("button", { name: "Далее" }));
    expect(onDone).not.toHaveBeenCalled();
    await fireEvent.press(ui.getByRole("button", { name: "Начать" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  test("вызывает переход ко входу", async () => {
    const onLogin = jest.fn();
    const ui = await render(<Onboarding onDone={jest.fn()} onLogin={onLogin} />);
    await fireEvent.press(ui.getByRole("button", { name: "Далее" }));
    await fireEvent.press(ui.getByRole("button", { name: "Далее" }));
    await fireEvent.press(ui.getByText("У меня уже есть аккаунт"));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
  test("позволяет пропустить знакомство", async () => {
    const onDone = jest.fn();
    const ui = await render(<Onboarding onDone={onDone} onLogin={jest.fn()} />);
    await fireEvent.press(ui.getByText("Пропустить"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
