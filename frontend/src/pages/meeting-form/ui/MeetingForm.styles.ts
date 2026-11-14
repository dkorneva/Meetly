import type { TextStyle, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили MeetingForm; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap" },
    week: {
      width: "14.2857%",
      textAlign: "center",
      fontSize: 12,
      color: colors.textMuted,
      paddingVertical: 14,
    },
    day: {
      width: "14.2857%",
      height: 51,
      alignItems: "center",
      justifyContent: "center",
    },
    wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    hint: { fontSize: 12, color: colors.textMuted },
    contentContainer: { paddingHorizontal: 20, paddingBottom: 28 },
    titleSection: { paddingBottom: 0, borderBottomWidth: 0 },
    previousMonthButton: { padding: 10 },
    monthLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
    nextMonthButton: { padding: 10 },
    dayLabel: { fontSize: 16 },
    timePickerButton: { padding: 14 },
    timeRow: { gap: 9 },
    timeLabel: { fontSize: 16, color: colors.text },
    inviteRow: { gap: 8 },
    inviteLabel: { color: colors.primaryText, fontSize: 16 },
    budgetLabel: { fontSize: 16, fontWeight: "500", color: colors.primaryText },
    districtLabel: { fontSize: 16, color: colors.text },
    formatSection: { borderBottomWidth: 0 },
    formatSelector: {
      flexDirection: "row",
      padding: 3,
      backgroundColor: colors.surfaceInset,
      borderRadius: 12,
    },
    formatOption: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: 10,
    },
    formatOptionLabel: { fontSize: 13 },
    error: { color: colors.accentText, marginBottom: 12 },
  });

/**
 * Возвращает фон и скругление выбранного дня.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getSelectedDay(colors: ThemeColors): ViewStyle {
  return { backgroundColor: colors.primary, borderRadius: 12 };
}

/**
 * Возвращает цвет и насыщенность номера дня.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getDayLabel(colors: ThemeColors, selected: boolean): TextStyle {
  return {
    color: selected ? colors.onPrimary : colors.text,
    fontWeight: selected ? "600" : "400",
  };
}

/**
 * Возвращает фон выбранного варианта формата встречи.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getFormatBackground(
  colors: ThemeColors,
  selected: boolean,
): ViewStyle {
  return { backgroundColor: selected ? colors.surface : "transparent" };
}

/**
 * Возвращает цвет и насыщенность подписи формата встречи.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getFormatLabel(
  colors: ThemeColors,
  selected: boolean,
): TextStyle {
  return {
    color: selected ? colors.text : colors.textSecondary,
    fontWeight: selected ? "600" : "400",
  };
}
