import { Router } from "express";
import { Services } from "../services";
import { requireAuth, userId } from "./auth";
import { limit } from "./rate-limit";
import { BadRequestError } from "./errors";
import * as validate from "./validation";

export function restaurantsRoutes(services: Services) {
  const router = Router();
  const authenticate = requireAuth(services.auth);
  router.get("/filters", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.filters());
  });
  router.get("/discovery", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.discover(userId(req), validate.filters(req.query)));
  });
  router.get("/", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.list(userId(req)));
  });
  router.get("/:id/details", limit(), authenticate, async function (req, res) {
    res.json(await services.restaurants.details(validate.uuid(req.params.id)));
  });
  router.get("/search", limit(6), authenticate, async function (req, res) {
    const query = validate.queryText(req.query.q, "рестораны");
    if (query.length > 200) throw new BadRequestError("Некорректные параметры поиска");
    res.json(await services.restaurants.search(userId(req), query));
  });
  return router;
}
