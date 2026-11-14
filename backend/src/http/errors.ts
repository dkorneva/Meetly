/** Ожидаемая ошибка запроса. Её сообщение можно показать пользователю. */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad Request") { super(400, message); }
}
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") { super(401, message); }
}
export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") { super(403, message); }
}
export class NotFoundError extends HttpError {
  constructor(message = "Not Found") { super(404, message); }
}
export class ConflictError extends HttpError {
  constructor(message = "Conflict") { super(409, message); }
}
export class ServiceUnavailableError extends HttpError {
  constructor(message = "Service Unavailable") { super(503, message); }
}
