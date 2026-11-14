import { Injectable } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService } from "../application/auth.service";
import { Database } from "./database";
/** Каждое устройство подписано только на личную комнату пользователя.
 * Получателей определяем из актуального состава встречи, поэтому исключённый участник не получает события. */
@Injectable()
@WebSocketGateway({ cors: { origin: false }, maxHttpBufferSize: 16384 })
export class Realtime implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  constructor(
    private readonly auth: AuthService,
    private readonly db: Database,
  ) {}
  /**
   * Аутентифицирует сокет, подписывает его на личную комнату и ограничивает время соединения сроком access-токена.
   * @param socket Подключённый Socket.IO-клиент.
   */
  async handleConnection(socket: Socket) {
    try {
      const id = await this.auth.identify(socket.handshake.auth.token ?? "");
      await socket.join(`user:${id}`);
      // Повторная аутентификация после истечения короткого access token.
      const timer = setTimeout(() => socket.disconnect(true), 15 * 60 * 1000);
      timer.unref();
      socket.once("disconnect", () => clearTimeout(timer));
    } catch {
      socket.disconnect(true);
    }
  }
  /**
   * Уведомляет актуальных участников встречи и при необходимости дополнительно указанного пользователя.
   * @param meetingId ID встречи, доступ к которой проверяется.
   * @param extraUserId Дополнительный пользователь, например удалённый участник.
   */
  async changed(meetingId: string, extraUserId?: string) {
    const members = await this.db.member.findMany({
      where: { meetingId },
      select: { userId: true },
    });
    const users = new Set([
      ...members.map((m) => m.userId),
      ...(extraUserId ? [extraUserId] : []),
    ]);
    for (const id of users)
      this.server?.to(`user:${id}`).emit("meeting.changed", { meetingId });
  }
}
