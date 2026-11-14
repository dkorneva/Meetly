import { render, fireEvent } from "@testing-library/react-native";
import { BottomNavigation } from "../../src/widgets/navigation";
import { makeController } from ".././fixtures";

describe("BottomNavigation", () => {
  test.each([["Встречи", "meetings"], ["Карта", "map"], ["Чат", "chat"], ["Профиль", "profile"]])("открывает %s", async (label, target) => {
    const c = makeController();
    const ui = await render(<BottomNavigation controller={c} />);
    await fireEvent.press(ui.getByText(label));
    expect(c.setScreen).toHaveBeenCalledWith(target);
  });
});
