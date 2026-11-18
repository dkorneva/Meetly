import { act, render, fireEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import { serverUrl } from "../src/shared/api/client";
jest.unmock("../src/shared/ui/RestaurantMap");
jest.mock("react-native-webview", () => {
  const React = require("react"), { View } = require("react-native");
  return { __esModule: true, default: React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ postMessage: mockPostMessage }));
    return <View {...props} testID="native-map" />;
  }) };
});
const mockPostMessage = jest.fn();
const RestaurantMap = jest.requireActual<typeof import("../src/shared/ui/RestaurantMap")>("../src/shared/ui/RestaurantMap").default;
const items = [{ id: "one", name: "Кафе", latitude: 55, longitude: 37 }];
test("карта получает метки при загрузке и при изменении выбранного места", async () => {
  const onEvent = jest.fn();
  const ui = await render(<RestaurantMap items={items} onEvent={onEvent} />);
  expect(JSON.parse(mockPostMessage.mock.calls.at(-1)![0])).toEqual({ type: "places", items, mode: "catalog" });
  await fireEvent(ui.getByTestId("native-map"), "message", { nativeEvent: { data: '{"type":"ready"}' } });
  expect(onEvent).toHaveBeenCalledWith({ type: "ready" });
  await ui.rerender(<RestaurantMap items={items} onEvent={onEvent} selectedId="one" center={{ latitude: 55, longitude: 37 }} mode="meeting" />);
  expect(JSON.parse(mockPostMessage.mock.calls.at(-1)![0])).toEqual({ type: "places", items, selectedId: "one", center: { latitude: 55, longitude: 37 }, mode: "meeting" });
});
test("выбор метки передаётся приложению, испорченный JSON игнорируется", async () => {
  const onEvent = jest.fn();
  const ui = await render(<RestaurantMap items={[]} onEvent={onEvent} />);
  await fireEvent(ui.getByTestId("native-map"), "message", { nativeEvent: { data: "broken" } });
  expect(onEvent).not.toHaveBeenCalled();
  await fireEvent(ui.getByTestId("native-map"), "message", { nativeEvent: { data: '{"type":"select","id":"one"}' } });
  expect(onEvent).toHaveBeenCalledWith({ type: "select", id: "one" });
});
test("web-карта принимает сообщения только от своего iframe и адреса сервера", async () => {
  const os = Platform.OS, originalWindow = global.window;
  const listeners: Record<string, Function> = {};
  const mapWindow = { postMessage: jest.fn() };
  const removeEventListener = jest.fn();
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  global.window = { addEventListener: (type: string, fn: Function) => { listeners[type] = fn; }, removeEventListener } as any;
  let ui: Awaited<ReturnType<typeof render>> | undefined;
  try {
    const onEvent = jest.fn();
    ui = await render(<RestaurantMap items={items} onEvent={onEvent} />);
    ui.root!.props.ref.current.contentWindow = mapWindow;
    await act(() => listeners.message({ origin: "https://foreign.example", source: mapWindow, data: { type: "ready" } }));
    await act(() => listeners.message({ origin: serverUrl, source: {}, data: { type: "ready" } }));
    expect(onEvent).not.toHaveBeenCalled();
    await act(() => listeners.message({ origin: serverUrl, source: mapWindow, data: { type: "ready" } }));
    expect(onEvent).toHaveBeenCalledWith({ type: "ready" });
    expect(mapWindow.postMessage).toHaveBeenCalledWith(expect.objectContaining({ items }), serverUrl);
    await ui.unmount();
    expect(removeEventListener).toHaveBeenCalledWith("message", listeners.message);
  } finally { if (ui) await ui.unmount(); Object.defineProperty(Platform, "OS", { value: os }); global.window = originalWindow; }
});
