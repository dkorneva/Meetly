/** Ожидаемая ошибка запроса. Её сообщение можно показать пользователю */
export class HttpError extends Error {
  /** Создаёт ошибку с HTTP-кодом и сообщением, которое можно показать пользователю. */
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/** Ошибка 400: неверные данные запроса. */
export class BadRequestError extends HttpError {
  /** Создаёт ошибку 400 с указанным сообщением. */
  constructor(message = "Bad Request") { super(400, message); }
}
/** Ошибка 401: пользователь не вошёл в аккаунт или его сессия недействительна. */
export class UnauthorizedError extends HttpError {
  /** Создаёт ошибку 401 с указанным сообщением. */
  constructor(message = "Unauthorized") { super(401, message); }
}
/** Ошибка 403: недостаточно прав для действия. */
export class ForbiddenError extends HttpError {
  /** Создаёт ошибку 403 с указанным сообщением. */
  constructor(message = "Forbidden") { super(403, message); }
}
/** Ошибка 404: запрошенная запись или ресурс не найдены. */
export class NotFoundError extends HttpError {
  /** Создаёт ошибку 404 с указанным сообщением. */
  constructor(message = "Not Found") { super(404, message); }
}
/** Ошибка 409: действие конфликтует с текущими данными. */
export class ConflictError extends HttpError {
  /** Создаёт ошибку 409 с указанным сообщением. */
  constructor(message = "Conflict") { super(409, message); }
}
/** Ошибка 503: сервис временно недоступен. */
export class ServiceUnavailableError extends HttpError {
  /** Создаёт ошибку 503 с указанным сообщением. */
  constructor(message = "Service Unavailable") { super(503, message); }
}
