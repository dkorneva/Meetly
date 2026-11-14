import { Request, RequestHandler } from "express";
import { AuthService } from "../application/auth.service";
import { UnauthorizedError } from "./errors";

export interface UserRequest extends Request {
  userId?: string;
}

/** Middleware выполняется до обработчика защищённого маршрута. */
export function requireAuth(auth: AuthService): RequestHandler {
  return async function (req: UserRequest, res, next) {
    try {
      const header = req.headers.authorization;
      let token = "";
      if (header?.startsWith("Bearer ")) token = header.slice(7);
      req.userId = await auth.identify(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function userId(req: UserRequest): string {
  if (!req.userId) throw new UnauthorizedError();
  return req.userId;
}
