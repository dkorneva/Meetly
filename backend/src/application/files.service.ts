import { BadRequestError, NotFoundError, ForbiddenError } from "../http/errors";
import { Tokens } from "../infrastructure/tokens";
import { Database } from "../infrastructure/database";
import { MeetingsService } from "./meetings.service";
/**
 * Хранит вложения в SQL Server и выдаёт временные ссылки с проверкой прав при каждом скачивании.
 */
export class FilesService {
  constructor(
    private readonly db: Database,
    private readonly meetings: MeetingsService,
    private readonly jwt: Tokens,
  ) {}
  /**
   * Проверяет тип файла и участие во встрече, сохраняет содержимое и возвращает подписанную ссылку.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param file Файл загрузки либо имя ресурса карты.
   * @param meetingId ID встречи, доступ к которой проверяется.
   * @throws При нарушении прав, правил операции или недоступности требуемых данных.
   * @returns ID, имя, MIME-тип и временный URL файла.
   */
  async upload(userId: string, file: Express.Multer.File | undefined, meetingId?: string) {
    if (!file) throw new BadRequestError("Выберите файл");
    if (meetingId) await this.meetings.member(userId, meetingId);
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
    ];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestError(
        "Поддерживаются JPEG, PNG, WebP, PDF и TXT",
      );
    if (!meetingId && !file.mimetype.startsWith("image/"))
      throw new BadRequestError("Для аватара нужно изображение");
    const result = await this.db.file.create({
      data: {
        ownerId: userId,
        meetingId,
        name: file.originalname.slice(0, 255),
        mime: file.mimetype,
        data: new Uint8Array(file.buffer),
      },
      select: { id: true, name: true, mime: true },
    });
    return { ...result, url: await this.url(result.id, userId) };
  }
  /**
   * Создаёт ссылку на файл с JWT на один час, привязанным к файлу и пользователю.
   * @param fileId ID файла, для которого формируется ссылка.
   * @param userId ID текущего аутентифицированного пользователя.
   * @returns Абсолютный URL скачивания с токеном на один час.
   */
  async url(fileId: string, userId: string) {
    const token = await this.jwt.sign(
      { sub: userId, fileId, kind: "file" },
      60 * 60,
    );
    return `${process.env.PUBLIC_URL}/api/files/${fileId}?token=${token}`;
  }
  /**
   * Проверяет назначение и подпись токена, соответствие файлу и актуальные права его получателя.
   * @param id ID запрашиваемой записи.
   * @param token Токен клиента; не записывается в журнал.
   * @throws При нарушении прав, правил операции или недоступности требуемых данных.
   * @returns Запись файла с бинарным содержимым для HTTP-ответа.
   */
  async download(id: string, token: string) {
    let sub: string;
    try {
      const p = await this.jwt.verify(token);
      if (p.kind !== "file" || p.fileId !== id || typeof p.sub !== "string") throw new Error();
      sub = p.sub;
    } catch {
      throw new ForbiddenError("Ссылка на файл истекла");
    }
    const file = await this.db.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundError();
    if (file.meetingId) await this.meetings.member(sub, file.meetingId);
    else if (file.ownerId !== sub) throw new ForbiddenError();
    return file;
  }
}
