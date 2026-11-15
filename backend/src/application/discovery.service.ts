
import { Database } from "../infrastructure/database";
import { MeetingsService } from "./meetings.service";
import { RestaurantsService } from "./restaurants.service";
import { MOSCOW_CENTER, matchesCuisine } from "../domain/places";
import { recommendationScore } from "../domain/recommendations";
export interface PlaceFilters {
  q?: string;
  budget?: number;
  cuisine?: string;
  cuisines?: string[];
  openNow?: boolean;
}
/**
 * Подбирает заведения из БД по предпочтениям участников
 */
export class DiscoveryService {
  constructor(
    private readonly db: Database,
    private readonly meetings: MeetingsService,
    private readonly restaurants: RestaurantsService,
  ) {}
  /**
   * Фильтрует и ранжирует каталог, учитывает кухни, бюджет, расписание и формат встречи
   * @param userId ID текущего аутентифицированного пользователя
   * @param id ID запрашиваемой записи
   * @param filters Необязательные ограничения каталога
   */
  async list(userId: string, id: string, filters: PlaceFilters = {}) {
    const meeting = await this.meetings.member(userId, id);
    const center = MOSCOW_CENTER;
    const members = await this.db.member.findMany({ where: { meetingId: id } });
    const preferences = members.map((m) => ({
      budget: m.budget,
      cuisines: JSON.parse(m.cuisines) as string[],
    }));
    const result = await this.restaurants.filterCatalog(
      userId,
      filters,
    );
    const query = (filters.q ?? "").trim().toLowerCase();
    const excluded = new Set((await this.db.candidate.findMany({ where: { meetingId: id, origin: "excluded" }, select: { restaurantId: true } })).map(c => c.restaurantId));
    const evaluated = result.items.map((r) => {
      const matched = preferences.filter(
        (p) =>
          !p.cuisines.length ||
          p.cuisines.some((c) => matchesCuisine(r.cuisine, c)),
      ).length;
      return {
        ...r,
        score: recommendationScore(r, preferences, meeting.format),
        matchedParticipants: matched,
        totalParticipants: preferences.length,
        matchLabel:
          matched === preferences.length
            ? "По вашим предпочтениям"
            : matched
              ? "Компромисс"
              : "Другой вариант",
      };
    });
    const items = evaluated
      .filter(
        (r) =>
          r.score >= 0 &&
          !excluded.has(r.id) &&
          (!(filters.cuisines?.length || filters.cuisine) || [...(filters.cuisines ?? []), ...(filters.cuisine ? [filters.cuisine] : [])].some(c => matchesCuisine(r.cuisine, c))) &&
          (!filters.budget ||
            r.price <= filters.budget) &&
          (!filters.openNow || r.openNow === true) &&
          (!query ||
            `${r.name} ${r.cuisine} ${r.cuisineLabel} ${r.address}`
              .toLowerCase()
              .includes(query)),
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.id.localeCompare(b.id),
      );
    return {
      items,
      center,
      warning: result.warning,
      source: "osm-database",
      total: items.length,
    };
  }
  /** Обновляем автоматические варианты, сохраняя ручной выбор и все голоса */
  async apply(userId: string, id: string, filters: PlaceFilters = {}) {
    const result = await this.list(userId, id, filters);
    const top = result.items.slice(0, 3).map((r) => r.id);
    const changed = await this.db.atomic(async (tx) => {
      const m = await this.meetings.member(userId, id, tx);
      if (m.status !== "voting") return false;
      const existing = await tx.candidate.findMany({
        where: { meetingId: id },
        include: { votes: true },
      });
      const removable = existing
        .filter(
          (c) =>
            c.origin === "auto" &&
            !top.includes(c.restaurantId) &&
            !c.votes.length,
        )
        .map((c) => c.restaurantId);
      if (removable.length)
        await tx.candidate.deleteMany({
          where: { meetingId: id, restaurantId: { in: removable } },
        });
      let added = false;
      for (const restaurantId of top)
        if (!existing.some((c) => c.restaurantId === restaurantId)) {
          await tx.candidate.create({
            data: { meetingId: id, restaurantId, origin: "auto" },
          });
          added = true;
        }
      return added || removable.length > 0;
    });
    return { ...result, changed };
  }
}
