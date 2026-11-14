import { NotFoundError, ServiceUnavailableError } from "../http/errors";

/** Geoapify hosts OSM tiles independently of the public OSM volunteer servers. */
export class MapTiles {
  private readonly cache = new Map<string, { body: Buffer; expires: number }>();
  private readonly pending = new Map<string, Promise<Buffer>>();
  private gate: Promise<void> = Promise.resolve();

  /**
   * Проверяет координаты тайла, использует кеш и объединяет одновременные запросы одного изображения.
   * @param z Масштаб карты.
   * @param x Горизонтальный номер тайла.
   * @param y Вертикальный номер тайла.
   */
  async get(z: string, x: string, y: string): Promise<Buffer> {
    if (![z, x, y].every(v => /^\d{1,6}$/.test(v)) || Number(z) > 19 ||
      Number(x) >= 2 ** Number(z) || Number(y) >= 2 ** Number(z))
      throw new NotFoundError("Тайл не найден");
    const key = `${z}/${x}/${y}`;
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.body;
    const running = this.pending.get(key);
    if (running) return running;
    if (!process.env.GEOAPIFY_API_KEY || this.pending.size >= 128)
      throw new ServiceUnavailableError("Фон карты временно недоступен");
    const task = this.load(key);
    this.pending.set(key, task);
    try { return await task; } finally { this.pending.delete(key); }
  }

  /**
   * Соблюдает ограничение частоты Geoapify, проверяет PNG и кеширует успешный ответ на один час.
   * @param key Ключ тайла z/x/y.
   */
  private async load(key: string): Promise<Buffer> {
    // No more than four upstream requests per second, including concurrent clients.
    const turn = this.gate;
    this.gate = turn.then(() => new Promise<void>(resolve => setTimeout(resolve, 250)));
    await turn;
    try {
      const response = await fetch(`https://maps.geoapify.com/v1/tile/positron/${key}.png?apiKey=${encodeURIComponent(process.env.GEOAPIFY_API_KEY!)}`,
        { signal: AbortSignal.timeout(10000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/png"))
        throw new Error("Tile unavailable");
      const body = Buffer.from(await response.arrayBuffer());
      if (!body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        throw new Error("Invalid tile");
      this.cache.delete(key);
      if (this.cache.size >= 256) this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, { body, expires: Date.now() + 3600000 });
      return body;
    } catch {
      // Never return upstream credentials, error bodies or a fake tile to the client.
      throw new ServiceUnavailableError("Фон карты временно недоступен");
    }
  }
}
