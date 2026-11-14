import {
  CanActivate,
  ExecutionContext,
  Injectable,
  createParamDecorator,
} from "@nestjs/common";
import { AuthService } from "../application/auth.service";
/**
 * Защищает бизнес-маршруты проверкой access-токена и серверной сессии.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  /**
   * Определяет пользователя запроса и помещает его ID в контекст контроллера.
   * @param context Контекст HTTP-запроса NestJS.
   */
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.userId = await this.auth.identify(
      req.headers.authorization?.replace(/^Bearer /, "") ?? "",
    );
    return true;
  }
}
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest().userId,
);
