import { Router } from "express";
import { MapTiles } from "../infrastructure/map-tiles";
import { mapHtml } from "./map-html";
import { NotFoundError } from "./errors";
import { limit } from "./rate-limit";
import { queryText } from "./validation";

export function mapRoutes(tiles: MapTiles) {
  const router = Router();
  router.get("/map-tiles/:z/:x/:y.png", limit(600), async function (req, res) {
    const body = await tiles.get(queryText(req.params.z), queryText(req.params.x), queryText(req.params.y));
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type("png").send(body);
  });
  router.get("/map", limit(), function (req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline'; frame-ancestors *");
    res.send(mapHtml());
  });
  router.get("/map-assets/:file", limit(), function (req, res, next) {
    const assets: Record<string, string> = {
      "leaflet.js": "leaflet/dist/leaflet.js", "leaflet.css": "leaflet/dist/leaflet.css",
    };
    const file = queryText(req.params.file);
    if (!Object.hasOwn(assets, file)) throw new NotFoundError("Файл карты не найден");
    res.sendFile(require.resolve(assets[file]), { maxAge: "7d" }, function (error) {
      if (error) next(error);
    });
  });
  router.get("/health", limit(), function (req, res) {
    res.json({ status: "ok" });
  });
  return router;
}
