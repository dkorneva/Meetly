import type { Store } from "../../entities/meeting";
import { initialMeetings,initialMessages } from "../../entities/meeting";

export const initialStore: Store = {
  meetings: initialMeetings,
  messages: { team: initialMessages },
  name: "Аня Смирнова",
  email: "anya.smirnova@gmail.com",
  reminders: true,
  dark: false,
  calendar: true,
  session: false,
  onboarded: false,
};
