import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

// StyleSheet — встроенный инструмент для объявления и объединения стилей компонентов


/**
 * Создаёт стили BookingDialog; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    restaurantSummary: {
      backgroundColor: colors.surfaceMuted,
      padding: 16,
      borderRadius: 16,
      gap: 12,
    },
    restaurantImage: { width: 56, height: 56, borderRadius: 10 },
    restaurantInfo: { flex: 1, gap: 6 },
    restaurantName: { fontSize: 16, fontWeight: "600", color: colors.text },
    restaurantDescription: { color: colors.textSecondary, fontSize: 13 },
    contactList: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    firstContactRow: { padding: 16 },
    contactRow: {
      padding: 16,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    contactLabel: { color: colors.textSecondary, fontSize: 14 },
    contactLink: {
      color: colors.primaryText,
      fontSize: 14,
      textDecorationLine: "underline",
    },
  });

