import { render, fireEvent } from "@testing-library/react-native";
import { AttachmentDialog } from "../../src/features/attach-message";
import { makeController } from "../fixtures";
import { BookingDialog } from "../../src/features/booking";
import { openExternalLink } from "../../src/shared/api/device";
import { CalendarExportDialog } from "../../src/features/calendar-export";
import { EditProfileDialog } from "../../src/features/edit-profile";
import { FiltersDialog } from "../../src/features/filter-restaurants";
import { InviteDialog, ParticipantsDialog } from "../../src/features/manage-participants";
import { MeetingActionsDialog } from "../../src/features/meeting-actions";



describe("AttachmentDialog", () => {
  describe("AttachmentDialog", () => {
    test.each([
      ["Выбрать файл или фотографию", "pickAttachment"],
      ["Поделиться выбранным местом", "sharePlaceInChat"],
    ] as const)("передаёт действие «%s» контроллеру", async (label, handler) => {
      const c = makeController();
      const ui = await render(<AttachmentDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: label }));
      expect(c[handler]).toHaveBeenCalledTimes(1);
    });
  });
});

describe("BookingDialog", () => {
  describe("BookingDialog", () => {
    test("передаёт ссылку ВКонтакте выбранного ресторана", async () => {
      const c = makeController();
      c.booking = { ...c.booking, vk: "https://vk.com/meetly_test_restaurant" };
      const ui = await render(<BookingDialog controller={c} />);

      await fireEvent.press(ui.getByText("ВКонтакте"));

      expect(openExternalLink).toHaveBeenCalledTimes(1);
      expect(openExternalLink).toHaveBeenCalledWith(c.booking.vk);
    });

    test("передаёт номер ресторана для открытия телефона", async () => {
      const c = makeController();
      const ui = await render(<BookingDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Позвонить" }));
      expect(openExternalLink).toHaveBeenCalledWith(`tel:${c.booking.phone}`);
    });
    test("вызывает подтверждение брони после звонка", async () => {
      const c = makeController();
      const ui = await render(<BookingDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Подтвердить бронь после звонка" }));
      expect(c.confirmCurrentBooking).toHaveBeenCalledTimes(1);
    });
    test("для завершённой встречи предлагает отмену", async () => {
      const c = makeController();
      c.meeting = { ...c.meeting, status: "completed" };
      const ui = await render(<BookingDialog controller={c} />);
      expect(ui.queryByText("Подтвердить бронь после звонка")).toBeNull();
      await fireEvent.press(ui.getByRole("button", { name: "Отменить бронирование" }));
      expect(c.cancelCurrentBooking).toHaveBeenCalledTimes(1);
    });
    test("ошибку открытия ссылки передаёт в уведомление", async () => {
      jest.mocked(openExternalLink).mockRejectedValueOnce(new Error("Недоступно"));
      const c = makeController();
      const ui = await render(<BookingDialog controller={c} />);
      await fireEvent.press(ui.getByText("Сайт"));
      expect(c.showToast).toHaveBeenCalledWith("error", "Не удалось открыть ссылку");
    });
  });
});

describe("CalendarExportDialog", () => {
  describe("CalendarExportDialog", () => {
    test("открывает сайт Яндекс Календаря", async () => {
      const c = makeController();
      const ui = await render(<CalendarExportDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Открыть Яндекс Календарь" }));
      expect(openExternalLink).toHaveBeenCalledWith("https://calendar.yandex.ru/");
    });
    test("меняет выбранную встречу", async () => {
      const c = makeController();
      const ui = await render(<CalendarExportDialog controller={c} />);
      const options = ui.getAllByRole("radio");
      expect(options[0]).toBeChecked();
      expect(options[1]).not.toBeChecked();
      await fireEvent.press(options[1]);
      expect(ui.getAllByRole("radio")[1]).toBeChecked();
      expect(ui.getAllByRole("radio")[0]).not.toBeChecked();
    });
    test("выключает экспорт и закрывает окно", async () => {
      const c = makeController();
      const ui = await render(<CalendarExportDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Выключить экспорт" }));
      expect(c.update).toHaveBeenCalledWith({ calendar: false });
      expect(c.setDialog).toHaveBeenCalledWith(null);
    });
  });
});

describe("EditProfileDialog", () => {
  describe("EditProfileDialog", () => {
    test("передаёт изменения полей профиля контроллеру", async () => {
      const c = makeController();
      const ui = await render(<EditProfileDialog controller={c} />);
      await fireEvent.changeText(ui.getByDisplayValue(c.editName), "Маша");
      expect(c.setEditName).toHaveBeenCalledWith("Маша");
      await fireEvent.changeText(ui.getByDisplayValue(c.editEmail), "m@example.ru");
      expect(c.setEditEmail).toHaveBeenCalledWith("m@example.ru");
    });
    test.each([
      ["Выбрать фотографию", "pickAvatar"],
      ["Сохранить", "saveProfile"],
    ] as const)("передаёт действие «%s» контроллеру", async (label, handler) => {
      const c = makeController();
      const ui = await render(<EditProfileDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: label }));
      expect(c[handler]).toHaveBeenCalledTimes(1);
    });
  });
});

describe("FiltersDialog", () => {
  describe("FiltersDialog", () => {
    test("показывает кухни и пределы чека из каталога, включая варианты за пределами прежнего списка", async () => {
      const c = makeController();
      const ui = await render(<FiltersDialog controller={c} />);
      await fireEvent.press(ui.getByText("Азербайджанская"));
      await fireEvent.press(ui.getByRole("combobox", {name:"Средний чек на человека"}));
      await fireEvent.press(ui.getByRole("button", {name:"До 7200 ₽"}));
      expect(c.setFilterCuisine).toHaveBeenCalledWith(["Азербайджанская"]);
      expect(c.setFilterBudget).toHaveBeenCalledWith("До 7200 ₽");
    });
    test("передаёт выбранные ограничения контроллеру", async () => {
      const c = makeController();
      const ui = await render(<FiltersDialog controller={c} />);
      await fireEvent.press(ui.getByText("Кофе"));
      expect(ui.getByText("Средний чек на человека")).toBeOnTheScreen();
      await fireEvent.press(ui.getByRole("combobox", {name:"Средний чек на человека"}));
      await fireEvent.press(ui.getByRole("button", {name:"До 1000 ₽"}));
      expect(c.setFilterBudget).toHaveBeenCalledWith("До 1000 ₽");
      expect(c.setFilterCuisine).toHaveBeenCalledWith(["Кофе"]);
      expect(ui.queryByText("Расстояние")).toBeNull();
    });
    test("закрывает окно и сообщает о применении фильтров", async () => {
      const c = makeController();
      const ui = await render(<FiltersDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Показать места" }));
      expect(c.setDialog).toHaveBeenCalledWith(null);
      expect(c.showToast).toHaveBeenCalledWith("success", "Фильтры применены");
    });
    test("сбрасывает все ограничения", async () => {
      const c = makeController({
        filterBudget: "До 1000 ₽",
        filterCuisine: ["Кофе"],
      });
      const ui = await render(<FiltersDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Сбросить" }));
      expect(c.setFilterBudget).toHaveBeenLastCalledWith("Все");
      expect(c.setFilterCuisine).toHaveBeenLastCalledWith([]);
    });
  });

  test('несколько кухонь выбираются и снимаются независимо', async()=>{
   const c=makeController({filterCuisine:['Кофе','Японская']});
   const ui=await render(<FiltersDialog controller={c}/>);
   await fireEvent.press(ui.getByText('Грузинская'));
   expect(c.setFilterCuisine).toHaveBeenLastCalledWith(['Кофе','Японская','Грузинская']);
   await fireEvent.press(ui.getByText('Кофе'));
   expect(c.setFilterCuisine).toHaveBeenLastCalledWith(['Японская']);
  });
});

describe("InviteDialog", () => {
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


  describe("InviteDialog: валидация email", () => {
    test.each([
      ["bad-email", "Введите email зарегистрированного участника"],
      ["С".repeat(31), "Введите email зарегистрированного участника"],
    ])("не добавляет участника с некорректным email %s", async (inviteName, error) => {
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
  });
});

describe("MeetingActionsDialog", () => {
  describe("MeetingActionsDialog", () => {
    test("вызывает открытие списка участников", async () => {
      const c = makeController();
      const ui = await render(<MeetingActionsDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Участники" }));
      expect(c.setDialog).toHaveBeenCalledWith("participants");
    });
    test("закрывает меню и вызывает переход к редактированию", async () => {
      const c = makeController();
      const ui = await render(<MeetingActionsDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Изменить предпочтения" }));
      expect(c.setDialog).toHaveBeenLastCalledWith(null);
      expect(c.setScreen).toHaveBeenCalledWith("edit");
    });
    test("вызывает выбор лидера", async () => {
      const c = makeController();
      const ui = await render(<MeetingActionsDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Выбрать лидера" }));
      expect(c.selectLeader).toHaveBeenCalledTimes(1);
    });
    test("после завершения скрывает выбор лидера и показывает отмену брони", async () => {
      const c = makeController();
      c.meeting = { ...c.meeting, status: "completed" };
      const ui = await render(<MeetingActionsDialog controller={c} />);
      expect(ui.queryByText("Выбрать лидера")).toBeNull();
      await fireEvent.press(ui.getByRole("button", { name: "Отменить бронирование" }));
      expect(c.cancelCurrentBooking).toHaveBeenCalledTimes(1);
    });
  });
});

describe("ParticipantsDialog", () => {
  describe("ParticipantsDialog", () => {
    test("передаёт имя удаляемого участника", async () => {
      const c = makeController();
      const ui = await render(<ParticipantsDialog controller={c} />);
      expect(ui.getByText("Аня")).toBeOnTheScreen();
      await fireEvent.press(ui.getAllByRole("button", { name: "close" })[0]);
      expect(c.removeParticipant).toHaveBeenCalledWith("Полина");
    });
    test("вызывает открытие приглашения", async () => {
      const c = makeController();
      const ui = await render(<ParticipantsDialog controller={c} />);
      await fireEvent.press(ui.getByRole("button", { name: "Пригласить" }));
      expect(c.setDialog).toHaveBeenCalledWith("invite");
    });
  });
});
