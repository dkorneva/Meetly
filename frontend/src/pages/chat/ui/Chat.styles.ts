import type { ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили Chat; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1 },
    leaderCard: {
      marginHorizontal: 20,
      marginTop: 12,
      padding: 10,
      borderRadius: 12,
      backgroundColor: colors.leaderSurface,
    },
    leaderLabel: { fontSize: 10, color: colors.textSecondary },
    leaderTitle: { fontSize: 14, color: colors.text, marginTop: 0 },
    messagesContent: { padding: 20, gap: 14 },
    dateBadge: {
      alignSelf: "center",
      backgroundColor: colors.surfaceMuted,
      padding: 6,
      borderRadius: 12,
      fontSize: 11,
      color: colors.textMuted,
    },
    systemMessage: {
      textAlign: "center",
      color: colors.textMuted,
      fontSize: 12,
      paddingVertical: 4,
    },
    confirmationCard: {
      backgroundColor: colors.confirmationSurface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.successBorder,
      padding: 12,
    },
    confirmationRow: { justifyContent: "flex-start", gap: 12 },
    confirmationIcon: {
      backgroundColor: colors.success,
      borderRadius: 20,
      padding: 7,
    },
    confirmationTitle: { fontWeight: "600", color: colors.text },
    confirmationDescription: { marginTop: 5 },
    messageContainer: { maxWidth: "88%" },
    messageMeta: { fontSize: 11, color: colors.text, marginBottom: 5 },
    messageRow: { gap: 12, alignItems: "flex-end" },
    messageBubble: {
      flexShrink: 1,
      maxWidth: 284,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    attachment: { width: 200, height: 160, borderRadius: 12, marginBottom: 8 },
    messageText: { fontSize: 15, lineHeight: 22, color: colors.text },
    reactionBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: -8,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    reactionCount: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    composer: {
      padding: 12,
      gap: 9,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    messageInput: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
      maxHeight: 100,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });

/**
 * Выравнивает своё сообщение справа, чужое — слева.
 *
 * @param mine - Принадлежит ли сообщение текущему пользователю.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getMessageAlignment(mine: boolean | undefined): ViewStyle {
  return { alignSelf: mine ? "flex-end" : "flex-start" };
}

/**
 * Выбирает отступ подписи сообщения с учётом аватара.
 *
 * @param mine - Принадлежит ли сообщение текущему пользователю.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getMessageMetaInset(mine: boolean | undefined): ViewStyle {
  return { marginLeft: mine ? 0 : 40 };
}

/**
 * Выбирает фон своего или чужого сообщения.
 *
 * @param colors - Палитра текущей темы.
 * @param mine - Принадлежит ли сообщение текущему пользователю.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getMessageBackground(
  colors: ThemeColors,
  mine: boolean | undefined,
): ViewStyle {
  return {
    backgroundColor: mine ? colors.selectedSurface : colors.surfaceRaised,
  };
}

/**
 * Выбирает отступ реакции под своим или чужим сообщением.
 *
 * @param mine - Принадлежит ли сообщение текущему пользователю.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getReactionInset(mine: boolean | undefined): ViewStyle {
  return { marginLeft: mine ? 12 : 48 };
}
