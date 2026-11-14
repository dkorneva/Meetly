/** Входные данные сценариев. HTTP DTO проверяют их до вызова сервиса. */
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
export interface RestaurantInput {
  name: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  cuisine: string;
  price?: number;
  phone?: string;
  website?: string;
  outdoor?: boolean;
}
