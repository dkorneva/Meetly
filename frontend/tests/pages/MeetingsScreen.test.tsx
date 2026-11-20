import { render, fireEvent } from "@testing-library/react-native";
import { MeetingsScreen } from "../../src/pages/meetings";
import { makeController } from "../fixtures";
import { MeetingDetail, RestaurantCard } from "../../src/pages/meeting-detail";
import { restaurants } from "../data";



describe("MeetingsScreen", () => {
  describe("MeetingsScreen", () => {
    test("передаёт идентификатор открываемой встречи", async () => {
      const c = makeController();
      const ui = await render(<MeetingsScreen controller={c} />);
      await fireEvent.press(ui.getByText(c.meeting.title));
      expect(c.openMeeting).toHaveBeenCalledWith(c.meeting.id);
    });
    test("передаёт поисковую строку контроллеру", async () => {
      const c = makeController();
      const ui = await render(<MeetingsScreen controller={c} />);
      await fireEvent.changeText(ui.getByPlaceholderText("Поиск по встречам"), "Кофе");
      expect(c.setSearch).toHaveBeenCalledWith("Кофе");
    });
    test("вызывает переключение на завершённые встречи", async () => {
      const c = makeController();
      const ui = await render(<MeetingsScreen controller={c} />);
      await fireEvent.press(ui.getByRole("tab", { name: "Завершённые" }));
      expect(c.setMeetingSection).toHaveBeenCalledWith("completed");
    });
    test("вызывает переход к созданию встречи", async () => {
      const c = makeController();
      const ui = await render(<MeetingsScreen controller={c} />);
      await fireEvent.press(ui.getByLabelText("Создать встречу"));
      expect(c.setScreen).toHaveBeenCalledWith("new");
    });
    test("объясняет отсутствие результатов поиска", async () => {
      const c = makeController({ matchingMeetings: [], search: "Нет такой встречи" });
      const ui = await render(<MeetingsScreen controller={c} />);
      expect(ui.getByText("Встречи не найдены")).toBeOnTheScreen();
    });
  });
});

describe("MeetingDetail", () => {
  describe("MeetingDetail", () => {
    test('крестик убирает конкретный вариант и доступен только организатору при голосовании',async()=>{
      const c=makeController(),onRemoveCandidate=jest.fn(),onMap=jest.fn();
      const props={meeting:c.meeting,currentUserId:c.meeting.ownerId,onRemoveCandidate,onMap,onVote:jest.fn(),onEdit:jest.fn(),onManage:jest.fn(),onChat:jest.fn(),onBook:jest.fn()};
      const ui=await render(<MeetingDetail {...props}/>);
      await fireEvent.press(ui.getByLabelText(`Убрать ${restaurants[0].name} из голосования`),{stopPropagation:jest.fn()});
      expect(onRemoveCandidate).toHaveBeenCalledWith(restaurants[0].id);
      expect(onMap).not.toHaveBeenCalled();
      await ui.rerender(<MeetingDetail {...props} currentUserId="other"/>);
      expect(ui.queryByLabelText(`Убрать ${restaurants[0].name} из голосования`)).toBeNull();
      await ui.rerender(<MeetingDetail {...props} meeting={{...c.meeting,status:'selected'}}/>);
      expect(ui.queryByLabelText(`Убрать ${restaurants[0].name} из голосования`)).toBeNull();
    });
    test("карточка открывает на карте именно выбранное заведение", async () => {
      const c = makeController();
      const onMap = jest.fn();
      const ui = await render(
        <MeetingDetail
          meeting={c.meeting}
          onMap={onMap}
          onVote={jest.fn()}
          onEdit={jest.fn()}
          onManage={jest.fn()}
          onChat={jest.fn()}
          onBook={jest.fn()}
        />,
      );
      await fireEvent.press(
        ui.getByRole("button", {
          name: `Показать ${restaurants[1].name} на карте`,
        }),
      );
      expect(onMap).toHaveBeenCalledWith(
        expect.objectContaining({ id: restaurants[1].id }),
      );
    });
    test("передаёт голос за конкретное место родителю", async () => {
      const c = makeController();
      const onVote = jest.fn();
      const ui = await render(
        <MeetingDetail
          meeting={c.meeting}
          onVote={onVote}
          onEdit={jest.fn()}
          onManage={jest.fn()}
          onChat={jest.fn()}
          onBook={jest.fn()}
        />,
      );
      await fireEvent.press(ui.getAllByRole("button", { name: "Голосовать" })[1]);
      expect(onVote).toHaveBeenCalledWith(restaurants[1].id);
    });
    test.each([
      ["Перейти к чату", "onChat"],
      ["Забронировать лидера", "onBook"],
    ] as const)("передаёт нажатие «%s» родителю", async (label, handler) => {
      const c = makeController();
      const actions = { onChat: jest.fn(), onBook: jest.fn() };
      const ui = await render(
        <MeetingDetail
          meeting={c.meeting}
          onVote={jest.fn()}
          onEdit={jest.fn()}
          onManage={jest.fn()}
          {...actions}
        />,
      );
      await fireEvent.press(ui.getByRole("button", { name: label }));
      expect(actions[handler]).toHaveBeenCalledTimes(1);
    });
  });
});

describe("RestaurantCard", () => {
  describe("RestaurantCard", () => {
    test("показывает ресторан и передаёт голос", async () => {
      const onVote = jest.fn();
      const ui = await render(
        <RestaurantCard
          restaurant={restaurants[0]}
          voted={false}
          onVote={onVote}
        />,
      );
      expect(ui.getByText(restaurants[0].name)).toBeOnTheScreen();
      await fireEvent.press(ui.getByRole("button", { name: "Голосовать" }));
      expect(onVote).toHaveBeenCalledTimes(1);
    });
  });
});
