import jwt, { JwtPayload } from "jsonwebtoken";

/** Подписывает JWT общим секретом. Access-токены и ссылки различаются полем kind. */
export class Tokens {
  constructor(private readonly secret: string) {}

  sign(payload: JwtPayload, expiresIn: number): string {
    return jwt.sign(payload, this.secret, { algorithm: "HS256", expiresIn });
  }

  verify(token: string): JwtPayload {
    const payload = jwt.verify(token, this.secret, { algorithms: ["HS256"] });
    if (typeof payload === "string") throw new Error("Invalid token payload");
    return payload;
  }
}
