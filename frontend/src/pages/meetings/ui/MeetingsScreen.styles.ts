import type { TextStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили MeetingsScreen; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    search: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    count: {
      fontSize: 11,
      color: colors.textSecondary,
      backgroundColor: colors.counterSurface,
      width: 24,
      height: 24,
      lineHeight: 24,
      textAlign: "center",
      borderRadius: 12,
      overflow: "hidden",
    },
    badge: {
      fontSize: 11,
      paddingVertical: 7,
      paddingHorizontal: 9,
      borderRadius: 20,
    },
    fab: {
      position: "absolute",
      right: 22,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 30,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0px 2px 6px rgba(0,0,0,.12)",
    },

    root: { flex: 1 },
    contentContainer: { padding: 20, paddingBottom: 28 },
    greetingRow: { marginBottom: 22 },
    dateLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
    greeting: { color: colors.text, fontSize: 24, fontWeight: "700" },
    profileButton: {
      width: 52,
      height: 52,
      borderRadius: 28,
      backgroundColor: colors.avatarPink,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.avatarText,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.text },
    sectionHeader: { marginTop: 26, marginBottom: 14 },
    tabsRow: { gap: 16 },
    tabLabel: { fontSize: 16 },
    meetingCard: {
      marginBottom: 12,
      padding: 16,
      boxShadow: "0px 2px 6px rgba(30,40,70,.03)",
    },
    meetingTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
    metadataRow: { justifyContent: "flex-start", gap: 15 },
    dateRow: { gap: 6 },
    dateText: { fontSize: 13, color: colors.textSecondary },
    participantsRow: { gap: 6 },
    participantsText: { fontSize: 13, color: colors.textSecondary },
    emptyState: { padding: 24, textAlign: "center" },
  });

/**
 * Возвращает цвет активной или неактивной вкладки встреч.
 *
 * @param colors - Палитра текущей темы.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getSectionLabel(
  colors: ThemeColors,
  selected: boolean,
): TextStyle {
  return { color: selected ? colors.text : colors.textMuted };
}

/**
 * Выбирает цвет текста и фон статуса встречи.
 *
 * @param colors - Палитра текущей темы.
 * @param status - Статус встречи.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getMeetingBadge(
  colors: ThemeColors,
  status: string,
): TextStyle {
  return {
    color:
      status === "voting"
        ? colors.accentText
        : status === "selected"
          ? colors.selectedText
          : colors.primaryText,
    backgroundColor:
      status === "voting"
        ? colors.votingSurface
        : status === "selected"
          ? colors.successSurface
          : colors.completedSurface,
  };
}
