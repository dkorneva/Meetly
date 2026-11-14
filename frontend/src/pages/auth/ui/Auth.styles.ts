import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили Auth; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { padding: 20, paddingTop: 16 },
    logo: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.primaryText,
      marginBottom: 28,
    },
    title: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600",
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textSecondary,
      marginTop: 6,
    },
    backButton: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      marginBottom: 44,
    },
    backLabel: { color: colors.textSecondary },
    logoAccent: { color: colors.accentText },
    fields: { gap: 20, marginTop: 32 },
    passwordContainer: { position: "relative" },
    passwordInput: { paddingRight: 85 },
    passwordHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
    passwordToggle: { position: "absolute", right: 16, bottom: 18 },
    passwordToggleLabel: { color: colors.textSecondary, fontSize: 12 },
    error: { color: colors.accentText, marginTop: 14 },
    submitButton: { marginTop: 44 },
    switchButton: { marginTop: 32, padding: 12, alignItems: "center" },
    switchLabel: { color: colors.textSecondary, fontSize: 14 },
    switchLink: { color: colors.primaryText },
  });
