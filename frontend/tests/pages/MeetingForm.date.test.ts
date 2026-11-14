import { validateMeetingForm } from "../../src/pages/meeting-form/model/validation";
import { meetingFormValues } from "./meetingFormValues";

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
