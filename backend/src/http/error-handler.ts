import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { RuleViolation } from "../domain/meeting-rules";
import { HttpError } from "./errors";

/** Сохраняем статусы и форму ответов, с которыми уже работает мобильный клиент. */
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    const labels: Record<number, string> = {
      400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
      404: "Not Found", 409: "Conflict", 413: "Payload Too Large",
      429: "Too Many Requests", 503: "Service Unavailable",
    };
    return {
      statusCode: error.status,
      message: { message: error.message, error: labels[error.status], statusCode: error.status },
    };
  }
  if (error instanceof RuleViolation) {
    return { statusCode: 409, message: error.message };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { statusCode: 409, message: "Запись с такими данными уже существует" };
    }
    if (error.code === "P2025") {
      return { statusCode: 404, message: "Запись не найдена" };
    }
    if (error.code === "P2034") {
      return { statusCode: 409, message: "Данные изменились. Повторите действие" };
    }
  }
  if (error instanceof MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return errorResponse(new HttpError(status, error.message));
  }
  if (error instanceof SyntaxError && "body" in error) {
    return errorResponse(new HttpError(400, "Некорректный JSON"));
  }
  if (error instanceof URIError) {
    return errorResponse(new HttpError(400, "Некорректный адрес запроса"));
  }
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    return errorResponse(new HttpError(413, "Request body too large"));
  }
  return { statusCode: 500, message: "Внутренняя ошибка сервера" };
}

export const handleError: ErrorRequestHandler = function (error, req, res, next) {
  if (res.headersSent) { next(error); return; }
  const body = errorResponse(error);
  // Не выводим тело запроса, токены или внутренние сообщения SQL в журнал.
  if (body.statusCode === 500) console.error("Unexpected API error", req.method, req.path);
  res.status(body.statusCode).json(body);
};
