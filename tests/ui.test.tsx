import { render, fireEvent } from "@testing-library/react-native";
import { Animated } from "react-native";
import { Text, TextInput, ThemeProvider } from "../src/shared/theme";
import { Button, IconButton, Toggle, Field, Chip, Avatars } from "../src/shared/ui/controls";
import { Icon } from "../src/shared/ui/Icon";
import { darkColors, lightColors } from "../src/shared/theme/colors";
import Toast from "../src/shared/ui/Toast";

describe("Button", () => {
  test("вызывает обработчик нажатия", async () => {
    const onPress = jest.fn();
    const ui = await render(<Button title="Сохранить" onPress={onPress} />);
    await fireEvent.press(ui.getByRole("button", { name: "Сохранить" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  test("заблокированная кнопка не вызывает обработчик", async () => {
    const onPress = jest.fn();
    const ui = await render(<Button title="Сохранить" disabled onPress={onPress} />);
    await fireEvent.press(ui.getByRole("button", { name: "Сохранить" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
describe("IconButton", () => {
  test("передаёт нажатие родителю", async () => {
    const onPress = jest.fn();
    const ui = await render(<IconButton name="close" onPress={onPress} />);
    await fireEvent.press(ui.getByRole("button", { name: "close" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
describe("Toggle", () => {
  test.each([false, true])("переключает значение %s", async (value) => {
    const onValueChange = jest.fn();
    const ui = await render(<Toggle value={value} onValueChange={onValueChange} accessibilityLabel="Тема" />);
    expect(ui.getByRole("switch", { name: "Тема" }).props.accessibilityState).toEqual({ checked: value });
    await fireEvent.press(ui.getByRole("switch"));
    expect(onValueChange).toHaveBeenCalledWith(!value);
  });
});
describe("Field", () => {
  test("показывает подпись и передаёт введённый текст", async () => {
    const onChangeText = jest.fn();
    const ui = await render(<Field label="Имя" placeholder="Ваше имя" value="" onChangeText={onChangeText} />);
    expect(ui.getByText("Имя")).toBeOnTheScreen();
    await fireEvent.changeText(ui.getByPlaceholderText("Ваше имя"), "Маша");
    expect(onChangeText).toHaveBeenCalledWith("Маша");
  });
});
describe("Chip", () => {
  test("обрабатывает выбор", async () => {
    const onPress = jest.fn();
    const ui = await render(<Chip label="Кофе" selected onPress={onPress} />);
    await fireEvent.press(ui.getByText("Кофе"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
describe("Avatars", () => {
  test("ограничивает число аватаров и показывает остаток", async () => {
    const ui = await render(<Avatars names={["Аня", "Маша", "Илья"]} limit={2} />);
    expect(ui.getByText("А")).toBeOnTheScreen();
    expect(ui.getByText("М")).toBeOnTheScreen();
    expect(ui.getByText("+1")).toBeOnTheScreen();
    expect(ui.queryByText("И")).toBeNull();
  });
});
describe("Icon", () => {
  test("передаёт SVG размер и явно заданный цвет", async () => {
    const ui = await render(<Icon name="check" size={32} color="red" />);
    expect(ui.getByTestId("svg-mock").props).toMatchObject({ width: 32, height: 32, color: "red" });
  });
});
describe("ThemeProvider и Text", () => {
  test("меняет цвет текста при переключении темы", async () => {
    const ui = await render(<ThemeProvider dark={false}><Text>Тема</Text></ThemeProvider>);
    expect(ui.getByText("Тема")).toHaveStyle({ color: lightColors.text });
    await ui.rerender(<ThemeProvider dark><Text>Тема</Text></ThemeProvider>);
    expect(ui.getByText("Тема")).toHaveStyle({ color: darkColors.text });
  });
  test("пользовательский стиль важнее цвета темы", async () => {
    const ui = await render(<Text style={{ color: "red" }}>Текст</Text>);
    expect(ui.getByText("Текст")).toHaveStyle({ color: "red", fontFamily: "Inter" });
  });
});

describe("TextInput", () => {
  test("передаёт текст и цвета поля из темы", async () => {
    const change = jest.fn();
    const ui = await render(<ThemeProvider dark><TextInput placeholder="Ввод" value="" onChangeText={change} /></ThemeProvider>);
    const input = ui.getByPlaceholderText("Ввод");
    expect(input.props.placeholderTextColor).toBe(darkColors.placeholder);
    await fireEvent.changeText(input, "Привет");
    expect(change).toHaveBeenCalledWith("Привет");
  });
});
describe("Toast", () => {
  beforeEach(() => {
    // Анимационный движок заменяем синхронным: тест проверяет уведомление и закрытие.
    jest.spyOn(Animated, "timing").mockImplementation((value, config) => ({
      start: () => {
        if (value instanceof Animated.Value) value.setValue(config.toValue as number);
      },
      stop: jest.fn(),
      reset: jest.fn(),
    }));
  });
  afterEach(() => jest.restoreAllMocks());
  test.each(["info", "success", "error"] as const)("показывает %s и закрывается по кнопке", async (type) => {
    const onDismiss = jest.fn();
    const ui = await render(<Toast text="Сообщение" type={type} onDismiss={onDismiss} />);
    expect(ui.getByText("Сообщение")).toBeOnTheScreen();
    await fireEvent.press(ui.getByLabelText("Закрыть уведомление"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await ui.unmount();
  });
});
