import { StyleSheet } from "react-native";
import { useThemedStyles, type ThemeColors } from "../theme/index";

/**
 * Создаёт стили общих элементов; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createUiStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: { fontSize: 14, color: colors.label },
    heading: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: "600",
      color: colors.text,
    },
    muted: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
    section: {
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      backgroundColor: colors.surfaceMuted,
      padding: 16,
      gap: 12,
    },
  });

/**
 * Возвращает общие стили подписей, заголовков, карточек и секций с цветами текущей темы.
 *
 * @returns Данные и функции хука; точная структура указана в сигнатуре TypeScript.
 */
export function useUiStyles() {
  return useThemedStyles(createUiStyles);
}
