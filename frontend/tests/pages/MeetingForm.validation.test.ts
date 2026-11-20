import { catalogFilters } from "../catalogFilters";
import { validateMeetingForm, validateParticipant } from "../../src/pages/meeting-form/model/validation";
import { meetingFormValues } from "./meetingFormValues";



describe("MeetingForm.validation", () => {
  const now = new Date(2026, 10, 1, 12);

  describe("Название встречи", () => {
    test.each([
      ["", false], ["   ", false], ["А", false], ["Ая", true],
      ["А".repeat(100), true], ["А".repeat(101), false],
      [" Ужин! ", true], ["День рождения 🎉", true], ["12", true],
      ["!!", false], ["🎉🎉", false], ["Ужин\nс друзьями", false],
      ["Ужин\tзавтра", false], ["Ужин\u0000", false],
    ])("название %s: допустимость %s", (title, accepted) => {
      expect(validateMeetingForm({ ...meetingFormValues(), title }, undefined, now) === "").toBe(accepted);
    });
  });

  describe("Участники", () => {
    test.each([
      ["", false], ["А", false], ["Ая", true], ["Я".repeat(30), true], ["Я".repeat(31), false],
      ["Анна-Мария", true], ["Иван Иванов", true], ["Ёлка", true], ["John", true],
      [" Саша", false], ["Саша ", false], ["Саша1", false], ["Саша!", false],
    ])("имя %s: допустимость %s", (name, accepted) => {
      expect(validateParticipant(name) === "").toBe(accepted);
    });
    test("считает одинаковыми имена с разным регистром", () => {
      expect(validateParticipant("сАшА", ["Саша"])).toBe("Этот участник уже добавлен");
    });
    test("при сохранении отклоняет повторяющихся участников", () => {
      expect(validateMeetingForm({ ...meetingFormValues(), participants: ["Саша", "саша"] }, undefined, now))
        .toBe("Этот участник уже добавлен");
    });
  });

  describe("Бюджет и варианты выбора", () => {
    test.each([
      [500, true], [5000, true], [400, false], [5100, true], [7200, true], [100000, true], [100100, false], [550, false],
      [1500.5, false], [NaN, false], [Infinity, false],
    ])("бюджет %s: допустимость %s", (budget, accepted) => {
      expect(validateMeetingForm({ ...meetingFormValues(), budget }, undefined, now) === "").toBe(accepted);
    });
    test.each([
      [{ cuisines: [] }, true], [{ cuisines: ["Кофе", "Бар"] }, true],
      [{ cuisines: ["Кофе", "Кофе"] }, false], [{ cuisines: ["Нет такой кухни"] }, false],
      [{ format: "Не важно" }, true], [{ format: "" }, false], [{ format: "Нет такого формата" }, false],
    ])("поля %j: допустимость %s", (patch, accepted) => {
      expect(validateMeetingForm({ ...meetingFormValues(), ...patch }, undefined, now, catalogFilters.cuisines) === "").toBe(accepted);
    });
  });
});

describe("MeetingForm.date", () => {
  const now = new Date(2026, 10, 1, 12);

  test.each([
    ["2026-11-01", "12:01", true],
    ["2026-11-01", "12:00", false],
    ["2026-11-01", "11:59", false],
    ["2026-10-31", "19:00", false],
    ["2026-11-02", "09:00", true],
    ["2026-02-30", "19:00", false],
    ["2028-02-29", "19:00", true],
    ["2027-02-29", "19:00", false],
    ["2026-13-01", "19:00", false],
    ["2026-11-02", "24:00", false],
    ["2026-11-02", "19:60", false],
    ["", "19:00", false],
    ["2026-11-02", "", false],
  ])("новая встреча %s %s: допустимость %s", (date, time, accepted) => {
    expect(validateMeetingForm({ ...meetingFormValues(), date, time }, undefined, now) === "").toBe(accepted);
  });

  test("разрешает изменить название старой встречи без изменения даты и времени", () => {
    const original = { ...meetingFormValues(), date: "2026-09-01" };
    expect(validateMeetingForm({ ...original, title: "Другое название" }, original, now)).toBe("");
  });

  test.each([
    ["2026-09-02", "19:00", false],
    ["2026-09-01", "20:00", false],
    ["2026-11-02", "19:00", true],
  ])("изменённое расписание %s %s: допустимость %s", (date, time, accepted) => {
    const original = { ...meetingFormValues(), date: "2026-09-01" };
    expect(validateMeetingForm({ ...original, date, time }, original, now) === "").toBe(accepted);
  });
});
