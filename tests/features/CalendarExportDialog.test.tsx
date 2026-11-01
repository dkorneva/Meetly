import { render, fireEvent } from "@testing-library/react-native";
import { CalendarExportDialog } from "../../src/features/calendar-export";
import { openExternalLink } from "../../src/shared/api/device";
import { makeController } from ".././fixtures";

describe("CalendarExportDialog", () => {
  test("открывает сайт Яндекс Календаря", async () => {
    const c = makeController();
    const ui = await render(<CalendarExportDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Открыть Яндекс Календарь" }));
    expect(openExternalLink).toHaveBeenCalledWith("https://calendar.yandex.ru/");
  });
  test("меняет выбранную встречу", async () => {
    const c = makeController();
    const ui = await render(<CalendarExportDialog controller={c} />);
    const options = ui.getAllByRole("radio");
    expect(options[0]).toBeChecked();
    expect(options[1]).not.toBeChecked();
    await fireEvent.press(options[1]);
    expect(ui.getAllByRole("radio")[1]).toBeChecked();
    expect(ui.getAllByRole("radio")[0]).not.toBeChecked();
  });
  test("выключает экспорт и закрывает окно", async () => {
    const c = makeController();
    const ui = await render(<CalendarExportDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Выключить экспорт" }));
    expect(c.update).toHaveBeenCalledWith({ calendar: false });
    expect(c.setDialog).toHaveBeenCalledWith(null);
  });
});
