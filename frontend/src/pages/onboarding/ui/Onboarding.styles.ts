import type { ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили Onboarding; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
    logo: { fontSize: 20, fontWeight: "700", color: colors.primaryText },
    art: {
      width: "100%",
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    text: { fontSize: 16, lineHeight: 22, color: colors.textSecondary },
    logoAccent: { color: colors.accentText },
    content: { flex: 1 },
    illustrationSpacing: { marginTop: 20, marginBottom: 36 },
    pagination: { justifyContent: "center", gap: 6, marginBottom: 16 },
    indicator: { height: 7, borderRadius: 8 },
    nextButtonLabel: { fontSize: 16, fontWeight: "600" },
    skipButton: { paddingVertical: 18, alignItems: "center" },
    skipLabel: { color: colors.textSecondary, fontSize: 14 },
  });

/**
 * Рассчитывает высоту иллюстрации с сохранением её пропорций.
 *
 * @param width - Доступная ширина изображения.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getIllustrationSize(width: number): ViewStyle {
  return { height: (width * 270) / 362 };
}

/**
 * Возвращает размер и цвет индикатора текущего слайда.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getSlideIndicator(
  colors: ThemeColors,
  selected: boolean,
): ViewStyle {
  return {
    width: selected ? 24 : 7,
    backgroundColor: selected ? colors.primary : colors.inactiveIndicator,
  };
}
