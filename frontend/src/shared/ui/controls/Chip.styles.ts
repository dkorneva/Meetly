import { StyleSheet } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";
import type { ThemeColors } from "../../theme/index";

/**
 * Создаёт стили Chip; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: "transparent",
    },
    chipLabel: { fontSize: 13 },
  });

/**
 * Возвращает фон и рамку выбранной метки.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getSelectedChip(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.selectedSurface,
    borderColor: colors.selectedBorder,
  };
}

/**
 * Выбирает цвет и насыщенность подписи метки.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getChipLabel(
  colors: ThemeColors,
  selected: boolean,
): TextStyle {
  return {
    color: selected ? colors.primaryText : colors.text,
    fontWeight: selected ? "600" : "400",
  };
}
