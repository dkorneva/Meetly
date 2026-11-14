import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import openapi from "./http/openapi.json";
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

/** Создаёт приложение. В HTTP-тестах без БД подключение можно явно отключить. */
export async function createApp(options: { connectDatabase?: boolean } = {}) {
  process.env.TZ = "Europe/Moscow";
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Задайте JWT_SECRET длиной минимум 32 символов");
  }
  const services = createServices(secret);
  const app = express();
  app.disable("x-powered-by");
  app.set("query parser", "simple");
  const origins = (process.env.WEB_ORIGINS ?? "http://localhost:8081").split(",");
  app.use(cors({ origin: origins, credentials: false }));
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  app.get("/api/docs-json", function (req, res) { res.json(openapi); });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.use("/api/auth", authRoutes(services));
  app.use("/api/users", usersRoutes(services));
  app.use("/api/meetings/:meetingId/messages", chatRoutes(services));
  app.use("/api/meetings", meetingsRoutes(services));
  app.use("/api/restaurants", restaurantsRoutes(services));
  app.use("/api/files", filesRoutes(services));
  app.use("/api", mapRoutes(services.tiles));
  app.use(function (req, res, next) {
    next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
  });
  app.use(handleError);

  // Подключаем БД до открытия порта: запросы принимаются только с рабочим хранилищем.
  if (options.connectDatabase !== false) {
    try { await services.db.connect(); }
    catch (error) { await services.db.disconnect(); throw error; }
  }
  const server = createServer(app);
  const io = new Server(server, { cors: { origin: false }, maxHttpBufferSize: 16384 });
  services.realtime.attach(io);

  async function listen(port: number, host = "0.0.0.0") {
    await new Promise<void>(function (resolve, reject) {
      server.once("error", reject);
      server.listen(port, host, function () {
        server.off("error", reject);
        resolve();
      });
    });
  }
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
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (require.main === module) {
  start().catch(function () {
    console.error("Не удалось запустить сервер. Проверьте настройки окружения и доступность SQL Server.");
    process.exitCode = 1;
  });
}
