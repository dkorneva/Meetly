import { render, fireEvent } from "@testing-library/react-native";
import { FiltersDialog } from "../../src/features/filter-restaurants";
import { makeController } from ".././fixtures";

describe("FiltersDialog", () => {
  test("передаёт выбранные ограничения контроллеру", async () => {
    const c = makeController();
    const ui = await render(<FiltersDialog controller={c} />);
    await fireEvent.press(ui.getByText("До 1000 ₽"));
    await fireEvent.press(ui.getByText("Кофе"));
    await fireEvent.press(ui.getByText("До 1 км"));
    expect(c.setFilterBudget).toHaveBeenCalledWith("До 1000 ₽");
    expect(c.setFilterCuisine).toHaveBeenCalledWith("Кофе");
    expect(c.setFilterDistance).toHaveBeenCalledWith("До 1 км");
  });
  test("закрывает окно и сообщает о применении фильтров", async () => {
    const c = makeController();
    const ui = await render(<FiltersDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Показать места" }));
    expect(c.setDialog).toHaveBeenCalledWith(null);
    expect(c.showToast).toHaveBeenCalledWith("success", "Фильтры применены");
  });
  test("сбрасывает все ограничения", async () => {
    const c = makeController({ filterBudget: "До 1000 ₽", filterCuisine: "Кофе", filterDistance: "До 1 км" });
    const ui = await render(<FiltersDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Сбросить" }));
    expect(c.setFilterBudget).toHaveBeenLastCalledWith("Все");
    expect(c.setFilterCuisine).toHaveBeenLastCalledWith("Все");
    expect(c.setFilterDistance).toHaveBeenLastCalledWith("Все");
  });
});
