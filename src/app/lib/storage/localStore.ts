import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Store } from "../../../entities/meeting";
import { restoreStore } from "./migrations";

const storageKey = "meetly.frontend.v1";

/**
 * Читает JSON из AsyncStorage и передаёт его в restoreStore для восстановления состояния.
 *
 * @returns Promise с восстановленным состоянием или null, если сохранение отсутствует.
 * @throws При ошибке системного API или восстановления данных возвращённый Promise отклоняется.
 */
export async function loadStore(): Promise<Store | null> {
  const raw = await AsyncStorage.getItem(storageKey);
  return raw ? restoreStore(raw) : null;
}
// Promise последней запланированной записи. Изначально уже завершён: первой записи ждать нечего.
let pending: Promise<void> = Promise.resolve();

/**
 * Сериализует состояние и ставит запись в очередь; неудачная предыдущая запись не блокирует следующую.
 *
 * @param store - Общее состояние приложения для сохранения.
 * @returns Promise завершения записи; отклоняется при ошибке этой записи.
 */
export function saveStore(store: Store): Promise<void> {
  // AsyncStorage хранит строки, поэтому преобразуем объект в JSON.
  const raw = JSON.stringify(store);
  // Новая запись начинается после завершения предыдущей.
  const next = pending
    // Ошибка предыдущей записи не блокирует следующую попытку сохранения.
    .catch(() => {})
    .then(() => AsyncStorage.setItem(storageKey, raw));
  // Следующий вызов saveStore будет ждать эту запись.
  pending = next;
  // Возвращаем Promise текущей записи, чтобы вызывающий код мог обработать её ошибку.
  return next;
}
