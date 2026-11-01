import type { Store } from "../../../entities/meeting";
import { initialStore } from "../../model/initialStore";

// Читает сохранённые данные. При ошибке usePersistentStore покажет уведомление.

/**
 * Разбирает JSON, проверяет основные контейнеры и добавляет отсутствующие поля из initialStore; полной проверки вложенных объектов не выполняет.
 *
 * @param raw - JSON-строка, прочитанная из хранилища.
 * @returns Восстановленное состояние с начальными значениями отсутствующих полей.
 * @throws Если строка не является JSON, не содержит объект, непустой список встреч или объект сообщений.
 */
export function restoreStore(raw: string): Store {
  const saved = JSON.parse(raw); // Превращаем JSON-строку в объект.

  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    throw new Error("Сохранение должно быть объектом");
  }

  // Приложению нужна хотя бы одна встреча для экрана подробностей и чата.
  if (!Array.isArray(saved.meetings) || saved.meetings.length === 0) {
    throw new Error("В сохранении нет списка встреч");
  }

  // Сообщения хранятся как объект: ключ — ID встречи, значение — массив сообщений.
  if (!saved.messages || typeof saved.messages !== "object" || Array.isArray(saved.messages)) {
    throw new Error("В сохранении нет объекта сообщений");
  }

  // Сохранённые значения заменяют начальные; отсутствующие поля остаются из initialStore.
  return { ...initialStore, ...saved };
}
