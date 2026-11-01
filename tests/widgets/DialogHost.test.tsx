import { render, fireEvent } from "@testing-library/react-native";
import { DialogHost } from "../../src/widgets/dialogs";
import { makeController } from ".././fixtures";
import type { DialogName } from "../../src/shared/config/dialogs";

describe("DialogHost", () => {
  test("не показывает содержимое, если диалог не выбран", async () => {
    const ui = await render(<DialogHost controller={makeController()} />);
    expect(ui.queryByText("Закрыть")).toBeNull();
  });
  test.each<[Exclude<DialogName, null>, string]>([
    ["attachment", "Выбрать файл или фотографию"],
    ["booking", "Позвонить"],
    ["calendar", "Открыть Яндекс Календарь"],
    ["filters", "Показать места"],
    ["invite", "Добавить участника"],
    ["participants", "Пригласить"],
    ["profile", "Выбрать фотографию"],
    ["menu", "Выбрать лидера"],
  ])("показывает нужное окно %s и закрывает его", async (dialog, marker) => {
    const c = makeController({ dialog });
    const ui = await render(<DialogHost controller={c} />);
    expect(ui.getByRole("button", { name: marker })).toBeOnTheScreen();
    await fireEvent.press(ui.getByText("Закрыть"));
    expect(c.setDialog).toHaveBeenCalledWith(null);
  });
});
