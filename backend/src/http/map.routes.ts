import { Router } from "express";
import { MapTiles } from "../infrastructure/map-tiles";
import { mapHtml } from "./map-html";
import { NotFoundError } from "./errors";
import { limit } from "./rate-limit";
import { queryText } from "./validation";

export function mapRoutes(tiles: MapTiles) {
  const router = Router();
  // получение картинки подложки
  router.get("/map-tiles/:z/:x/:y.png", limit(600), async function (req, res) {
    const body = await tiles.get(queryText(req.params.z), queryText(req.params.x), queryText(req.params.y));
    res.setHeader("Cache-Control", "public, max-age=3600"); // разрешение кешировать картинку
    res.type("png").send(body); // отправка картинки клиенту
  });

  // получение HTML страницы карты
  router.get("/map", limit(), function (req, res) {
    res.setHeader("Cache-Control", "no-store"); // запрет кеширования HTML страницы
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline'; frame-ancestors *"); // политика безопасности контента
    res.send(mapHtml()); // отправка HTML страницы карты клиенту
  });
  // выдача файлов Leaflet
  router.get("/map-assets/:file", limit(), function (req, res, next) {
    const assets: Record<string, string> = { // список доступных файлов Leaflet
      "leaflet.js": "leaflet/dist/leaflet.js", "leaflet.css": "leaflet/dist/leaflet.css",
    };
    const file = queryText(req.params.file); // проверка имени файла 
    if (!Object.hasOwn(assets, file)) throw new NotFoundError("Файл карты не найден");
    res.sendFile(require.resolve(assets[file]), { maxAge: "7d" }, // получение пути к файлу библиотеки, отправка файла, срок кеширования 7 дней 
    function (error) { 
      if (error) next(error);
    });
  });
  router.get("/health", limit(), function (req, res) {
    res.json({ status: "ok" });
  });
  return router;
}
