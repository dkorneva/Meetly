import { StyleSheet } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";
import type { ThemeColors } from "../../theme/index";

/**
 * Создаёт стили Avatars; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarGroup: { flexDirection: "row", alignItems: "center" },
    avatarInitial: { fontWeight: "600", color: colors.avatarText },
    avatarOverflow: {
      marginLeft: 8,
      color: colors.textSecondary,
      fontSize: 12,
    },
  });

/**
 * Вычисляет размер, цвет и перекрытие аватара по имени и позиции.
 *
 * @param colors - Палитра текущей темы.
 * @param size - Размер элемента.
 * @param name - Имя участника или пользователя.
 * @param index - Позиция элемента в списке, начиная с нуля.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getAvatarStyle(
  colors: ThemeColors,
  size: number,
  name: string,
  index: number,
): ViewStyle {
  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: size < 30 ? 0 : 2,
    backgroundColor: [
      colors.avatarBlue,
      colors.avatarPink,
      colors.avatarYellow,
      colors.avatarGreen,
      colors.avatarPurple,
    ][Math.max(0, ["А", "П", "М", "И", "Л"].indexOf(name[0])) % 5],
    marginLeft: index ? -7 : 0,
  };
}

/**
 * Вычисляет размер инициала относительно диаметра аватара.
 *
 * @param size - Размер элемента.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getAvatarFontSize(size: number): TextStyle {
  return { fontSize: size * 0.44 };
}
