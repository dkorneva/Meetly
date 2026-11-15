import { Router } from "express";
import { Services } from "../services";
import { limit } from "./rate-limit";
import * as validate from "./validation";

/**
 * Описывает адреса, по которым приложение регистрирует пользователя, выполняет вход, обновляет сессию и выходит из неё.
 * 
 * Принимает запрос, проверяет переданные данные, вызывает нужный метод AuthService и отправляет ответ клиенту
 */

export function authRoutes(services: Services) {
  const router = Router();
  router.post("/register", limit(10), async function (req, res) {
    const input = validate.registration(req.body);
    res.status(201).json(await services.auth.register(input));
  });
  router.post("/login", limit(10), async function (req, res) {
    const input = validate.login(req.body);
    res.status(201).json(await services.auth.login(input));
  });
  router.post("/refresh", limit(), async function (req, res) {
    const input = validate.refresh(req.body);
    res.status(201).json(await services.auth.refresh(input.refreshToken));
  });
  router.post("/logout", limit(), async function (req, res) {
    const input = validate.refresh(req.body);
    res.status(201).json(await services.auth.logout(input.refreshToken));
  });
  return router;
}
