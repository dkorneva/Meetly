import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { RuleViolation } from "../domain/meeting-rules";
/**
 * Преобразует ожидаемые и непредвиденные ошибки в стабильные HTTP-ответы без внутренних деталей.
 */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger("API");
  /**
   * Сопоставляет ошибки HTTP, доменных правил и Prisma со статусами; неизвестную ошибку скрывает за ответом 500.
   * @param error Перехваченная ошибка.
   * @param host Контекст ответа HTTP.
   */
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    if (error instanceof HttpException)
      return response
        .status(error.getStatus())
        .json({ statusCode: error.getStatus(), message: error.getResponse() });
    if (error instanceof RuleViolation)
      return response
        .status(409)
        .json({ statusCode: 409, message: error.message });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        return response.status(409).json({
          statusCode: 409,
          message: "Запись с такими данными уже существует",
        });
      if (error.code === "P2025")
        return response
          .status(404)
          .json({ statusCode: 404, message: "Запись не найдена" });
      if (error.code === "P2034")
        return response.status(409).json({
          statusCode: 409,
          message: "Данные изменились. Повторите действие",
        });
    }
    // Не логируем тело запроса: там могут находиться пароль и токены.
    this.logger.error(error instanceof Error ? error.message : "Unknown error");
    return response
      .status(500)
      .json({ statusCode: 500, message: "Внутренняя ошибка сервера" });
  }
}
