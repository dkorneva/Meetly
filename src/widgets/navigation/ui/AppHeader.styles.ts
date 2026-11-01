import type { ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили AppHeader; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      minHeight: 64,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },

    titleContainer: { flex: 1 },
    title: { fontSize: 18, fontWeight: "600", color: colors.text },
    onlineStatus: { fontSize: 12, color: colors.successText, marginTop: 6 },
    cancelButton: { padding: 10 },
    cancelLabel: { fontSize: 14, color: colors.textSecondary },
  });

/**
 * Выбирает выравнивание заголовка в зависимости от режима формы.
 *
 * @param editing - Значение editing, используемое для вычисления результата.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getTitleAlignment(editing: boolean): ViewStyle {
  return { alignItems: editing ? "flex-start" : "center" };
}
