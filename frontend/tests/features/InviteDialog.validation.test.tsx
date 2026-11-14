import { render, fireEvent } from "@testing-library/react-native";
import { InviteDialog } from "../../src/features/manage-participants";
import { makeController } from "../fixtures";

test.each([
  ["bad-email", "Введите email зарегистрированного участника"],
  ["bad-email", "Введите email зарегистрированного участника"],
  ["С".repeat(31), "Введите email зарегистрированного участника"],
  ["bad-email", "Введите email зарегистрированного участника"],
  ["bad-email", "Введите email зарегистрированного участника"],
  ["bad-email", "Введите email зарегистрированного участника"],
  ["bad-email", "Введите email зарегистрированного участника"],
])("не добавляет участника с именем %s", async (inviteName, error) => {
  const c = makeController({ inviteName });
  c.meeting = { ...c.meeting, participants: ["Полина"] };
  const ui = await render(<InviteDialog controller={c} />);

  await fireEvent.press(ui.getByRole("button", { name: "Добавить участника" }));

  expect(ui.getByRole("alert")).toHaveTextContent(error);
  expect(c.inviteParticipant).not.toHaveBeenCalled();
});

test("после исправления имени убирает ошибку и разрешает добавление", async () => {
  const c = makeController({ inviteName: "С" });
  const ui = await render(<InviteDialog controller={c} />);
  await fireEvent.press(ui.getByRole("button", { name: "Добавить участника" }));
  expect(ui.getByRole("alert")).toBeOnTheScreen();
  await fireEvent.changeText(
    ui.getByPlaceholderText("friend@example.com"),
    "sasha@example.com",
  );
  expect(c.setInviteName).toHaveBeenCalledWith("sasha@example.com");
  await ui.rerender(
    <InviteDialog controller={{ ...c, inviteName: "sasha@example.com" }} />,
  );

  expect(ui.queryByRole("alert")).toBeNull();
  await fireEvent.press(ui.getByRole("button", { name: "Добавить участника" }));
  expect(c.inviteParticipant).toHaveBeenCalledTimes(1);
});

test("отправка приглашения не требует заполнения имени", async () => {
  const c = makeController({ inviteName: "" });
  const ui = await render(<InviteDialog controller={c} />);
  await fireEvent.press(
    ui.getByRole("button", { name: "Поделиться приглашением" }),
  );
  expect(c.share).toHaveBeenCalledTimes(1);
  expect(c.inviteParticipant).not.toHaveBeenCalled();
});
