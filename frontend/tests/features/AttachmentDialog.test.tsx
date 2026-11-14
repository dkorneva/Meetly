import { render, fireEvent } from "@testing-library/react-native";
import { AttachmentDialog } from "../../src/features/attach-message";
import { makeController } from ".././fixtures";

describe("AttachmentDialog", () => {
  test.each([
    ["Выбрать файл или фотографию", "pickAttachment"],
    ["Поделиться выбранным местом", "sharePlaceInChat"],
  ] as const)("передаёт действие «%s» контроллеру", async (label, handler) => {
    const c = makeController();
    const ui = await render(<AttachmentDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: label }));
    expect(c[handler]).toHaveBeenCalledTimes(1);
  });
});
