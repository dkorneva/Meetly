import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили DialogHost; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    dialog: {
      width: "100%",
      maxWidth: 480,
      maxHeight: "88%",
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 14,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 4,
      backgroundColor: colors.dialogHandle,
      alignSelf: "center",
      marginBottom: 12,
    },

    dialogBackground: { backgroundColor: colors.surface },
    dialogHeader: { marginBottom: 22 },
    dialogContent: { gap: 18, paddingBottom: 8 },
    closeButton: { alignItems: "center", padding: 10 },
    closeLabel: { color: colors.textSecondary, fontSize: 14 },
  });
