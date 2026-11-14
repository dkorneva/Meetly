import { render, fireEvent } from "@testing-library/react-native";
import { MapScreen } from "../../src/pages/map";
import { restaurants } from "../../src/entities/meeting";
import { openExternalLink } from "../../src/shared/api/device";

describe("MapScreen", () => {
  const filters = { budget: "Все", cuisine: "Все", distance: "Все" };
  test("передаёт найденный ресторан в бронирование", async () => {
    const onBook = jest.fn();
    const ui = await render(<MapScreen filters={filters} onBook={onBook} onFilters={jest.fn()} />);
    await fireEvent.changeText(ui.getByPlaceholderText("Рестораны рядом"), "Кофемания");
    await fireEvent.press(ui.getByText("Кофемания · Кофе и завтраки"));
    await fireEvent.press(ui.getByRole("button", { name: "Забронировать" }));
    expect(onBook).toHaveBeenCalledWith(restaurants[1]);
  });
  test("открывает Яндекс Карты для найденного ресторана", async () => {
    const ui = await render(<MapScreen filters={filters} onBook={jest.fn()} onFilters={jest.fn()} />);
    await fireEvent.changeText(ui.getByPlaceholderText("Рестораны рядом"), "Кофемания");
    await fireEvent.press(ui.getByText("Кофемания · Кофе и завтраки"));
    await fireEvent.press(ui.getByRole("button", { name: "Маршрут" }));
    expect(openExternalLink).toHaveBeenCalledWith(`https://yandex.ru/maps/?text=${encodeURIComponent("Кофемания Москва")}`);
  });
  test("сообщает, что фильтрам ничего не соответствует", async () => {
    const ui = await render(<MapScreen filters={{ ...filters, budget: "До 1 ₽" }} onBook={jest.fn()} onFilters={jest.fn()} />);
    expect(ui.getByText("Нет мест с такими фильтрами")).toBeOnTheScreen();
  });
});
