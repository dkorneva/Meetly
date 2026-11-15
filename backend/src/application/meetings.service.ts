import { HIDDEN_BOOKING_NOTICE } from "../domain/chat";
import { BadRequestError, ForbiddenError, NotFoundError } from "../http/errors";
import { Prisma } from "@prisma/client";
import { Database } from "../infrastructure/database";
import {
  chooseWinner,
  meetingInstant,
  requireVoting,
} from "../domain/meeting-rules";
import { MeetingInput, PreferenceInput } from "./inputs";
import { randomBytes } from "node:crypto";
import { tokenHash } from "./auth.service";
import {
  cuisineLabel,
  matchesCuisine,

} from "../domain/places";
/**
 * Выполняет действия со встречами в транзакциях, проверяя участие, полномочия организатора и статус голосования.
 */
export class MeetingsService {
  constructor(private readonly db: Database) {}
  /**
   * Проверяет существование заведения.
   * @param id ID запрашиваемой записи.
   * @param tx Текущая транзакция Prisma для согласованной проверки и записи.
   */
  private async requireRestaurant(id: string, tx: Prisma.TransactionClient) {
    const r = await tx.restaurant.findUnique({ where: { id }, select: { id: true } });
    if (!r) throw new NotFoundError("Заведение не найдено");
  }
  /**
   * Проверяет членство пользователя во встрече и возвращает её запись.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param tx Текущая транзакция Prisma для согласованной проверки и записи.
   * @throws ForbiddenError для постороннего пользователя; NotFoundError для отсутствующей встречи.
   * @returns Запись встречи после проверки участия.
   */
  async member(
    userId: string,
    id: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    const member = await tx.member.findUnique({
      where: { meetingId_userId: { meetingId: id, userId } },
    });
    if (!member) throw new ForbiddenError("Вы не участник встречи");
    const meeting = await tx.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundError("Встреча не найдена");
    return meeting;
  }
  /**
   * Дополнительно проверяет полномочия организатора встречи.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param tx Текущая транзакция Prisma для согласованной проверки и записи.
   * @throws ForbiddenError для участника без прав организатора.
   * @returns Запись встречи после проверки полномочий организатора.
   */
  async owner(
    userId: string,
    id: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    const meeting = await this.member(userId, id, tx);
    if (meeting.ownerId !== userId)
      throw new ForbiddenError("Действие доступно организатору");
    return meeting;
  }
  /**
   * Возвращает встречи пользователя с участниками, вариантами, голосами и последним видимым сообщением.
   * @param userId ID текущего аутентифицированного пользователя.
   */
  async list(userId: string) {

    const meetings = await this.db.meeting.findMany({
      where: { members: { some: { userId } } },
      orderBy: { startsAt: "asc" },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        candidates: { where: { origin: { not: "excluded" } }, include: { restaurant: true, votes: true } },
        messages: { where: {NOT:{kind:"system",text:HIDDEN_BOOKING_NOTICE}}, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1,
          select: { text: true, kind: true, createdAt: true, senderId: true, sender: { select: { name: true } } } },
      },
    });
    return meetings.map((m) => {
      return {
        ...m,
        messages: undefined,
        lastMessage: m.messages[0] ? { text: m.messages[0].text, kind: m.messages[0].kind,
          createdAt: m.messages[0].createdAt, senderId: m.messages[0].senderId, name: m.messages[0].sender.name } : null,
        unavailableCandidateCount: 0,
        candidates: m.candidates.map((c) => {
          const matches = m.members.filter((p) => {
            const cuisines = JSON.parse(p.cuisines) as string[];
            return (
              !cuisines.length ||
              cuisines.some((x) => matchesCuisine(c.restaurant.cuisine, x))
            );
          }).length;
          return {
            ...c,
            restaurant: {
              ...c.restaurant,
              available: true, rawTags: undefined,
              cuisineLabel: cuisineLabel(c.restaurant.cuisine),
              matchLabel:
                matches === m.members.length
                  ? "По вашим предпочтениям"
                  : matches
                    ? "Компромисс"
                    : "Другой вариант",
            },
          };
        }),
      };
    });
  }
  /**
   * Создаёт будущую встречу, предпочтения организатора и системное сообщение в одной транзакции.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param input Данные операции после проверки HTTP-слоем.
   */
  async create(userId: string, input: MeetingInput) {
    const startsAt = meetingInstant(input.date, input.time);
    if (startsAt <= new Date())
      throw new BadRequestError("Встреча должна быть в будущем");
    return this.db.atomic(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          ownerId: userId,
          title: input.title.trim(),
          startsAt,
          city: input.city ?? "Москва",
          format: input.format,
          members: {
            create: {
              userId,
              budget: input.budget,
              cuisines: JSON.stringify(input.cuisines),
            },
          },
        },
      });
      await tx.message.create({
        data: {
          meetingId: meeting.id,
          senderId: userId,
          kind: "system",
          text: "Встреча создана",
        },
      });
      return meeting;
    });
  }
  /**
   * Меняет общие параметры встречи и предпочтения организатора, пока голосование открыто.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param input Данные операции после проверки HTTP-слоем.
   */
  async edit(userId: string, id: string, input: MeetingInput) {
    return this.db.atomic(async (tx) => {
      const meeting = await this.owner(userId, id, tx);
      requireVoting(meeting.status);
      const startsAt = meetingInstant(input.date, input.time);
      if (
        startsAt.getTime() !== meeting.startsAt.getTime() &&
        startsAt <= new Date()
      )
        throw new BadRequestError("Встреча должна быть в будущем");
      await tx.member.update({
        where: { meetingId_userId: { meetingId: id, userId } },
        data: {
          budget: input.budget,
          cuisines: JSON.stringify(input.cuisines),
        },
      });
      return tx.meeting.update({
        where: { id },
        data: {
          title: input.title.trim(),
          startsAt,
          city: input.city ?? meeting.city,
          format: input.format,
          version: { increment: 1 },
        },
      });
    });
  }
  /**
   * Обновляет только предпочтения текущего участника открытого голосования.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param input Данные операции после проверки HTTP-слоем.
   */
  async preferences(userId: string, id: string, input: PreferenceInput) {
    return this.db.atomic(async (tx) => {
      const m = await this.member(userId, id, tx);
      requireVoting(m.status);
      return tx.member.update({
        where: { meetingId_userId: { meetingId: id, userId } },
        data: {
          budget: input.budget,
          cuisines: JSON.stringify(input.cuisines),
        },
      });
    });
  }
  /**
   * Добавляет доступное заведение или возвращает исключённый вариант как ручной выбор участника.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param restaurantId ID заведения, участвующего в голосовании.
   */
  async propose(userId: string, id: string, restaurantId: string) {
    return this.db.atomic(async (tx) => {
      const m = await this.member(userId, id, tx);
      requireVoting(m.status);
      await this.requireRestaurant(restaurantId, tx);
      return tx.candidate.upsert({
        where: { meetingId_restaurantId: { meetingId: id, restaurantId } },
        create: { meetingId: id, restaurantId },
        update: { origin: "manual" },
      });
    });
  }
  /**
   * Создаёт или заменяет единственный голос участника за предложенный доступный вариант.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param restaurantId ID заведения, участвующего в голосовании.
   */
  async vote(userId: string, id: string, restaurantId: string) {
    return this.db.atomic(async (tx) => {
      const m = await this.member(userId, id, tx);
      requireVoting(m.status);
      await this.requireRestaurant(restaurantId, tx);
      if (
        !(await tx.candidate.findFirst({
          where: { meetingId: id, restaurantId, origin: { not: "excluded" } },
        }))
      )
        throw new BadRequestError("Сначала предложите заведение");
      return tx.vote.upsert({
        where: { meetingId_userId: { meetingId: id, userId } },
        create: { meetingId: id, userId, restaurantId },
        update: { restaurantId },
      });
    });
  }
  /**
   * Снимает вариант и его голоса; сохраняет исключение, чтобы автоподбор не восстановил его молча.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param restaurantId ID заведения, участвующего в голосовании.
   */
  async removeCandidate(userId: string, id: string, restaurantId: string) {
    return this.db.atomic(async (tx) => {
      const meeting = await this.owner(userId, id, tx);
      requireVoting(meeting.status);
      const candidate = await tx.candidate.findUnique({ where: { meetingId_restaurantId: { meetingId: id, restaurantId } } });
      if (!candidate) throw new NotFoundError("Вариант не найден");
      await tx.vote.deleteMany({ where: { meetingId: id, restaurantId } });
      // Keep an exclusion so automatic recommendations cannot silently restore it.
      await tx.candidate.update({ where: { meetingId_restaurantId: { meetingId: id, restaurantId } }, data: { origin: "excluded" } });
      return { ok: true };
    });
  }
  /**
   * Сохраняет в переписке название выбранного места и время встречи по Москве.
   * @param tx Текущая транзакция Prisma для согласованной проверки и записи.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param meeting Встреча, для которой выполняется действие.
   * @param restaurantId ID заведения, участвующего в голосовании.
   */
  private async selectionMessage(tx: Prisma.TransactionClient, userId: string, meeting: { id: string; startsAt: Date }, restaurantId: string) {
    const restaurant = await tx.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { name: true } });
    await tx.message.create({ data: { meetingId: meeting.id, senderId: userId, kind: "selected",
      text: `${restaurant.name}, ${meeting.startsAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}` } });
  }
  /**
   * Организатором фиксирует единственного лидера и закрывает голосование; ничья не допускается.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   */
  async select(userId: string, id: string) {
    return this.db.atomic(async (tx) => {
      const m = await this.owner(userId, id, tx);
      requireVoting(m.status);
      const restaurantId = chooseWinner(
        await tx.vote.findMany({ where: { meetingId: id } }),
      );
      await this.selectionMessage(tx, userId, m, restaurantId);
      return tx.meeting.update({
        where: { id },
        data: { restaurantId, status: "selected", version: { increment: 1 } },
      });
    });
  }
  /**
   * Подтверждает бронь выбранного места или отменяет подтверждение. Повторное подтверждение того же места идемпотентно.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param restaurantId ID заведения, участвующего в голосовании.
   * @param cancel При true отменяет подтверждение бронирования.
   */
  async booking(
    userId: string,
    id: string,
    restaurantId: string,
    cancel = false,
  ) {
    return this.db.atomic(async (tx) => {
      const m = await this.owner(userId, id, tx);
      if (cancel) {
        if (m.status !== "completed")
          throw new BadRequestError("Нет подтверждённой брони");
        return tx.meeting.update({
          where: { id },
          data: {
            status: "selected",
            bookedAt: null,
            completedAt: null,
            version: { increment: 1 },
          },
        });
      }
      if (m.status === "completed" && m.restaurantId === restaurantId) return m;
      await this.requireRestaurant(restaurantId, tx);
      if (m.status === "completed")
        throw new BadRequestError("Сначала отмените предыдущую бронь");
      const winner =
        m.status === "voting"
          ? chooseWinner(await tx.vote.findMany({ where: { meetingId: id } }))
          : m.restaurantId;
      if (winner !== restaurantId)
        throw new BadRequestError(
          "Можно подтвердить бронь выбранного участниками места",
        );
      if (m.status === "voting") await this.selectionMessage(tx, userId, m, restaurantId);
      const now = new Date();
      return tx.meeting.update({
        where: { id },
        data: {
          restaurantId,
          status: "completed",
          bookedAt: now,
          completedAt: now,
          version: { increment: 1 },
        },
      });
    });
  }
  /**
   * Добавляет существующий аккаунт по нормализованному email в открытое голосование.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param email Email добавляемого пользователя.
   */
  async addMember(userId: string, id: string, email: string) {
    return this.db.atomic(async (tx) => {
      const m = await this.owner(userId, id, tx);
      requireVoting(m.status);
      const user = await tx.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (!user)
        throw new NotFoundError(
          "Аккаунт с такой почтой не найден. Отправьте ссылку приглашения",
        );
      return tx.member.upsert({
        where: { meetingId_userId: { meetingId: id, userId: user.id } },
        create: { meetingId: id, userId: user.id },
        update: {},
      });
    });
  }
  /**
   * Удаляет участника и его голос; организатор не может удалить самого себя.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param target ID удаляемого участника.
   */
  async removeMember(userId: string, id: string, target: string) {
    return this.db.atomic(async (tx) => {
      const m = await this.owner(userId, id, tx);
      requireVoting(m.status);
      if (m.ownerId === target)
        throw new BadRequestError("Организатора удалить нельзя");
      await tx.vote.deleteMany({ where: { meetingId: id, userId: target } });
      await tx.member.deleteMany({ where: { meetingId: id, userId: target } });
      return { ok: true };
    });
  }
  /**
   * Создаёт приглашение на семь дней, сохраняя только хеш случайного токена.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   */
  async invite(userId: string, id: string) {
    await this.owner(userId, id);
    const token = randomBytes(32).toString("base64url");
    await this.db.invitation.create({
      data: {
        meetingId: id,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    return { token, url: `meetly://invite?token=${token}`, expiresInDays: 7 };
  }
  /**
   * Проверяет срок и отзыв приглашения и идемпотентно добавляет пользователя в открытую встречу.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param token Токен клиента; не записывается в журнал.
   */
  async accept(userId: string, token: string) {
    return this.db.atomic(async (tx) => {
      const invite = await tx.invitation.findUnique({
        where: { tokenHash: tokenHash(token) },
      });
      if (!invite || invite.revoked || invite.expiresAt < new Date())
        throw new BadRequestError("Приглашение истекло или отозвано");
      const m = await tx.meeting.findUniqueOrThrow({
        where: { id: invite.meetingId },
      });
      requireVoting(m.status);
      await tx.member.upsert({
        where: { meetingId_userId: { meetingId: invite.meetingId, userId } },
        create: { meetingId: invite.meetingId, userId },
        update: {},
      });
      return { meetingId: invite.meetingId };
    });
  }
}
