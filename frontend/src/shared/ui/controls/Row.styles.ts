import { StyleSheet } from "react-native";

/**
 * Создаёт стили Row; значения зависят от переданной палитры, если она используется.
 *
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  });
