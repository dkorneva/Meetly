import { StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import type { ThemeColors } from "../../theme/index";

/**
 * Создаёт стили Toggle; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // switchTrack — фон переключателя, внутри которого находится кружок
    switchTrack: {
      width: 44,
      height: 28,
      borderRadius: 16,
      padding: 4,
      justifyContent: "center",
    },
    // switchThumb — кружок переключателя
    switchThumb: {
      width: 20,
      height: 20,
      borderRadius: 12,
      backgroundColor: colors.switchThumb,
    },
  });

/**
 * Выбирает цвет фона переключателя по его состоянию.
 *
 * @param colors - Палитра текущей темы.
 * @param enabled - Включено ли состояние элемента.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getSwitchTrack(
  colors: ThemeColors,
  enabled: boolean,
): ViewStyle {
  return { backgroundColor: enabled ? colors.primary : colors.switchTrack };
}

/**
 * Располагает кружок переключателя слева или справа.
 *
 * @param enabled - Включено ли состояние элемента.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getSwitchThumb(enabled: boolean): ViewStyle {
  return { alignSelf: enabled ? "flex-end" : "flex-start" };
}
