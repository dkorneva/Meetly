import type { TextStyle, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили MeetingDetail; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    restaurant: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0px 2px 6px rgba(25,35,70,0.04)",
    },
    count: {
      fontSize: 11,
      color: colors.textSecondary,
      backgroundColor: colors.counterSurface,
      paddingVertical: 5,
      paddingHorizontal: 9,
      borderRadius: 20,
    },
    restaurantImage: { width: "100%", height: 152 },
    restaurantTag: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 9,
    },
    restaurantTagLabel: { fontSize: 12 },
    restaurantInfo: { padding: 16, gap: 7 },
    restaurantName: { fontSize: 16, fontWeight: "600", color: colors.text },
    rating: { color: colors.rating, fontSize: 13 },
    priceRow: { marginTop: 4 },
    price: { fontSize: 15, fontWeight: "600", color: colors.text },
    priceHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    voteButtonLabel: { fontSize: 14, fontWeight: "500" },
    voteButton: { minHeight: 44, borderRadius: 12, paddingHorizontal: 18 },
    contentContainer: { paddingBottom: 16 },
    meetingHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    meetingStatus: {
      color: colors.accentText,
      fontSize: 12,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    meetingTitle: {
      fontSize: 24,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
    },
    dateRow: { justifyContent: "flex-start", gap: 9 },
    content: { padding: 20, gap: 20 },
    participantsHeader: { marginTop: 8 },
    manageParticipantsLink: { color: colors.primaryText, fontSize: 13 },
    participantsCount: { fontSize: 13, fontWeight: "600", color: colors.text },
    preferencesCard: { padding: 16 },
    preferencesLabel: { color: colors.primaryText, fontSize: 11 },
    editPreferencesButtonLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.primaryText,
    },
    editPreferencesButton: {
      minHeight: 44,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
      borderRadius: 10,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: -20,
    },
    placesHint: { color: colors.textMuted, fontSize: 14, marginTop: -14 },
    votingSection: { marginVertical: 20, gap: 14 },
    progressTrack: {
      height: 6,
      borderRadius: 5,
      backgroundColor: colors.progressTrack,
      overflow: "hidden",
    },
    progressBar: { height: 6, backgroundColor: colors.success },
    votingRow: { gap: 9 },
    votingName: { color: colors.text, fontSize: 13 },
    votingCount: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    footer: {
      padding: 14,
      borderTopWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
  });

/**
 * Выбирает цвет метки ресторана по его идентификатору.
 *
 * @param colors - Палитра текущей темы.
 * @param id - Идентификатор обрабатываемого объекта.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getRestaurantTagColor(
  colors: ThemeColors,
  id: string,
): TextStyle {
  return {
    color:
      id === "terrace"
        ? colors.restaurantTag
        : id === "coffee"
          ? colors.warningText
          : colors.primaryText,
  };
}

/**
 * Вычисляет процент проголосовавших, ограничивая ширину 100% и исключая деление на ноль.
 *
 * @param votes - Количество проголосовавших.
 * @param participants - Количество участников встречи.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getVotingProgress(
  votes: number,
  participants: number,
): ViewStyle {
  return {
    width: `${Math.min(100, (votes / Math.max(1, participants)) * 100)}%`,
  };
}
