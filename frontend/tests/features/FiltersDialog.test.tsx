import { render, fireEvent } from "@testing-library/react-native";
import { FiltersDialog } from "../../src/features/filter-restaurants";
import { makeController } from ".././fixtures";

describe("FiltersDialog", () => {
  test("показывает кухни и пределы чека из каталога, включая варианты за пределами прежнего списка", async () => {
    const c = makeController();
    const ui = await render(<FiltersDialog controller={c} />);
    await fireEvent.press(ui.getByText("Азербайджанская"));
    await fireEvent.press(ui.getByRole("combobox", {name:"Средний чек на человека"}));
    await fireEvent.press(ui.getByRole("button", {name:"До 7200 ₽"}));
    expect(c.setFilterCuisine).toHaveBeenCalledWith(["Азербайджанская"]);
    expect(c.setFilterBudget).toHaveBeenCalledWith("До 7200 ₽");
  });
  test("передаёт выбранные ограничения контроллеру", async () => {
    const c = makeController();
    const ui = await render(<FiltersDialog controller={c} />);
    await fireEvent.press(ui.getByText("Кофе"));
    expect(ui.getByText("Средний чек на человека")).toBeOnTheScreen();
    await fireEvent.press(ui.getByRole("combobox", {name:"Средний чек на человека"}));
    await fireEvent.press(ui.getByRole("button", {name:"До 1000 ₽"}));
    expect(c.setFilterBudget).toHaveBeenCalledWith("До 1000 ₽");
    expect(c.setFilterCuisine).toHaveBeenCalledWith(["Кофе"]);
    expect(ui.queryByText("Расстояние")).toBeNull();
  });
  test("закрывает окно и сообщает о применении фильтров", async () => {
    const c = makeController();
    const ui = await render(<FiltersDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Показать места" }));
    expect(c.setDialog).toHaveBeenCalledWith(null);
    expect(c.showToast).toHaveBeenCalledWith("success", "Фильтры применены");
  });
  test("сбрасывает все ограничения", async () => {
    const c = makeController({
      filterBudget: "До 1000 ₽",
      filterCuisine: ["Кофе"],
    });
    const ui = await render(<FiltersDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: "Сбросить" }));
    expect(c.setFilterBudget).toHaveBeenLastCalledWith("Все");
    expect(c.setFilterCuisine).toHaveBeenLastCalledWith([]);
  });
});

test('несколько кухонь выбираются и снимаются независимо', async()=>{
 const c=makeController({filterCuisine:['Кофе','Японская']});
 const ui=await render(<FiltersDialog controller={c}/>);
 await fireEvent.press(ui.getByText('Грузинская'));
 expect(c.setFilterCuisine).toHaveBeenLastCalledWith(['Кофе','Японская','Грузинская']);
 await fireEvent.press(ui.getByText('Кофе'));
 expect(c.setFilterCuisine).toHaveBeenLastCalledWith(['Японская']);
});
