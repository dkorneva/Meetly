import { Prisma, PrismaClient } from "@prisma/client";
/**
 * Prisma-клиент SQL Server: подключение, отключение и повтор конфликтующих транзакций
 */
export class Database extends PrismaClient {
  /**
   * Открывает соединение с БД при инициализации сервера
   */
  async connect() {
    await this.$connect();
  }
  /**
   * Закрывает соединения Prisma при завершении сервера
   */
  async disconnect() {
    await this.$disconnect();
  }
  /**
   * Выполняет изменения в БД как одну операцию, защищённую от одновременных изменений другими запросами.
   * При конфликте с другой транзакцией повторяет попытку — всего до трёх раз.
   * При любой другой ошибке сразу прекращает выполнение и передаёт ошибку дальше.
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

// Связанные изменения сохраняются вместе: либо сохраняется всё, либо не сохраняется ничего
