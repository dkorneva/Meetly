import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import OpeningHours from "opening_hours";
import { Database } from "../infrastructure/database";
import { RestaurantInput } from "./inputs";
import { cuisineLabel, cuisineCodes, cuisineName } from "../domain/places";
export const CATALOG_WHERE = { catalogArea: "garden-ring", catalogActive: true };
/**
 * Проверяет, что запись относится к активному каталогу Садового кольца.
 */
export const catalogAvailable = (r: { catalogArea: string | null; catalogActive: boolean }) => r.catalogArea === "garden-ring" && r.catalogActive;
/**
 * Предоставляет активный локальный каталог, его фильтры и сведения о заведениях.
 */
@Injectable()
export class RestaurantsService {
  constructor(private readonly db: Database) {}
  /**
   * Скрывает исходные теги, вычисляет состояние работы и переводит коды кухонь в подписи.
   * @param r Результат операции.
   */
  private view<T extends { sourceId: string; cuisine: string; openingHours: string; rawTags: string | null; catalogArea: string | null; catalogActive: boolean }>(r: T) {
    let openNow: boolean | null = null;
    try { if (r.openingHours) { const h = new OpeningHours(r.openingHours); openNow = h.getUnknown() ? null : h.getState(); } } catch {}
    const { rawTags: _raw, ...data } = r;
    return { ...data, available: catalogAvailable(r), openNow, cuisineLabel: cuisineLabel(r.cuisine),
      dataSourceUrl: r.sourceId.startsWith("osm:") ? `https://www.openstreetmap.org/${r.sourceId.slice(4)}` : null };
  }
  /**
   * Возвращает активные заведения, при необходимости ограниченные указанным городом.
   * @param city Город для ограничения каталога.
   */
  async list(_userId: string, city?: string) {
    return (await this.db.restaurant.findMany({ where: { ...CATALOG_WHERE, ...(city ? {city} : {}) }, orderBy: {name:"asc"} })).map(r=>this.view(r));
  }
  /**
   * Строит варианты кухонь и среднего чека по активным записям БД; диапазон бюджета покрывает весь каталог.
   * @returns Кухни, известные чеки и диапазон бюджета актуального каталога.
   */
  async filters() {
    const rows = await this.db.restaurant.findMany({where: CATALOG_WHERE, select: {price:true, cuisines:{select:{code:true}}}});
    const prices = [...new Set(rows.flatMap(r => r.price === null ? [] : [r.price]))].sort((a,b) => a-b);
    return {
      cuisines: [...new Set(rows.flatMap(r => r.cuisines.map(c => cuisineName(c.code))))].sort((a,b) => a.localeCompare(b, "ru")),
      budget: {min:500, max:Math.max(5000, Math.ceil((prices.at(-1) ?? 5000)/100)*100), step:100, prices},
      formats: ["В помещении", "На улице", "Не важно"],
    };
  }
  /**
   * Сохраняет пользовательскую запись заведения с указанием создавшего аккаунта.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param input Данные операции после проверки HTTP-слоем.
   */
  create(userId: string, input: RestaurantInput) { return this.db.restaurant.create({data:{...input,createdBy:userId}}); }
  /**
   * Применяет SQL-фильтры и условие открытости; несколько кухонь объединяются по правилу «хотя бы одна».
   * @param filters Необязательные ограничения каталога.
   */
  async filterCatalog(_userId: string, filters: {cuisine?:string;cuisines?:string[];q?:string;budget?:number;openNow?:boolean} = {}) {
    const where: Prisma.RestaurantWhereInput = {...CATALOG_WHERE};
    if(filters.budget) where.price = {lte:filters.budget};
    const selected = [...(filters.cuisines ?? []), ...(filters.cuisine ? [filters.cuisine] : [])];
    if(selected.length) where.cuisines = {some:{code:{in:[...new Set(selected.flatMap(cuisineCodes))]}}};
    if(filters.q?.trim()) where.OR = ["name","address","cuisine"].map(key=>({[key]:{contains:filters.q!.trim()}}));
    const rows=await this.db.restaurant.findMany({where,orderBy:{name:"asc"}});
    const items=rows.map(r=>this.view(r)).filter(r=>(!filters.openNow||r.openNow===true));
    const unknownPriceCount=await this.db.restaurant.count({where:{...where,price:null}});
    return {items,warning:undefined as string|undefined,unknownPriceCount};
  }
  /**
   * Выполняет текстовый поиск по локальному каталогу.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param text Строка текстового поиска.
   */
  async search(userId:string,text:string) {
    return (await this.filterCatalog(userId,{q:text==="рестораны"?"":text})).items;
  }
  /**
   * Возвращает отфильтрованный каталог, число результатов и центр отображения карты.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param filters Необязательные ограничения каталога.
   */
  async discover(userId:string, filters:{cuisine?:string;cuisines?:string[];q?:string;budget?:number;openNow?:boolean}={}) {
    const center={latitude:55.7558,longitude:37.6176};
    const result=await this.filterCatalog(userId,filters);
    return {...result,center,source:"osm-database",total:result.items.length};
  }
  /**
   * Возвращает сведения существующего заведения либо ошибку отсутствия записи.
   * @param id ID запрашиваемой записи.
   */
  async details(id:string) {
    const r=await this.db.restaurant.findUnique({where:{id}});
    if(!r)throw new NotFoundException("Заведение не найдено");
    return this.view(r);
  }
}
