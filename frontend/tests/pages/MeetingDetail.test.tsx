import { render, fireEvent } from "@testing-library/react-native";
import { MeetingDetail } from "../../src/pages/meeting-detail";
import { restaurants } from "../../src/entities/meeting";
import { makeController } from ".././fixtures";

describe("MeetingDetail", () => {
  test("передаёт голос за конкретное место родителю", async () => {
    const c = makeController();
    const onVote = jest.fn();
    const ui = await render(<MeetingDetail meeting={c.meeting} onVote={onVote} onEdit={jest.fn()} onManage={jest.fn()} onChat={jest.fn()} onBook={jest.fn()} />);
    await fireEvent.press(ui.getAllByRole("button", { name: "Голосовать" })[1]);
    expect(onVote).toHaveBeenCalledWith(restaurants[1].id);
  });
  test.each([
    ["Перейти к чату", "onChat"],
    ["Забронировать лидера", "onBook"],
  ] as const)("передаёт нажатие «%s» родителю", async (label, handler) => {
    const c = makeController();
    const actions = { onChat: jest.fn(), onBook: jest.fn() };
    const ui = await render(<MeetingDetail meeting={c.meeting} onVote={jest.fn()} onEdit={jest.fn()} onManage={jest.fn()} {...actions} />);
    await fireEvent.press(ui.getByRole("button", { name: label }));
    expect(actions[handler]).toHaveBeenCalledTimes(1);
  });
});
