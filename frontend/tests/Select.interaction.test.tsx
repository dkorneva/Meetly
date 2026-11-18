import { act, render, fireEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import { createRoot } from "test-renderer";
import { Select } from "../src/shared/ui/controls/Select";
test("мобильный список открывается, выбирает вариант и закрывается", async () => {
  const onChange = jest.fn();
  const ui = await render(<Select label="Кухня" value="Любая" options={["Любая", "Итальянская"]} onChange={onChange} />);
  await fireEvent.press(ui.getByRole("combobox", { name: "Кухня" }));
  expect(ui.getByRole("combobox").props.accessibilityState.expanded).toBe(true);
  await fireEvent.press(ui.getByRole("button", { name: "Итальянская" }));
  expect(onChange).toHaveBeenCalledWith("Итальянская");
  expect(ui.getByRole("combobox").props.accessibilityState.expanded).toBe(false);
  await fireEvent.press(ui.getByRole("combobox"));
  await fireEvent.press(ui.getByLabelText("Закрыть список"));
  expect(onChange).toHaveBeenCalledTimes(1);
  await fireEvent.press(ui.getByRole("combobox"));
  await fireEvent(ui.container.queryAll(node => !!node.props.onRequestClose)[0], "requestClose");
  expect(ui.getByRole("combobox").props.accessibilityState.expanded).toBe(false);
});
test("web-список передаёт выбор и обрабатывает фокус", async () => {
  const os = Platform.OS;
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  const root = createRoot({ textComponentTypes: ["Text", "RCTText", "option"] });
  try {
    const onChange = jest.fn();
    await act(() => root.render(<Select label="Кухня" value="Любая" options={["Любая", "Итальянская"]} onChange={onChange} />));
    const select = root.container.queryAll(node => node.type === "select")[0];
    expect(root.container.queryAll(node => node.type === "option")).toHaveLength(2);
    await act(() => select.props.onFocus());
    await act(() => select.props.onChange({ target: { value: "Итальянская" } }));
    await act(() => select.props.onBlur());
    expect(onChange).toHaveBeenCalledWith("Итальянская");
  } finally { await act(() => root.unmount()); Object.defineProperty(Platform, "OS", { value: os }); }
});
