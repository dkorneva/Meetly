import { NotFoundError } from "../http/errors";
import { Prisma } from "@prisma/client";
import OpeningHours from "opening_hours";
import { Database } from "../infrastructure/database";
import { cuisineLabel, cuisineCodes, cuisineName } from "../domain/places";

/**
 * Получает заведения из бд: весь список, результаты поиска или одну карточку
 * Также готовит варианты фильтров: кухни, цены и форматы встречи
 */
export class RestaurantsService {
  // Переданный объект базы сохраняется в this.db и используется в методах
  /** Сохраняет подключение к БД для чтения каталога ресторанов. */
  constructor(private readonly db: Database) {}

  /**
   * Подготавливает найденное заведение: убирает исходные теги,
   * добавляет русскую подпись кухни, состояние работы и ссылку на источник
   * @param r Заведение, которое уже получили из базы.
   * @returns Данные заведения с дополнительными полями для отображения
   */
  // T сохраняет тип переданного объекта. extends требует перечисленных полей
  // другие поля, например название, адрес и цена, у объекта тоже могут быть
  private view<T extends {
    sourceId: string;
    cuisine: string;
    openingHours: string;
    rawTags: string | null;
  }>(r: T) {
    // true — открыто, false — закрыто, null — определить не удалось.
    let openNow: boolean | null = null;
    try {
      const h = new OpeningHours(r.openingHours);
      // Если расписание даёт неопределённый ответ, оставить null
      openNow = h.getUnknown() ? null : h.getState();
    } catch {
      // При ошибке в расписании всё равно показывать заведение
    }
    // Отделяем rawTags в неиспользуемую переменную _raw
    // В data попадут остальные поля: исходные теги клиенту не отправляются
    const { rawTags: _raw, ...data } = r;
    return {
      ...data,
      available: true,
      openNow,
      cuisineLabel: cuisineLabel(r.cuisine),
      // slice(4) убирает префикс "osm:": из "osm:node/123" получаем "node/123"
      dataSourceUrl: r.sourceId.startsWith("osm:")
        ? `https://www.openstreetmap.org/${r.sourceId.slice(4)}`
        : null,
    };
  }

  /**
   * Получает список заведений по алфавиту и подготавливает каждое через view
   * @param _userId ID пользователя
   * @returns Массив заведений для отображения в приложении
   */
  async list(_userId: string) {
    return (await this.db.restaurant.findMany({
      orderBy: {name: "asc"}, // asc — по возрастанию названия
    })).map(r => this.view(r));
  }

  /**
   * Собирает данные для элементов выбора кухни, бюджета и формата встречи
   * @returns Названия кухонь, настройки выбора бюджета и список форматов
   */
  async filters() {
    // select указывает нужные поля: только цену и коды связанных кухонь
    const rows = await this.db.restaurant.findMany({
      select: {price: true, cuisines: {select: {code: true}}},
    });
    // Цены всех заведений без повторов, сортировка от меньшего к большему
    const prices = [...new Set(
      rows.map(r => r.price),
    )].sort((a, b) => a - b);
    return {
      // Кухни всех заведений без повторов
      cuisines: [...new Set(
        rows.flatMap(r => r.cuisines.map(c => cuisineName(c.code))),
      )].sort((a, b) => a.localeCompare(b, "ru")),
      budget: {
        min: 500,
        // at(-1) — последняя, наибольшая цена. ?? 5000 — запасное значение, если цен нет
        // ceil(... / 100) * 100 округляет вверх до сотни, например 5230 → 5300
        // Math.max оставляет верхнюю границу не меньше 5000
        max: Math.max(5000, Math.ceil((prices.at(-1) ?? 5000) / 100) * 100),
        step: 100,
        prices,
      },
      formats: ["В помещении", "На улице", "Не важно"],
    };
  }

  /**
   * Выбирает заведения по бюджету, кухне и поисковому тексту
   * Если включён openNow, дополнительно оставляет только открытые сейчас
   * @param _userId ID пользователя
   * @param filters Фильтры
   * @returns Заведения и поле предупреждения
   */
  async filterCatalog(_userId: string, filters: {
    cuisine?: string;
    cuisines?: string[];
    q?: string;
    budget?: number;
    openNow?: boolean;
  } = {}) {
    // Собираем условия запроса
    // Пустой объект означает отсутствие фильтров
    const where: Prisma.RestaurantWhereInput = {};
    // lte — «меньше или равно».
    if (filters.budget) where.price = {lte: filters.budget};
    // Собираем одиночный выбор cuisine и список cuisines в общий массив
    // ?? [] подставляет пустой массив, если список не передали
    const selected = [
      ...(filters.cuisines ?? []),
      ...(filters.cuisine ? [filters.cuisine] : []),
    ];
    if (selected.length) {
      // cuisineCodes превращает название в коды
      // flatMap объединяет списки кодов, Set убирает повторы
      // some + in: у заведения должна быть хотя бы одна кухня из полученного списка.
      where.cuisines = {some: {code: {in: [...new Set(selected.flatMap(cuisineCodes))]}}};
    }
    // ?. вызывает trim только при наличии строки
    if (filters.q?.trim()) {
      // OR — «или»: достаточно совпадения в названии, адресе или строке кодов кухонь
      // [key] подставляет имя поля из массива, contains ищет вхождение текста
      where.OR = ["name", "address", "cuisine"].map(key => ({
        [key]: {contains: filters.q!.trim()},
      }));
    }
    const rows = await this.db.restaurant.findMany({where, orderBy: {name: "asc"}});
    // view вычисляет openNow, если «Открыто сейчас» включено, filter оставляет
    // только true
    // Если фильтр не включён, !filters.openNow даёт true и оставляет все записи
    const items = rows.map(r => this.view(r)).filter(r => (!filters.openNow || r.openNow === true));
    return {items, warning: undefined as string | undefined};
  }

  /**
   * Ищет заведения по тексту с помощью filterCatalog
   * @param userId ID пользователя, который передаётся в filterCatalog
   * @param text Поисковый текст. Значение «рестораны» означает поиск без ограничения
   * @returns Только массив найденных заведений, без остальных полей filterCatalog
   */
  async search(userId: string, text: string) {
    return (await this.filterCatalog(userId, {q: text === "рестораны" ? "" : text})).items;
  }

  /**
   * Получает каталог по фильтрам и добавляет сведения, нужные экрану карты
   * @param userId ID пользователя, который передаётся в filterCatalog
   * @param filters Те же ограничения, которые принимает filterCatalog
   * @returns Результат фильтрации, центр карты, обозначение источника и число заведений
   */
  async discover(userId: string, filters: {
    cuisine?: string;
    cuisines?: string[];
    q?: string;
    budget?: number;
    openNow?: boolean;
  } = {}) {
    const center = {latitude: 55.7558, longitude: 37.6176};
    const result = await this.filterCatalog(userId, filters);
    // ...result копирует поля результата. total — число уже отобранных заведений
    return {...result, center, source: "osm-database", total: result.items.length};
  }

  /**
   * Получает одну карточку заведения по ID.
   * @param id ID заведения
   * @returns Заведение, подготовленное методом view
   * @throws NotFoundError, если записи с таким ID нет (HTTP-ошибка 404)
   */
  async details(id: string) {
    const r = await this.db.restaurant.findUnique({where: {id}});
    if (!r) throw new NotFoundError("Заведение не найдено");
    return this.view(r);
  }
}
