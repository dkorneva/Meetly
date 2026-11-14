import type { Store } from "../../entities/meeting";

export const initialStore: Store = {
  meetings: [],
  messages: {},
  name: "",
  email: "",
  dark: false,
  calendar: true,
  session: false,
  onboarded: false,
};
