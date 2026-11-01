import { StyleSheet } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";
import type { ThemeColors } from "../../theme/index";

export type ButtonVariant = "primary" | "accent" | "outline";

/**
 * Создаёт стили Button; значения зависят от переданной палитры, если она используется.
 *
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = () =>
  StyleSheet.create({
    button: {
      flexDirection: "row",
      gap: 8,
      minHeight: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    buttonLabel: { fontSize: 15, fontWeight: "600" },
  });

/**
 * Возвращает фон, рамку и прозрачность кнопки по варианту и состояниям нажатия и блокировки.
 *
 * @param colors - Палитра текущей темы.
 * @param variant - Вариант кнопки: primary, accent или outline.
 * @param disabled - Заблокировано ли действие.
 * @param pressed - Нажата ли кнопка в данный момент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getButtonState(
  colors: ThemeColors,
  variant: ButtonVariant,
  disabled: boolean,
  pressed: boolean,
): ViewStyle {
  return {
    backgroundColor: variant === "outline"
      ? "transparent"
      : variant === "accent"
        ? colors.accent
        : colors.primary,
    borderWidth: variant === "outline" ? 1 : 0,
    borderColor: colors.border,
    opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
  };
}

/**
 * Возвращает цвет подписи для варианта кнопки.
 *
 * @param colors - Палитра текущей темы.
 * @param variant - Вариант кнопки: primary, accent или outline.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getButtonLabelColor(
  colors: ThemeColors,
  variant: ButtonVariant,
): TextStyle {
  return { color: variant === "outline" ? colors.text : colors.onPrimary };
}
