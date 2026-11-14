import type { Meeting, Message } from "./models";

// Описывает структуру данных приложения, которые сохраняются в локальном хранилище:
// встречи, сообщения, данные пользователя и настройки.
export type Store = {
  userId?: string;
  meetings: Meeting[];
  messages: Record<string, Message[]>;
  name: string;
  email: string;
  dark: boolean;
  calendar: boolean;
  session: boolean;
  onboarded: boolean;
  avatar?: string;
};
