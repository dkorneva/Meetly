import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import * as argon2 from "argon2";
import { Database } from "../infrastructure/database";
import { LoginInput, RegisterInput } from "./inputs";
/**
 * Вычисляет SHA-256 для хранения и сравнения случайных токенов без сохранения исходного значения.
 */
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
/**
 * Управляет аккаунтами и серверными сессиями. Пароли хешируются Argon2, refresh-токены сохраняются только в виде SHA-256.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}
  /**
   * Нормализует email, создаёт аккаунт с хешем пароля и выдаёт первую сессию.
   * @param input Данные операции после проверки HTTP-слоем.
   * @throws ConflictException, если email уже занят.
   * @returns Пара accessToken/refreshToken новой сессии.
   */
  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    if (await this.db.user.findUnique({ where: { email } }))
      throw new ConflictException("Этот email уже зарегистрирован");
    const user = await this.db.user.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash: await argon2.hash(input.password),
      },
    });
    return this.issue(user.id);
  }
  /**
   * Проверяет пароль аккаунта и выдаёт новую независимую сессию.
   * @param input Данные операции после проверки HTTP-слоем.
   * @throws UnauthorizedException при неверной паре email/пароль.
   * @returns Пара токенов новой сессии.
   */
  async login(input: LoginInput) {
    const user = await this.db.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });
    if (!user || !(await argon2.verify(user.passwordHash, input.password)))
      throw new UnauthorizedException("Неверная почта или пароль");
    return this.issue(user.id);
  }
  /**
   * Создаёт сессию на 30 дней и access-токен на 15 минут; исходный refresh-токен возвращается только клиенту.
   * @param userId ID текущего аутентифицированного пользователя.
   * @returns Подписанный access-токен и исходный случайный refresh-токен.
   */
  private async issue(userId: string) {
    const refreshToken = randomBytes(48).toString("base64url");
    const session = await this.db.session.create({
      data: {
        userId,
        tokenHash: tokenHash(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    return {
      accessToken: await this.jwt.signAsync(
        { sub: userId, sid: session.id, kind: "access" },
        { expiresIn: "15m" },
      ),
      refreshToken,
    };
  }
  /**
   * Однократно потребляет действующий refresh-токен и заменяет сессию. При конкурентных запросах продолжить может только один.
   * @param token Токен клиента; не записывается в журнал.
   * @throws UnauthorizedException для истёкшего, отозванного или уже потреблённого токена.
   * @returns Токены замещающей сессии; прежняя сессия отозвана.
   */
  async refresh(token: string) {
    const session = await this.db.session.findUnique({
      where: { tokenHash: tokenHash(token) },
    });
    if (!session || session.expiresAt < new Date())
      throw new UnauthorizedException("Сессия истекла");
    // deleteMany атомарно потребляет токен: два параллельных refresh не создадут две сессии.
    const consumed = await this.db.session.deleteMany({
      where: { id: session.id },
    });
    if (!consumed.count)
      throw new UnauthorizedException("Токен уже использован");
    return this.issue(session.userId);
  }
  /**
   * Идемпотентно отзывает сессию указанного refresh-токена.
   * @param token Токен клиента; не записывается в журнал.
   * @returns Объект подтверждения отзыва сессии.
   */
  async logout(token: string) {
    await this.db.session.deleteMany({
      where: { tokenHash: tokenHash(token) },
    });
    return { ok: true };
  }
  /**
   * Проверяет подпись, назначение access-токена и наличие неистёкшей серверной сессии; возвращает ID пользователя.
   * @param token Токен клиента; не записывается в журнал.
   * @throws UnauthorizedException, если JWT или серверная сессия недействительны.
   * @returns ID пользователя, чей JWT и серверная сессия действительны.
   */
  async identify(token: string): Promise<string> {
    try {
      const payload = await this.jwt.verifyAsync(token);
      if (payload.kind !== "access" || typeof payload.sub !== "string")
        throw new Error();
      if (
        typeof payload.sid !== "string" ||
        !(await this.db.session.findFirst({
          where: {
            id: payload.sid,
            userId: payload.sub,
            expiresAt: { gt: new Date() },
          },
          select: { id: true },
        }))
      )
        throw new Error();
      return payload.sub;
    } catch {
      throw new UnauthorizedException("Войдите в аккаунт");
    }
  }
}
