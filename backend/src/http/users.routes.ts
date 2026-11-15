import { Router } from "express";
import { Services } from "../services";
import { requireAuth, userId } from "./auth";
import { limit } from "./rate-limit";
import * as validate from "./validation";

export function usersRoutes(services: Services) {
  const router = Router();
  const authenticate = requireAuth(services.auth);
  // получение информации о текущем пользователе
  router.get("/me", limit(), authenticate, async function (req, res) {
    res.json(await services.users.me(userId(req)));
  });
  // обновление информации о текущем пользователе
  router.patch("/me", limit(), authenticate, async function (req, res) {
    const input = validate.profile(req.body);
    res.json(await services.users.update(userId(req), input));
  });
  return router;
}
