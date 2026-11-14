import { validateMeetingForm, validateParticipant } from "../../src/pages/meeting-form/model/validation";
import { meetingFormValues } from "./meetingFormValues";

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
    [500, true], [5000, true], [400, false], [5100, false], [550, false],
    [1500.5, false], [NaN, false], [Infinity, false],
  ])("бюджет %s: допустимость %s", (budget, accepted) => {
    expect(validateMeetingForm({ ...meetingFormValues(), budget }, undefined, now) === "").toBe(accepted);
  });
  test.each([
    [{ cuisines: [] }, true], [{ cuisines: ["Кофе", "Бар"] }, true],
    [{ cuisines: ["Кофе", "Кофе"] }, false], [{ cuisines: ["Нет такой кухни"] }, false],
    [{ district: "Не важно" }, true], [{ district: "" }, false], [{ district: "Нет такого района" }, false],
    [{ format: "Не важно" }, true], [{ format: "" }, false], [{ format: "Нет такого формата" }, false],
  ])("поля %j: допустимость %s", (patch, accepted) => {
    expect(validateMeetingForm({ ...meetingFormValues(), ...patch }, undefined, now) === "").toBe(accepted);
  });
});
