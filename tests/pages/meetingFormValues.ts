import type { Meeting } from "../../src/entities/meeting";

/** Независимые корректные данные без зависимости от демонстрационного каталога. */
export function meetingFormValues(): Meeting {
  return {
    id: "meeting", title: "Ужин", date: "2026-11-02", time: "19:00", status: "voting",
    participants: ["Аня"], votes: {}, budget: 1500, cuisines: ["Кофе"],
    district: "Центр", format: "В помещении",
  };
}
