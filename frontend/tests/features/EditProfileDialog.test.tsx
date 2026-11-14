import { render, fireEvent } from "@testing-library/react-native";
import { EditProfileDialog } from "../../src/features/edit-profile";
import { makeController } from ".././fixtures";

describe("EditProfileDialog", () => {
  test("передаёт изменения полей профиля контроллеру", async () => {
    const c = makeController();
    const ui = await render(<EditProfileDialog controller={c} />);
    await fireEvent.changeText(ui.getByDisplayValue(c.editName), "Маша");
    expect(c.setEditName).toHaveBeenCalledWith("Маша");
    await fireEvent.changeText(ui.getByDisplayValue(c.editEmail), "m@example.ru");
    expect(c.setEditEmail).toHaveBeenCalledWith("m@example.ru");
  });
  test.each([
    ["Выбрать фотографию", "pickAvatar"],
    ["Сохранить", "saveProfile"],
  ] as const)("передаёт действие «%s» контроллеру", async (label, handler) => {
    const c = makeController();
    const ui = await render(<EditProfileDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: label }));
    expect(c[handler]).toHaveBeenCalledTimes(1);
  });
});
