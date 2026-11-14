import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
/**
 * Prisma-клиент SQL Server с жизненным циклом NestJS и повтором конфликтующих транзакций.
 */
@Injectable()
export class Database
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Открывает соединение с БД при инициализации сервера.
   */
  async onModuleInit() {
    await this.$connect();
  }
  /**
   * Закрывает соединения Prisma при завершении сервера.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
  /**
   * Выполняет действие в Serializable-транзакции, повторяя только конфликты Prisma P2034.
   * @param action Операции БД; действие может выполняться до трёх раз и не должно отправлять внешние уведомления.
   * @returns Результат успешно завершённой транзакции.
   * @throws Последняя ошибка после трёх конфликтов либо первая неповторяемая ошибка.
   */
  async atomic<T>(
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.$transaction(action, {
          isolationLevel: "Serializable",
          maxWait: 10000,
          timeout: 15000,
        });
      } catch (e) {
        if (
          !(e instanceof Prisma.PrismaClientKnownRequestError) ||
          e.code !== "P2034" ||
          attempt >= 2
        )
          throw e;
      }
    }
  }
}
