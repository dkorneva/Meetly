import { NotFoundError } from "../http/errors";
import { Prisma } from "@prisma/client";
import OpeningHours from "opening_hours";
import { Database } from "../infrastructure/database";
import { cuisineLabel, cuisineCodes, cuisineName } from "../domain/places";

/**
 * Получает заведения из нашей базы: весь список, результаты поиска или одну карточку.
 * Также готовит варианты фильтров: кухни, цены и форматы встречи.
 * Во внешние сервисы за ресторанами этот класс не обращается.
 */
export class RestaurantsService {
  // Переданный объект базы сохраняется в this.db и используется в методах ниже.
  constructor(private readonly db: Database) {}

  /**
   * Подготавливает найденное заведение для приложения: убирает исходные теги,
   * добавляет русскую подпись кухни, состояние работы и ссылку на источник.
   * Саму запись в базе не изменяет.
   * @param r Заведение, которое уже получили из базы.
   * @returns Данные заведения с дополнительными полями для отображения.
   */
  // T сохраняет тип переданного объекта. extends требует перечисленных полей;
  // другие поля, например название, адрес и цена, у объекта тоже могут быть.
  private view<T extends {
    sourceId: string;
    cuisine: string;
    openingHours: string;
    rawTags: string | null;
  }>(r: T) {
    // true — открыто, false — закрыто, null — определить не удалось.
    let openNow: boolean | null = null;
    try {
      if (r.openingHours) {
        const h = new OpeningHours(r.openingHours);
        // Если расписание даёт неопределённый ответ, оставляем null.
        openNow = h.getUnknown() ? null : h.getState();
      }
    } catch {
      // При ошибке в расписании всё равно показываем заведение; openNow остаётся null.
    }
    // Отделяем rawTags в неиспользуемую переменную _raw.
    // В data попадут остальные поля: исходные теги клиенту не отправляем.
    const { rawTags: _raw, ...data } = r;
    return {
      ...data,
      // Поле оставлено для фронтенда: все заведения базы доступны для выбора.
      // Проверки активности или принадлежности Садовому кольцу здесь нет.
      available: true,
      openNow,
      cuisineLabel: cuisineLabel(r.cuisine),
      // slice(4) убирает префикс "osm:": из "osm:node/123" получаем "node/123".
      // Для других источников ссылки здесь нет.
      dataSourceUrl: r.sourceId.startsWith("osm:")
        ? `https://www.openstreetmap.org/${r.sourceId.slice(4)}`
        : null,
    };
  }

  /**
   * Получает список заведений по алфавиту и подготавливает каждое через view.
   * @param _userId ID пользователя. Здесь не используется: каталог общий для всех.
   * @returns Массив заведений для отображения в приложении.
   */
  async list(_userId: string) {
    return (await this.db.restaurant.findMany({
      orderBy: {name: "asc"}, // asc — по возрастанию названия.
    })).map(r => this.view(r));
  }

  /**
   * Собирает данные для элементов выбора кухни, бюджета и формата встречи.
   * Кухни и цены берёт из базы, а названия форматов заданы в коде.
   * @returns Названия кухонь, настройки выбора бюджета и список форматов.
   */
  async filters() {
    // select указывает нужные поля: только цену и коды связанных кухонь.
    const rows = await this.db.restaurant.findMany({
      select: {price: true, cuisines: {select: {code: true}}},
    });
    // flatMap собирает цены: [] пропускает неизвестную, [r.price] добавляет известную.
    // Set убирает повторы, [...Set] превращает коллекцию обратно в массив.
    // sort с a - b располагает числа от меньшего к большему.
    const prices = [...new Set(
      rows.flatMap(r => r.price === null ? [] : [r.price]),
    )].sort((a, b) => a - b);
    return {
      // Собираем кухни всех заведений, переводим коды на русский, убираем повторы.
      // localeCompare с "ru" сортирует названия с учётом русского языка.
      cuisines: [...new Set(
        rows.flatMap(r => r.cuisines.map(c => cuisineName(c.code))),
      )].sort((a, b) => a.localeCompare(b, "ru")),
      budget: {
        min: 500,
        // at(-1) — последняя, наибольшая цена. ?? 5000 — запасное значение, если цен нет.
        // ceil(... / 100) * 100 округляет вверх до сотни, например 5230 → 5300.
        // Math.max оставляет верхнюю границу не меньше 5000.
        max: Math.max(5000, Math.ceil((prices.at(-1) ?? 5000) / 100) * 100),
        step: 100,
        prices,
      },
      formats: ["В помещении", "На улице", "Не важно"],
    };
  }

  /**
   * Выбирает заведения по бюджету, кухне и поисковому тексту.
   * Если включён openNow, дополнительно оставляет только открытые сейчас.
   * @param _userId ID пользователя. Здесь не используется: каталог общий для всех.
   * @param filters Необязательные ограничения. Без них получим весь каталог.
   * @returns Заведения, поле предупреждения и количество записей с неизвестной ценой.
   */
  async filterCatalog(_userId: string, filters: {
    cuisine?: string;
    cuisines?: string[];
    q?: string;
    budget?: number;
    openNow?: boolean;
  } = {}) {
    // Собираем условия запроса. Тип Prisma помогает проверить их правильность.
    // Пустой объект означает отсутствие ограничений.
    const where: Prisma.RestaurantWhereInput = {};
    // lte — «меньше или равно». Неизвестная цена null этому условию не подходит.
    if (filters.budget) where.price = {lte: filters.budget};
    // Собираем одиночный выбор cuisine и список cuisines в общий массив.
    // ?? [] подставляет пустой массив, если список не передали.
    const selected = [
      ...(filters.cuisines ?? []),
      ...(filters.cuisine ? [filters.cuisine] : []),
    ];
    if (selected.length) {
      // cuisineCodes превращает название в коды: «Японская» → japanese, sushi, ramen.
      // flatMap объединяет списки кодов, Set убирает повторы.
      // some + in: у заведения должна быть хотя бы одна кухня из полученного списка.
      where.cuisines = {some: {code: {in: [...new Set(selected.flatMap(cuisineCodes))]}}};
    }
    // ?. вызывает trim только при наличии строки; trim убирает пробелы по краям.
    if (filters.q?.trim()) {
      // OR — «или»: достаточно совпадения в названии, адресе или строке кодов кухонь.
      // [key] подставляет имя поля из массива. contains ищет вхождение текста.
      // q! сообщает TypeScript, что строка существует: это уже проверено выше.
      where.OR = ["name", "address", "cuisine"].map(key => ({
        [key]: {contains: filters.q!.trim()},
      }));
    }
    const rows = await this.db.restaurant.findMany({where, orderBy: {name: "asc"}});
    // view вычисляет openNow. Если «Открыто сейчас» включено, filter оставляет
    // только true. Закрытые заведения и записи с неизвестным расписанием исключаются.
    // Если фильтр не включён, !filters.openNow даёт true и оставляем все записи.
    const items = rows.map(r => this.view(r)).filter(r => (!filters.openNow || r.openNow === true));
    // Считаем записи без цены. price: null заменяет условие бюджета из ...where,
    // остальные условия сохраняются. openNow сюда не входит: его проверяли отдельно.
    const unknownPriceCount = await this.db.restaurant.count({where: {...where, price: null}});
    // Предупреждения сейчас нет. as задаёт тип TypeScript, но не меняет значение.
    return {items, warning: undefined as string | undefined, unknownPriceCount};
  }

  /**
   * Ищет заведения по тексту с помощью уже готового filterCatalog.
   * @param userId ID пользователя, который передаём в filterCatalog.
   * @param text Поисковый текст. Точное значение «рестораны» означает поиск без ограничения.
   * @returns Только массив найденных заведений, без остальных полей filterCatalog.
   */
  async search(userId: string, text: string) {
    return (await this.filterCatalog(userId, {q: text === "рестораны" ? "" : text})).items;
  }

  /**
   * Получает каталог по фильтрам и добавляет сведения, нужные экрану карты.
   * Персональные баллы рекомендаций этот метод не рассчитывает.
   * @param userId ID пользователя, который передаём в filterCatalog.
   * @param filters Те же ограничения, которые принимает filterCatalog.
   * @returns Результат фильтрации, центр карты, обозначение источника и число заведений.
   */
  async discover(userId: string, filters: {
    cuisine?: string;
    cuisines?: string[];
    q?: string;
    budget?: number;
    openNow?: boolean;
  } = {}) {
    // Фиксированная точка центра Москвы: широта и долгота.
    const center = {latitude: 55.7558, longitude: 37.6176};
    const result = await this.filterCatalog(userId, filters);
    // ...result копирует поля результата. total — число уже отобранных заведений.
    // source — подпись источника данных, а не запрос к OSM по сети.
    return {...result, center, source: "osm-database", total: result.items.length};
  }

  /**
   * Получает одну карточку заведения по ID.
   * @param id ID заведения в нашей базе.
   * @returns Заведение, подготовленное методом view для отправки в приложение.
   * @throws NotFoundError, если записи с таким ID нет (HTTP-ошибка 404).
   */
  async details(id: string) {
    const r = await this.db.restaurant.findUnique({where: {id}});
    if (!r) throw new NotFoundError("Заведение не найдено");
    return this.view(r);
  }
}
