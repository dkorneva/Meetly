
import { Server, Socket } from "socket.io";
import { AuthService } from "../application/auth.service";
import { Database } from "./database";

// Проверять подключившихся пользователей
// Отправлять уведомления нужным получателям

/** Каждое устройство подписано только на личную "комнату" пользователя
 * Получателей определяем из актуального состава встречи, поэтому исключённый участник не получает события. */
export class Realtime {
  // Объект Realtime создаётся раньше, чем к нему подключают Socket.IO-сервер
  // Поэтому сначала поле пустое, а позже заполняется методом attach
  private server?: Server;

  /** Сервер Socket.IO подключается явно к тому же HTTP-серверу. */
  attach(server: Server) {
    this.server = server;
    server.on("connection", (socket) => { void this.handleConnection(socket); }); // обработка подключения клиента
  }
  constructor(
    private readonly auth: AuthService, // проверка подключившихся пользователей
    private readonly db: Database, // получение состава участников встречи
  ) {}
  /**
   * Аутентифицирует сокет, подписывает его на личную "комнату" и ограничивает время соединения сроком access-токена
   * @param socket Подключённый Socket.IO-клиент
   */
  async handleConnection(socket: Socket) {
    try {
      const id = await this.auth.identify(socket.handshake.auth.token ?? "");
      await socket.join(`user:${id}`); // добавление подключения в личную "комнату"
      // Повторная аутентификация после истечения короткого access token.
      const timer = setTimeout(() => socket.disconnect(true), 15 * 60 * 1000); // отключение клиента после истечения срока access-токена
      timer.unref(); // предотвращение удержания процесса Node.js из-за таймера
      socket.once("disconnect", () => clearTimeout(timer)); // отмена таймера при отключении клиента
    } catch {
      socket.disconnect(true);
    }
  }
  /**
   * Уведомляет актуальных участников встречи и при необходимости дополнительно указанного пользователя
   * @param meetingId ID встречи, доступ к которой проверяется
   * @param extraUserId Дополнительный пользователь, например удалённый участник
   */
  async changed(meetingId: string, extraUserId?: string) {
    const members = await this.db.member.findMany({
      where: { meetingId }, // найти участников, у которых id встречи совпадает с переданными
      select: { userId: true }, // из каждой записи вернуть только id пользователя
    });
    const users = new Set([ // создаёт коллекцию уникальных значений
      ...members.map((m) => m.userId), // добавить id участников встречи
      ...(extraUserId ? [extraUserId] : []), // добавить id дополнительного пользователя, если он указан
    ]);
    for (const id of users)
      this.server?.to(`user:${id}`).emit("meeting.changed", { meetingId }); // отправка событий
  }
}
