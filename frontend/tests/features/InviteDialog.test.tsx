import { render, fireEvent } from "@testing-library/react-native";
import { InviteDialog } from "../../src/features/manage-participants";
import { makeController } from ".././fixtures";

describe("InviteDialog", () => {
  test("передаёт введённое имя контроллеру", async () => {
    const c = makeController({ inviteName: "sasha@example.com" });
    const ui = await render(<InviteDialog controller={c} />);
    await fireEvent.changeText(
      ui.getByPlaceholderText("friend@example.com"),
      "sasha@example.com",
    );
    expect(c.setInviteName).toHaveBeenCalledWith("sasha@example.com");
  });
  test.each([
    ["Добавить участника", "inviteParticipant"],
    ["Поделиться приглашением", "share"],
  ] as const)("передаёт действие «%s» контроллеру", async (label, handler) => {
    const c = makeController({ inviteName: "sasha@example.com" });
    const ui = await render(<InviteDialog controller={c} />);
    await fireEvent.press(ui.getByRole("button", { name: label }));
    expect(c[handler]).toHaveBeenCalledTimes(1);
  });
});
