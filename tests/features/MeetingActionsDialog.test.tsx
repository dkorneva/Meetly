import { render, fireEvent } from "@testing-library/react-native";
import { MeetingActionsDialog } from "../../src/features/meeting-actions";
import { makeController } from ".././fixtures";

describe("MeetingActionsDialog", () => {
  test("вызывает открытие списка участников", async () => {
    const c = makeController();
    const ui = await render(<MeetingActionsDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Участники" }));
    expect(c.setDialog).toHaveBeenCalledWith("participants");
  });
  test("закрывает меню и вызывает переход к редактированию", async () => {
    const c = makeController();
    const ui = await render(<MeetingActionsDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Изменить предпочтения" }));
    expect(c.setDialog).toHaveBeenLastCalledWith(null);
    expect(c.setScreen).toHaveBeenCalledWith("edit");
  });
  test("вызывает выбор лидера", async () => {
    const c = makeController();
    const ui = await render(<MeetingActionsDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Выбрать лидера" }));
    expect(c.selectLeader).toHaveBeenCalledTimes(1);
  });
  test("после завершения скрывает выбор лидера и показывает отмену брони", async () => {
    const c = makeController();
    c.meeting = { ...c.meeting, status: "completed" };
    const ui = await render(<MeetingActionsDialog controller={c} />);
    expect(ui.queryByText("Выбрать лидера")).toBeNull();
    await fireEvent.press(ui.getByRole("button", { name: "Отменить бронирование" }));
    expect(c.cancelCurrentBooking).toHaveBeenCalledTimes(1);
  });
});
