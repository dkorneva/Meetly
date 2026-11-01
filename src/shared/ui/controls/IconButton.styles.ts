import { StyleSheet } from "react-native";

/**
 * Создаёт стили IconButton; значения зависят от переданной палитры, если она используется.
 *
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = () =>
  StyleSheet.create({
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
  });
