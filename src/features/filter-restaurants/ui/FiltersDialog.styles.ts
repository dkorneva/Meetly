import { StyleSheet } from "react-native";
/**
 * Создаёт стили FiltersDialog; значения зависят от переданной палитры, если она используется.
 *
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = () =>
  StyleSheet.create({
    wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  });
