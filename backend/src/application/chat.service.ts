import { HIDDEN_BOOKING_NOTICE } from "../domain/chat";
import { BadRequestError, NotFoundError } from "../http/errors";
import { Database } from "../infrastructure/database";
import { MeetingsService } from "./meetings.service";
import { MessageInput } from "./inputs";
import { FilesService } from "./files.service";
/**
 * Проверяет права на переписку, сохраняет сообщения и реакции, выдаёт страницы истории
 */
export class ChatService {
  /** Сохраняет подключение к БД и сервисы проверки доступа к встречам и файлам. */
  constructor(
    private readonly db: Database,
    private readonly meetings: MeetingsService,
    private readonly files: FilesService,
  ) {}
  /**
   * Возвращает до 50 сообщений в хронологическом порядке и курсор предыдущей страницы; скрывает устаревшее служебное уведомление
   * @param userId ID текущего аутентифицированного пользователя
   * @param id ID запрашиваемой записи
   * @param before Курсор сообщения для загрузки более ранней страницы
   * @returns Страница items и nextCursor либо null в конце истории 
   */
  async list(userId: string, id: string, before?: string) {
    await this.meetings.member(userId, id);
    if (
      before &&
      !(await this.db.message.findFirst({
        where: { id: before, meetingId: id },
      }))
    )
      throw new BadRequestError("Некорректный курсор");
    const items = await this.db.message.findMany({
      where: { meetingId: id, NOT:{kind:"system",text:HIDDEN_BOOKING_NOTICE} },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      include: { reactions: true },
    });
    const ids = [...new Set(items.map((m) => m.senderId))];
    const users = await this.db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const fileIds = items.flatMap((m) => (m.fileId ? [m.fileId] : []));
    const files = await this.db.file.findMany({
      where: { id: { in: fileIds } },
      select: { id: true, name: true, mime: true },
    });
    return {
      items: (
        await Promise.all(
          items.map(async (m) => {
            const file = files.find((f) => f.id === m.fileId);
            return {
              ...m,
              name:
                users.find((u) => u.id === m.senderId)?.name ??
                "Удалённый пользователь",
              attachment: file
                ? {
                    name: file.name,
                    image: file.mime.startsWith("image/"),
                    uri: await this.files.url(file.id, userId),
                  }
                : undefined,
            };
          }),
        )
      ).reverse(),
      nextCursor: items.length === 50 ? items[49].id : null,
    };
  }
  /**
   * Атомарно сохраняет непустое сообщение или вложение, принадлежащее отправителю и этой встрече.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param id ID запрашиваемой записи.
   * @param input Данные операции после проверки HTTP-слоем.
   */
  async send(userId: string, id: string, input: MessageInput) {
    return this.db.atomic(async (tx) => {
      await this.meetings.member(userId, id, tx);
      if (!input.text.trim() && !input.fileId)
        throw new BadRequestError("Пустое сообщение");
      if (
        input.fileId &&
        !(await tx.file.findFirst({
          where: { id: input.fileId, ownerId: userId, meetingId: id },
        }))
      )
        throw new BadRequestError("Вложение не принадлежит этому чату");
      return tx.message.create({
        data: {
          meetingId: id,
          senderId: userId,
          text: input.text.trim(),
          fileId: input.fileId,
        },
      });
    });
  }
  /**
   * Идемпотентно ставит или снимает реакцию пользователя на обычное сообщение доступной встречи.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param meetingId ID встречи, доступ к которой проверяется.
   * @param id ID запрашиваемой записи.
   * @param liked Желаемое состояние реакции.
   */
  async react(userId: string, meetingId: string, id: string, liked: boolean) {
    return this.db.atomic(async (tx) => {
      await this.meetings.member(userId, meetingId, tx);
      if (
        !(await tx.message.findFirst({
          where: { id, meetingId, kind: "text" },
        }))
      )
        throw new NotFoundError("Сообщение не найдено");
      if (liked)
        await tx.reaction.upsert({
          where: { messageId_userId: { messageId: id, userId } },
          create: { messageId: id, userId },
          update: {},
        });
      else await tx.reaction.deleteMany({ where: { messageId: id, userId } });
      return { liked };
    });
  }
}
