import type { TextStyle, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили ProfileScreen; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 1,
      color: colors.textMuted,
    },
    settingIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.infoSurface,
      alignItems: "center",
      justifyContent: "center",
    },

    profileHeader: {
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      paddingVertical: 32,
      gap: 9,
    },
    avatarButton: {
      width: 96,
      height: 96,
      backgroundColor: colors.avatarPink,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    avatarImage: { width: 90, height: 90, borderRadius: 50 },
    avatarInitial: { fontSize: 36, color: colors.profileAvatarText },
    editBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
      padding: 4,
      borderRadius: 16,
    },
    profileName: { fontSize: 24, fontWeight: "600", color: colors.text },
    profileEmail: { fontSize: 15, fontWeight: "600", color: colors.textMuted },
    content: { padding: 20, gap: 24 },
    calendarCard: { backgroundColor: colors.surface },
    calendarRow: { gap: 12 },
    calendarIconLabel: { color: colors.primaryText, fontSize: 14 },
    calendarInfo: { flex: 1 },
    settingTitle: { fontSize: 16, color: colors.text },
    calendarStatus: { fontSize: 14, marginTop: 4 },
    configureLink: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryText,
    },
    settingsCard: { backgroundColor: colors.surface, padding: 0, gap: 0 },
    settingRow: { padding: 14, gap: 10, borderColor: colors.border },
    settingInfo: { flex: 1 },
    settingLabel: { fontSize: 16, color: colors.text },
    settingDescription: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    signOutButton: {
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.dangerSurface,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 9,
    },
    signOutLabel: { fontSize: 16, color: colors.accentText },
  });

/**
 * Выбирает цвет текста состояния переключателя календаря.
 *
 * @param colors - Палитра текущей темы.
 * @param enabled - Включено ли состояние элемента.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getCalendarStatus(
  colors: ThemeColors,
  enabled: boolean,
): TextStyle {
  return { color: enabled ? colors.successText : colors.textSecondary };
}

/**
 * Добавляет нижний разделитель только первой строке настроек.
 *
 * @param index - Позиция элемента в списке, начиная с нуля.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getSettingDivider(index: number): ViewStyle {
  return { borderBottomWidth: index ? 0 : 1 };
}
