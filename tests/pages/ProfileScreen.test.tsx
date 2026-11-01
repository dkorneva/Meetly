import { render, fireEvent } from "@testing-library/react-native";
import { ProfileScreen } from "../../src/pages/profile";
import { makeController } from ".././fixtures";

describe("ProfileScreen", () => {
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
