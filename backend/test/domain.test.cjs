const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  chooseWinner,
  meetingInstant,
  requireVoting,
} = require("../dist/domain/meeting-rules");
const { calendarEvent } = require("../dist/domain/calendar");
const { recommendationScore } = require("../dist/domain/recommendations");
test("Подбор учитывает кухни и бюджет каждого участника", () => {
  const prefs = [
    { budget: 1000, cuisines: ["Итальянская"] },
    { budget: 2000, cuisines: [] },
  ];
  assert.equal(
    recommendationScore(
      { cuisine: "italian", price: 900, outdoor: false },
      prefs,
      "В помещении",
    ),
    4,
  );
  assert.equal(
    recommendationScore(
      { cuisine: "italian", price: null, outdoor: false },
      prefs,
      "В помещении",
    ),
    2,
  );
  assert.equal(
    recommendationScore(
      { cuisine: "italian", price: 900, outdoor: false },
      prefs,
      "На улице",
    ),
    -1,
  );
});
test("Ничья и отсутствие голосов не дают произвольного победителя", () => {
  assert.throws(() => chooseWinner([]));
  assert.throws(() =>
    chooseWinner([{ restaurantId: "a" }, { restaurantId: "b" }]),
  );
  assert.equal(
    chooseWinner([
      { restaurantId: "a" },
      { restaurantId: "a" },
      { restaurantId: "b" },
    ]),
    "a",
  );
});
test("Голосование закрыто после выбора места", () => {
  assert.throws(() => requireVoting("completed"));
  requireVoting("voting");
});
test("Дата проверяется и переводится из Москвы в UTC", () => {
  assert.throws(() => meetingInstant("2027-02-30", "12:00"));
  assert.equal(
    meetingInstant("2027-02-28", "12:00").toISOString(),
    "2027-02-28T09:00:00.000Z",
  );
});
test("ICS экранирует поля и переносит длинный русский текст без разрыва UTF-8", () => {
  const text = calendarEvent(
    {
      id: "one",
      title: "Длинная встреча ".repeat(15) + "\nLOCATION:injected",
      startsAt: new Date("2027-01-01T09:00:00Z"),
      version: 2,
    },
    "Кафе; Москва",
  );
  assert.ok(text.includes("DTSTART:20270101T090000Z"));
  assert.ok(!text.includes("BEGIN:VALARM"));
  assert.ok(!text.includes("\r\nLOCATION:injected"));
  for (const line of text.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
});
