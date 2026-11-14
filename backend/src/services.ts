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
export function createServices(secret: string) {
  const db = new Database();
  const tokens = new Tokens(secret);
  const auth = new AuthService(db, tokens);
  const meetings = new MeetingsService(db);
  const files = new FilesService(db, meetings, tokens);
  const users = new UsersService(db, files);
  const chat = new ChatService(db, meetings, files);
  const restaurants = new RestaurantsService(db);
  const discovery = new DiscoveryService(db, meetings, restaurants);
  const calendar = new CalendarService(db, meetings);
  const tiles = new MapTiles();
  const realtime = new Realtime(auth, db);
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
