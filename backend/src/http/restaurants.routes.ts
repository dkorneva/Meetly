import { Router } from "express";
import { Services } from "../services";
import { requireAuth, userId } from "./auth";
import { limit } from "./rate-limit";
import { BadRequestError } from "./errors";
import * as validate from "./validation";

/** Создаёт маршруты чтения каталога ресторанов и доступных вариантов фильтров. */
export function restaurantsRoutes(services: Services) {
  const router = Router();
  // получение доступных вариантов фильтров (допустимые список кухонь, границы бюджета и др.)
  const authenticate = requireAuth(services.auth);
  router.get("/filters", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.filters());
  });
  // возвращает отфильтрованный каталог ресторанов, число результатов и центр отображения карты
  router.get("/discovery", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.discover(userId(req), validate.filters(req.query)));
  });
  // получение полного списка ресторанов
  router.get("/", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.list(userId(req)));
  });

  // получение подробной информации о конкретном ресторане по id
  router.get("/:id/details", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.details(validate.uuid(req.params.id)));
  });
  // поиск ресторанов по названию
  router.get("/search", limit(6), authenticate, async function (req, res) {
    const query = validate.queryText(req.query.q, "рестораны"); // проверяется текст, полученный из параметра q, если его нет, используется строка "рестораны"
    if (query.length > 200) throw new BadRequestError("Некорректные параметры поиска");
    res.json(await services.restaurants.search(userId(req), query));
  });
  return router;
}
