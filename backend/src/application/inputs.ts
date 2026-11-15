/** Входные данные сценариев. HTTP-слой проверяет их обычными функциями до вызова сервиса. */
export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput extends LoginInput {
  name: string;
}
export interface PreferenceInput {
  budget: number;
  cuisines: string[];
}
export interface MeetingInput extends PreferenceInput {
  title: string;
  date: string;
  time: string;

  city?: string;
  format: string;
}
export interface MessageInput {
  text: string;
  fileId?: string;
}
