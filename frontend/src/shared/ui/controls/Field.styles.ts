import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../theme/index";

/**
 * Создаёт стили Field; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fieldContainer: { gap: 9 },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.surface,
    },
  });
