import { fireEvent, render } from "@testing-library/react-native";
import PlacePhoto from "../src/shared/ui/PlacePhoto";
import { api } from "../src/shared/api/client";

const image = require("../assets/restaurants/manul-okhotny.webp");

test("встроенное фото не запрашивается у сервера", async () => {
  const ui = await render(<PlacePhoto id="manul" name="Manul" image={image} style={{ height: 150 }} />);
  expect(ui.getByLabelText("Фото Manul").props.source).toBe(image);
  expect(api).not.toHaveBeenCalled();
  await fireEvent(ui.getByLabelText("Фото Manul"), "load");
  expect(ui.queryByLabelText("Загрузка фото")).toBeNull();
});

test("ошибка фото показывает заглушку; другая карточка снова загружает изображение", async () => {
  const ui = await render(<PlacePhoto id="one" name="Кафе" image={image} style={{ height: 150 }} />);
  await fireEvent(ui.getByLabelText("Фото Кафе"), "error");
  expect(ui.queryByLabelText("Фото Кафе")).toBeNull();
  expect(ui.getByText("Нет фото")).toBeOnTheScreen();
  await ui.rerender(<PlacePhoto id="two" name="Ресторан" image={image} style={{ height: 150 }} />);
  expect(ui.getByLabelText("Фото Ресторан")).toBeOnTheScreen();
});

test("без картинки показывается заглушка без обращения к API", async () => {
  const ui = await render(<PlacePhoto id="empty" name="Кафе" style={{ height: 150 }} />);
  expect(ui.getByText("Нет фото")).toBeOnTheScreen();
  expect(ui.queryByLabelText("Загрузка фото")).toBeNull();
  expect(api).not.toHaveBeenCalled();
});
