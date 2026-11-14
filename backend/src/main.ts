import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ErrorFilter } from "./http/error.filter";
/**
 * Создаёт, но не запускает прослушивание Nest-приложения; настраивает валидацию, CORS, защитные заголовки и Swagger.
 * @returns Настроенное приложение NestJS без привязки к порту.
 */
export async function createApp() {
  process.env.TZ = "Europe/Moscow";
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("Задайте JWT_SECRET длиной минимум 32 символа");
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  app.setGlobalPrefix("api");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.enableCors({
    origin: (process.env.WEB_ORIGINS ?? "http://localhost:8081").split(","),
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ErrorFilter());
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Meetly API")
      .setDescription(
        "API мобильного приложения Meetly. Все даты встреч вводятся по московскому времени.",
      )
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  document.security = [{ bearer: [] }];
  for (const [path, operations] of Object.entries(document.paths))
    if (
      path.startsWith("/api/auth/") ||
      path === "/api/map" || path.startsWith("/api/map-assets/") || path.startsWith("/api/map-tiles/") ||
      path === "/api/health"
    )
      for (const operation of Object.values(operations))
        if (
          operation &&
          typeof operation === "object" &&
          "responses" in operation
        )
          operation.security = [];
  SwaggerModule.setup("api/docs", app, document);
  app.enableShutdownHooks();
  return app;
}
if (require.main === module)
  createApp().then((app) =>
    app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0"),
  );
