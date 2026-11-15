import { BadRequestError } from "../http/errors";
import { Database } from "../infrastructure/database";
import { MeetingsService } from "./meetings.service";
import { calendarEvent } from "../domain/calendar";
/**
 * Экспортирует доступную пользователю встречу в календарный файл ICS
 */
export class CalendarService {
  constructor(
    private readonly db: Database,
    private readonly meetings: MeetingsService,
  ) {}
  /**
   * Проверяет участие и настройку экспорта, подставляет адрес выбранного заведения и формирует ICS
   * @param userId ID текущего аутентифицированного пользователя
   * @param id ID запрашиваемой записи
   */
  async export(userId: string, id: string) {
    const meeting = await this.meetings.member(userId, id);
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.calendar)
      throw new BadRequestError("Включите экспорт календаря в профиле");
    const restaurant = meeting.restaurantId
      ? await this.db.restaurant.findUnique({
          where: { id: meeting.restaurantId },
        })
      : null;
    return calendarEvent(
      meeting,
      restaurant
        ? `${restaurant.name}, ${restaurant.address}`
        : meeting.city,
    );
  }
}
