import { BadRequestError } from "../http/errors";
import { Database } from "../infrastructure/database";
import { FilesService } from "./files.service";
export interface ProfileInput {
  name?: string;
  email?: string;
  dark?: boolean;
  calendar?: boolean;
  avatarId?: string | null;
}
/**
 * Читает и изменяет профиль без раскрытия хеша пароля и служебных полей аккаунта.
 */
export class UsersService {
  constructor(
    private readonly db: Database,
    private readonly files: FilesService,
  ) {}
  /**
   * Возвращает публичные поля собственного профиля и временную ссылку на аватар.
   * @param id ID запрашиваемой записи.
   * @returns Профиль без пароля и служебных данных сессии.
   */
  async me(id: string) {
    const user = await this.db.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarId: true,
        dark: true,
        calendar: true,
      },
    });
    return {
      ...user,
      avatar: user.avatarId
        ? await this.files.url(user.avatarId, id)
        : undefined,
    };
  }
  /**
   * Проверяет владение аватаром, нормализует email и сохраняет настройки собственного профиля.
   * @param id ID запрашиваемой записи.
   * @param input Данные операции после проверки HTTP-слоем.
   */
  async update(id: string, input: ProfileInput) {
    if (
      input.avatarId &&
      !(await this.db.file.findFirst({
        where: {
          id: input.avatarId,
          ownerId: id,
          meetingId: null,
          mime: { startsWith: "image/" },
        },
      }))
    )
      throw new BadRequestError("Некорректный аватар");
    await this.db.user.update({
      where: { id },
      data: {
        ...input,
        ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
      },
    });
    return this.me(id);
  }
}
