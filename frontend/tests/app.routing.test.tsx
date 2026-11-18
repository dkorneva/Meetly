import { render, fireEvent } from "@testing-library/react-native";
import App from "../App";
import { useAppController } from "../src/app/model/useAppController";
import { makeController } from "./fixtures";
jest.mock("../src/app/model/useAppController", () => ({ useAppController: jest.fn() }));
// Сами экраны проверяются в pages/*.test.tsx; здесь проверяем связи экранов с App.
jest.mock("../src/pages/meeting-detail", () => ({ MeetingDetail: (props: any) => {
  const { View } = require("react-native"); return <View testID="detail-screen" {...props} />;
} }));
jest.mock("../src/pages/map", () => ({ MapScreen: (props: any) => {
  const { View } = require("react-native"); return <View testID="map-screen" {...props} />;
} }));
jest.mock("../src/pages/chat", () => ({ Chat: (props: any) => {
  const { View } = require("react-native"); return <View testID="chat-screen" {...props} />;
}, ChatsScreen: (props: any) => {
  const { View } = require("react-native"); return <View testID="chats-screen" {...props} />;
} }));
jest.mock("../src/pages/auth", () => ({ Auth: (props: any) => {
  const { View } = require("react-native"); return <View testID="auth-screen" {...props} />;
} }));

test("действия на встрече открывают редактирование, участников, чат и бронь", async () => {
  const controller = makeController({ screen: "detail" });
  jest.mocked(useAppController).mockReturnValue(controller);
  const ui = await render(<App />), screen = ui.getByTestId("detail-screen");
  await fireEvent(screen, "edit");
  expect(controller.setScreen).toHaveBeenCalledWith("edit");
  await fireEvent(screen, "manage");
  expect(controller.setDialog).toHaveBeenCalledWith("participants");
  await fireEvent(screen, "chat");
  expect(controller.openChat).toHaveBeenCalledWith(controller.meeting.id, "meeting");
  await fireEvent(screen, "book");
  expect(controller.book).toHaveBeenCalled();
  const restaurant = controller.meeting.candidates![0];
  await fireEvent(screen, "map", restaurant);
  expect(controller.setScreen).toHaveBeenCalledWith("map");
  controller.screen = "map";
  await ui.rerender(<App />);
  expect(ui.getByTestId("map-screen").props).toMatchObject({ mode: "meeting", initialRestaurant: restaurant, meeting: controller.meeting });
});
test("фильтры карты передают только изменённые значения контроллеру", async () => {
  const controller = makeController({ screen: "map" });
  jest.mocked(useAppController).mockReturnValue(controller);
  const ui = await render(<App />), map = ui.getByTestId("map-screen");
  await fireEvent(map, "filterChange", { budget: "До 2000 ₽", cuisine: ["Итальянская"], openNow: true, q: "Кафе" });
  expect(controller.setFilterBudget).toHaveBeenCalledWith("До 2000 ₽");
  expect(controller.setFilterCuisine).toHaveBeenCalledWith(["Итальянская"]);
  expect(controller.setFilterOpenNow).toHaveBeenCalledWith(true);
  expect(controller.setFilterQuery).toHaveBeenCalledWith("Кафе");
  jest.mocked(controller.setFilterBudget).mockClear();
  await fireEvent(map, "filterChange", { q: "Пицца" });
  expect(controller.setFilterBudget).not.toHaveBeenCalled();
  await fireEvent(map, "filters");
  expect(controller.setDialog).toHaveBeenCalledWith("filters");
});
test("из списка чатов открывается переписка с правильным источником возврата", async () => {
  const controller = makeController({ screen: "chats" });
  jest.mocked(useAppController).mockReturnValue(controller);
  const ui = await render(<App />);
  await fireEvent(ui.getByTestId("chats-screen"), "open", "meeting");
  expect(controller.openChat).toHaveBeenCalledWith("meeting", "list");
});
test("чат без истории выбора получает карточку выбранного места, а существующая карточка не дублируется", async () => {
  const controller = makeController({ screen: "chat" });
  controller.meeting.status = "completed";
  controller.meeting.restaurantId = controller.meeting.candidates![0].id;
  controller.store.messages[controller.selected] = [];
  jest.mocked(useAppController).mockReturnValue(controller);
  const ui = await render(<App />);
  let chat = ui.getByTestId("chat-screen");
  expect(chat.props.messages).toHaveLength(1);
  expect(chat.props.messages[0].kind).toBe("selected");
  await fireEvent(chat, "leader");
  expect(controller.setScreen).toHaveBeenCalledWith("detail");
  await fireEvent(chat, "attach");
  expect(controller.setDialog).toHaveBeenCalledWith("attachment");
  controller.store.messages[controller.selected] = [{ id: "saved", text: "Выбрано", name: "", time: "", kind: "selected" }];
  await ui.rerender(<App />);
  chat = ui.getByTestId("chat-screen");
  expect(chat.props.messages).toHaveLength(1);
  expect(chat.props.messages[0].id).toBe("saved");
});
test.each(["login", "register"] as const)("экран %s переключает режим и возвращает к знакомству", async screen => {
  const controller = makeController({ screen });
  jest.mocked(useAppController).mockReturnValue(controller);
  const ui = await render(<App />), auth = ui.getByTestId("auth-screen");
  await fireEvent(auth, "switch");
  expect(controller.setScreen).toHaveBeenCalledWith(screen === "login" ? "register" : "login");
  await fireEvent(auth, "back");
  expect(controller.setScreen).toHaveBeenCalledWith("intro");
});
