import { render, fireEvent } from "@testing-library/react-native";
import { MeetingDetail } from "../../src/pages/meeting-detail";
import { restaurants } from "../data";
import { makeController } from ".././fixtures";

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
