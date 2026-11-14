import { rateLimit } from "express-rate-limit";
import { HttpError } from "./errors";

/** У каждого маршрута свой счётчик запросов по IP, как до перехода на Express. */
export function limit(requests = 120) {
  return rateLimit({
    windowMs: 60000,
    limit: requests,
    standardHeaders: false,
    legacyHeaders: false,
    handler(req, res, next) {
      next(new HttpError(429, "ThrottlerException: Too Many Requests"));
    },
  });
}
