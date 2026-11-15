import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createServices } from "./services";
import { authRoutes } from "./http/auth.routes";
import { usersRoutes } from "./http/users.routes";
import { meetingsRoutes } from "./http/meetings.routes";
import { chatRoutes } from "./http/chat.routes";
import { restaurantsRoutes } from "./http/restaurants.routes";
import { filesRoutes } from "./http/files.routes";
import { mapRoutes } from "./http/map.routes";
import { NotFoundError } from "./http/errors";
import { handleError } from "./http/error-handler";

/** Настройка и запуск сервера, создание приложения */
export async function createApp(options: { connectDatabase?: boolean } = {}) {
  process.env.TZ = "Europe/Moscow";
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Задайте JWT_SECRET длиной минимум 32 символов");
  }
  const services = createServices(secret);
  const app = express();
  app.disable("x-powered-by"); // Убирает заголовок ответа, сообщающий, что сервер использует Express
  app.set("query parser", "simple"); // Включает простой разбор параметров после ? в адресе
  const origins = (process.env.WEB_ORIGINS ?? "http://localhost:8081").split(",");
  app.use(cors({ origin: origins, credentials: false })); // Настраивает доступ к серверу из браузера (веб-приложение и сервер работают на разных портах)
  app.use(express.json({ limit: "100kb" })); // express читает JSON
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));  // чтение данных форм

  // Маршруты API
  app.use("/api/auth", authRoutes(services)); // Регистрация, вход
  app.use("/api/users", usersRoutes(services)); // Профиль и настройки пользователя
  app.use("/api/meetings/:meetingId/messages", chatRoutes(services)); // Сообщения, история чата и реакции
  app.use("/api/meetings", meetingsRoutes(services)); // Встречи, участники, приглашения, голосование и бронь
  app.use("/api/restaurants", restaurantsRoutes(services)); // Каталог ресторанов и фильтры
  app.use("/api/files", filesRoutes(services)); // Загрузка и хранение файлов
  app.use("/api", mapRoutes(services.tiles)); // Получение и кеширование изображений подложки карты
  app.use(function (req, res, next) {
    next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
  });
  app.use(handleError);

  // Подключение БД до открытия порта
  if (options.connectDatabase !== false) {
    try { await services.db.connect(); }
    catch (error) { await services.db.disconnect(); throw error; }
  }

  // подключение Socket.IO
  // origin: false отключает выдачу разрешающих CORS-заголовков в настройке Socket.IO; проверка личности выполняется отдельно;
  // maxHttpBufferSize: 16384 ограничивает размер входящего сообщения Socket.IO примерно 16 К
  const server = createServer(app);
  const io = new Server(server, { cors: { origin: false }, maxHttpBufferSize: 16384 });
  services.realtime.attach(io);

  // Открытие порта, запуск сервера
  async function listen(port: number, host = "0.0.0.0") {
    await new Promise<void>(function (resolve, reject) {
      server.once("error", reject);
      server.listen(port, host, function () {
        server.off("error", reject);
        resolve();
      });
    });
  }
  // Остановка сервера
  let closing: Promise<void> | undefined;
  function close(): Promise<void> {
    if (!closing) {
      closing = new Promise<void>(function (resolve) { io.close(function () { resolve(); }); })
        .finally(function () { return services.db.disconnect(); });
    }
    return closing;
  }
  return { app, server, services, listen, close };
}

// Запуск сервера
async function start() {
  const application = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  try { await application.listen(port); }
  catch (error) { await application.close(); throw error; }
  console.log(`Meetly API: http://localhost:${port}/api`);
  async function shutdown() {
    try { await application.close(); }
    catch { process.exitCode = 1; }
  }
  // Обработка сигналов завершения работы
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

// Проверяет, является ли текущий файл главным запускаемым файлом процесса
if (require.main === module) {
  start().catch(function () {
    console.error("Не удалось запустить сервер. Проверьте настройки окружения и доступность SQL Server");
    process.exitCode = 1;
  });
}
