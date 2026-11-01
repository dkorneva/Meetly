import type { ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

// _colors не используется: цвета элементов заданы в общих стилях uiStyles
// и отдельно в getMeetingSelection, здесь определяются только размеры и отступы
/**
 * Создаёт стили CalendarExportDialog; значения зависят от переданной палитры, если она используется.
 *
 * @param _colors - Значение _colors, используемое для вычисления результата.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    meetingList: { gap: 8 },
    meetingRow: { gap: 10 },
    meetingInfo: { flex: 1, gap: 4 },
    exportButton: { minHeight: 66, paddingVertical: 12 },
    exportButtonLabel: { textAlign: "center", lineHeight: 21, flexShrink: 1 },
  });

/**
 * Выбирает цвет рамки выбранной карточки встречи.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getMeetingSelection(
  colors: ThemeColors,
  selected: boolean,
): ViewStyle {
  return { borderColor: selected ? colors.primaryText : colors.border };
}
