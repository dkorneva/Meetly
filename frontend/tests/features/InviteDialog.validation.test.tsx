import { render, fireEvent } from "@testing-library/react-native";
import { InviteDialog } from "../../src/features/manage-participants";
import { makeController } from "../fixtures";

test.each([
  ["", "Введите имя участника"],
  ["С", "Имя должно содержать от 2 до 30 символов"],
  ["С".repeat(31), "Имя должно содержать от 2 до 30 символов"],
  [" Саша", "Допустимы буквы, пробел и дефис; пробелы по краям запрещены"],
  ["Саша ", "Допустимы буквы, пробел и дефис; пробелы по краям запрещены"],
  ["Саша1!", "Допустимы буквы, пробел и дефис; пробелы по краям запрещены"],
  ["пОлИнА", "Этот участник уже добавлен"],
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
  await fireEvent.changeText(ui.getByPlaceholderText("Например, Саша"), "Саша");
  expect(c.setInviteName).toHaveBeenCalledWith("Саша");
  await ui.rerender(<InviteDialog controller={{ ...c, inviteName: "Саша" }} />);

  expect(ui.queryByRole("alert")).toBeNull();
  await fireEvent.press(ui.getByRole("button", { name: "Добавить участника" }));
  expect(c.inviteParticipant).toHaveBeenCalledTimes(1);
});

test("отправка приглашения не требует заполнения имени", async () => {
  const c = makeController({ inviteName: "" });
  const ui = await render(<InviteDialog controller={c} />);
  await fireEvent.press(ui.getByRole("button", { name: "Поделиться приглашением" }));
  expect(c.share).toHaveBeenCalledTimes(1);
  expect(c.inviteParticipant).not.toHaveBeenCalled();
});
