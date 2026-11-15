import { NotFoundError, ServiceUnavailableError } from "../http/errors";

/** Размещение тайлов OSM через Geoapify независимо от публичных серверов OSM */
export class MapTiles {
  private readonly cache = new Map<string, { body: Buffer; expires: number }>();
  private readonly pending = new Map<string, Promise<Buffer>>(); // хранение тайлов, которые ещё загружаются
  private gate: Promise<void> = Promise.resolve(); // ограничение частоты запросов к Geoapify

  /**
   * Проверяет координаты тайла, использует кеш и объединяет одновременные запросы одного изображения
   * @param z Масштаб карты 
   * @param x Горизонтальный номер тайла
   * @param y Вертикальный номер тайла
   */
  async get(z: string, x: string, y: string): Promise<Buffer> {
    // Проверяет, что значение состоит только из цифр, причём их от одной до шести
    // Запрещает уровни приближения больше 19
    // Не выходит ли номер картинки за границы карты на выбранном масштабе
    if (![z, x, y].every(v => /^\d{1,6}$/.test(v)) || Number(z) > 19 ||
      Number(x) >= 2 ** Number(z) || Number(y) >= 2 ** Number(z))
      throw new NotFoundError("Тайл не найден");
    const key = `${z}/${x}/${y}`; // ключ тайла в формате z/x/y
    const cached = this.cache.get(key); // получение тайла из кеша
    if (cached && cached.expires > Date.now()) return cached.body; // возврат тайла из кеша, если срок действия не истёк
    const running = this.pending.get(key); // получение тайла, который ещё загружается
    if (running) return running; // возврат тайла, если он уже загружается
    if (!process.env.GEOAPIFY_API_KEY || this.pending.size >= 128) // проверка наличия API-ключа и ограничения на 128 одновременных загрузок
      throw new ServiceUnavailableError("Фон карты временно недоступен");
    const task = this.load(key); // загрузка тайла
    this.pending.set(key, task); // добавление тайла в список загружаемых
    try { return await task; } finally { this.pending.delete(key); } // ожидание загрузки и удаление тайла из списка загружаемых
  }

  /**
   * Соблюдает ограничение частоты Geoapify, проверяет PNG и кеширует успешный ответ на один час
   * @param key Ключ тайла z/x/y.
   */
  private async load(key: string): Promise<Buffer> {
    // Не более четырёх запросов к внешнему сервису в секунду, включая одновременных клиентов
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
      // Никогда не возвращать клиенту учётные данные внешнего сервиса, тела ошибок
      throw new ServiceUnavailableError("Фон карты временно недоступен");
    }
  }
}
