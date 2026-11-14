import { DiscoveryService } from "./application/discovery.service";
import { UsersService } from "./application/users.service";
import { CalendarService } from "./application/calendar.service";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { Database } from "./infrastructure/database";
import { Realtime } from "./infrastructure/realtime";
import { AuthService } from "./application/auth.service";
import { MeetingsService } from "./application/meetings.service";
import { ChatService } from "./application/chat.service";
import { FilesService } from "./application/files.service";
import { RestaurantsService } from "./application/restaurants.service";
import { AuthGuard } from "./http/auth.guard";
import {
  AuthController,
  ChatController,
  FilesController,
  MeetingsController,
  RestaurantsController,
  UsersController,
} from "./http/controllers";
import { MapController } from "./http/map.controller";
import { MapTiles } from "./infrastructure/map-tiles";
/**
 * Корневой модуль NestJS: регистрирует HTTP-контроллеры, сервисы, JWT и ограничение частоты запросов.
 */
@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
  ],
  controllers: [
    AuthController,
    UsersController,
    MeetingsController,
    ChatController,
    RestaurantsController,
    FilesController,
    MapController,
  ],
  providers: [
    MapTiles,
    Database,
    UsersService,
    CalendarService,
    DiscoveryService,
    AuthService,
    MeetingsService,
    ChatService,
    FilesService,
    RestaurantsService,
    AuthGuard,
    Realtime,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
