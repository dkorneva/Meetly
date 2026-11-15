import { Database } from "./infrastructure/database";
import { Tokens } from "./infrastructure/tokens";
import { AuthService } from "./application/auth.service";
import { MeetingsService } from "./application/meetings.service";
import { FilesService } from "./application/files.service";
import { UsersService } from "./application/users.service";
import { ChatService } from "./application/chat.service";
import { RestaurantsService } from "./application/restaurants.service";
import { DiscoveryService } from "./application/discovery.service";
import { CalendarService } from "./application/calendar.service";
import { MapTiles } from "./infrastructure/map-tiles";
import { Realtime } from "./infrastructure/realtime";

/** Зависимости создаются явно: видно, какие объекты нужны каждому сервису. */
export function createServices(secret: string) { // JWT_SECRET
  const db = new Database(); // Обращение к SQL Server через Prisma
  const tokens = new Tokens(secret); // 	Создание и проверка JWT-токенов
  const auth = new AuthService(db, tokens); // Аутентификация пользователей
  const meetings = new MeetingsService(db); //	Встречи, участники, приглашения, голосование и бронь
  const files = new FilesService(db, meetings, tokens); // Загрузка и хранение файлов
  const users = new UsersService(db, files); // Профиль и настройки пользователя
  const chat = new ChatService(db, meetings, files); // Сообщения, история чата и реакции
  const restaurants = new RestaurantsService(db); // 	Каталог ресторанов и фильтры
  const discovery = new DiscoveryService(db, meetings, restaurants); // Подбор ресторанов для участников встречи
  const calendar = new CalendarService(db, meetings); // Выгрузка встречи в календарный файл
  const tiles = new MapTiles(); // Получение и кеширование изображений подложки карты
  const realtime = new Realtime(auth, db); 	// Отправка уведомлений об изменениях через Socket.IO
  return { db, tokens, auth, meetings, files, users, chat, restaurants, discovery, calendar, tiles, realtime };
}

export interface Services {
  db: Database;
  tokens: Tokens;
  auth: AuthService;
  meetings: MeetingsService;
  files: FilesService;
  users: UsersService;
  chat: ChatService;
  restaurants: RestaurantsService;
  discovery: DiscoveryService;
  calendar: CalendarService;
  tiles: MapTiles;
  realtime: Realtime;
}
