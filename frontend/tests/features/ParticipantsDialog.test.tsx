import { render, fireEvent } from "@testing-library/react-native";
import { ParticipantsDialog } from "../../src/features/manage-participants";
import { makeController } from ".././fixtures";

describe("ParticipantsDialog", () => {
  test("передаёт имя удаляемого участника", async () => {
    const c = makeController();
    const ui = await render(<ParticipantsDialog controller={c} />);
    expect(ui.getByText("Аня")).toBeOnTheScreen();
    await fireEvent.press(ui.getAllByRole("button", { name: "close" })[0]);
    expect(c.removeParticipant).toHaveBeenCalledWith("Полина");
  });
  test("вызывает открытие приглашения", async () => {
    const c = makeController();
    const ui = await render(<ParticipantsDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Пригласить" }));
    expect(c.setDialog).toHaveBeenCalledWith("invite");
  });
});
