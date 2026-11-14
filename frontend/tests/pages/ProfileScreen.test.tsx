import { render, fireEvent } from "@testing-library/react-native";
import { ProfileScreen } from "../../src/pages/profile";
import { makeController } from ".././fixtures";

describe("ProfileScreen", () => {
  test.each([false, true])("переключает напоминания из состояния %s", async (enabled) => {
    const c = makeController();
    c.store.reminders = enabled;
    const ui = await render(<ProfileScreen controller={c} />);
    const toggle = ui.getByRole("switch", { name: "Напоминания" });
    expect(toggle.props.accessibilityState.checked).toBe(enabled);

    await fireEvent.press(toggle);

    expect(c.update).toHaveBeenCalledTimes(1);
    expect(c.update).toHaveBeenCalledWith({ reminders: !enabled });
  });

  test("передаёт включение тёмной темы", async () => {
    const c = makeController();
    const ui = await render(<ProfileScreen controller={c} />);
    expect(ui.getByText(c.store.name)).toBeOnTheScreen();
    await fireEvent.press(ui.getByRole("switch", { name: "Тёмная тема" }));
    expect(c.update).toHaveBeenCalledWith({ dark: true });
  });
  test("вызывает открытие настроек календаря", async () => {
    const c = makeController();
    const ui = await render(<ProfileScreen controller={c} />);
    await fireEvent.press(ui.getByText("Настроить"));
    expect(c.setDialog).toHaveBeenCalledWith("calendar");
  });
  test("вызывает выход из аккаунта", async () => {
    const c = makeController();
    const ui = await render(<ProfileScreen controller={c} />);
    await fireEvent.press(ui.getByText("Выйти из аккаунта"));
    expect(c.signOut).toHaveBeenCalledTimes(1);
  });
});
