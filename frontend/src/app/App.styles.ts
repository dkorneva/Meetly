import { StyleSheet } from "react-native";
import type { ThemeColors } from "../shared/theme/index";


/**
 * Создаёт стили App; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    viewport: { flex: 1, alignItems: "center" },
    app: {
      flex: 1,
      width: "100%",
      maxWidth: 480,
      backgroundColor: colors.surface,
    },

    loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingLogo: { fontSize: 28, color: colors.primaryText, fontWeight: "700" },
    viewportBackground: { backgroundColor: colors.background },
    appBackground: { backgroundColor: colors.surface },
  });
