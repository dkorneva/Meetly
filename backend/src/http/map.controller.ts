import { mapHtml } from "./map-html";
import { Controller, Get, Res, Param, NotFoundException } from "@nestjs/common";
import type { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { MapTiles } from "../infrastructure/map-tiles";
/**
 * Выдаёт встроенную карту, ресурсы Leaflet, тайлы и маршрут проверки работоспособности.
 */
@Controller()
export class MapController {
  constructor(private readonly tiles: MapTiles) {}
  /**
   * Возвращает проверенный PNG-тайл с заголовком браузерного кеширования.
   * @param z Масштаб карты.
   * @param x Горизонтальный номер тайла.
   * @param y Вертикальный номер тайла.
   */
  @Get("map-tiles/:z/:x/:y.png")
  @Throttle({ default: { limit: 600, ttl: 60000 } })
  async tile(@Param("z") z: string, @Param("x") x: string, @Param("y") y: string, @Res() res: Response) {
    const body = await this.tiles.get(z, x, y);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type("png").send(body);
  }
  /**
   * Возвращает страницу Leaflet с запретом кеширования и политикой встраивания.
   */
  @Get("map") map(@Res() res: Response) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' https: data: blob: 'unsafe-inline'; frame-ancestors *",
    );
    res.send(mapHtml());
  }
  /**
   * Выдаёт только разрешённые JS/CSS-ресурсы Leaflet; произвольный путь не принимается.
   * @param file Файл загрузки либо имя ресурса карты.
   */
  @Get("map-assets/:file") mapAsset(@Param("file") file:string, @Res() res:Response) {
    const assets:Record<string,string>={
      "leaflet.js":"leaflet/dist/leaflet.js", "leaflet.css":"leaflet/dist/leaflet.css",
    };
    if(!Object.hasOwn(assets,file))throw new NotFoundException("Файл карты не найден");
    res.sendFile(require.resolve(assets[file]),{maxAge:"7d"});
  }
  /**
   * Возвращает признак работоспособности HTTP-сервера.
   */
  @Get("health") health() {
    return { status: "ok" };
  }
}
