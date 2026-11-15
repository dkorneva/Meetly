import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Создаёт и проверяет JWT с одним секретным ключом сервера.
 * Поле kind указывает назначение токена:
 * "access" — для запросов пользователя,
 * "file" — для временной ссылки на файл.
 */
export class Tokens {
  constructor(private readonly secret: string) {}

  sign(payload: JwtPayload, expiresIn: number): string {
    return jwt.sign(payload, this.secret, { algorithm: "HS256", expiresIn });
  }

  verify(token: string): JwtPayload {
    const payload = jwt.verify(token, this.secret, { algorithms: ["HS256"] });
    if (typeof payload === "string") throw new Error("Invalid token payload"); // проверка, что payload является объектом, а не строкой
    return payload;
  }
}
