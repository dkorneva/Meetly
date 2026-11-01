import { render, fireEvent } from "@testing-library/react-native";
import { AppHeader } from "../../src/widgets/navigation";
import { makeController } from ".././fixtures";

describe("AppHeader", () => {
  test.each([
    ["back", "goBack"],
    ["share", "share"],
  ] as const)("передаёт нажатие %s контроллеру", async (label, handler) => {
    const c = makeController({ screen: "detail", title: "Встреча" });
    const ui = await render(<AppHeader controller={c} />);
    expect(ui.getByText("Встреча")).toBeOnTheScreen();
    await fireEvent.press(ui.getByRole("button", { name: label }));
    expect(c[handler]).toHaveBeenCalledTimes(1);
  });
  test("вызывает открытие меню встречи", async () => {
    const c = makeController({ screen: "detail", title: "Встреча" });
    const ui = await render(<AppHeader controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "more" }));
    expect(c.setDialog).toHaveBeenCalledWith("menu");
  });
  test.each(["new", "edit"] as const)("на экране %s показывает отмену вместо меню", async (screen) => {
    const c = makeController({ screen });
    const ui = await render(<AppHeader controller={c} />);
    expect(ui.queryByRole("button", { name: "more" })).toBeNull();
    await fireEvent.press(ui.getByText("Отмена"));
    expect(c.goBack).toHaveBeenCalledTimes(1);
  });
});
