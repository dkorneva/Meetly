import { render, fireEvent } from "@testing-library/react-native";
import { BookingDialog } from "../../src/features/booking";
import { openExternalLink } from "../../src/shared/api/device";
import { makeController } from ".././fixtures";

describe("BookingDialog", () => {
  test("передаёт номер ресторана для открытия телефона", async () => {
    const c = makeController();
    const ui = await render(<BookingDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Позвонить" }));
    expect(openExternalLink).toHaveBeenCalledWith(`tel:${c.booking.phone}`);
  });
  test("вызывает подтверждение брони после звонка", async () => {
    const c = makeController();
    const ui = await render(<BookingDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Подтвердить бронь после звонка" }));
    expect(c.confirmCurrentBooking).toHaveBeenCalledTimes(1);
  });
  test("для завершённой встречи предлагает отмену", async () => {
    const c = makeController();
    c.meeting = { ...c.meeting, status: "completed" };
    const ui = await render(<BookingDialog controller={c} />);
    expect(ui.queryByText("Подтвердить бронь после звонка")).toBeNull();
    await fireEvent.press(ui.getByRole("button", { name: "Отменить бронирование" }));
    expect(c.cancelCurrentBooking).toHaveBeenCalledTimes(1);
  });
  test("ошибку открытия ссылки передаёт в уведомление", async () => {
    jest.mocked(openExternalLink).mockRejectedValueOnce(new Error("Недоступно"));
    const c = makeController();
    const ui = await render(<BookingDialog controller={c} />);
    await fireEvent.press(ui.getByText("Сайт"));
    expect(c.showToast).toHaveBeenCalledWith("error", "Не удалось открыть ссылку");
  });
});
