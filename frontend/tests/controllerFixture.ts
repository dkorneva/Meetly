import { renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppController } from "../src/app/model/useAppController";
import { saveStore } from "../src/app/lib/storage/localStore";
import { makeController } from "./fixtures";

/** Создаёт независимое состояние для проверок настоящего клиентского контроллера. */
export function controllerStore() {
  return makeController().store;
}

/** Загружает подготовленное состояние через настоящий хук хранения с AsyncStorage в памяти. */
export async function renderController(store = controllerStore()) {
  await AsyncStorage.clear();
  await saveStore(store);
  const hook = await renderHook(() => useAppController());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}
