import type { TextStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили BottomNavigation; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabs: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    tab: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12 },
    tabLabel: { fontSize: 11 },
  });

/**
 * Выбирает цвет подписи текущей или неактивной вкладки.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getTabLabel(colors: ThemeColors, selected: boolean): TextStyle {
  return { color: selected ? colors.primaryText : colors.textMuted };
}
