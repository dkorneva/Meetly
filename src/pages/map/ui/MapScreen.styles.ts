import type { ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../shared/theme/index";

/**
 * Создаёт стили MapScreen; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    top: { position: "absolute", top: 16, left: 20, right: 20, gap: 10 },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 18,
      height: 52,
    },
    filter: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: 22,
    },
    district: { position: "absolute", fontSize: 11, color: colors.mapDistrict },
    pin: {
      position: "absolute",
      width: 43,
      height: 43,
      borderRadius: 23,
      borderBottomRightRadius: 4,
      transform: [{ rotate: "45deg" }],
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0px 3px 4px rgba(0,0,0,.10)",
    },
    bottom: {
      position: "absolute",
      bottom: 14,
      left: 20,
      right: 20,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 12,
      boxShadow: "0px 3px 10px rgba(20,30,50,.06)",
    },
    root: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: colors.mapBackground,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.text },
    filtersRow: { gap: 6, justifyContent: "flex-start" },
    filterLabel: { color: colors.text, fontSize: 13 },
    searchResults: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      gap: 10,
    },
    searchResultLabel: { color: colors.text, padding: 8 },
    emptySearchLabel: { color: colors.textSecondary, padding: 8 },
    patrikiLabel: { left: "7.46%", top: "33.96%" },
    tverskoyLabel: { left: "67.85%", top: "23.1%" },
    arbatLabel: { left: "19.9%", top: "53%" },
    pinLabel: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
      transform: [{ rotate: "-45deg" }],
    },
    restaurantRow: { gap: 12 },
    restaurantImage: { width: 75, height: 75, borderRadius: 12 },
    restaurantInfo: { flex: 1, gap: 6 },
    restaurantName: { fontSize: 17, fontWeight: "600", color: colors.text },
    restaurantDescription: { fontSize: 14, color: colors.textSecondary },
    rating: { color: colors.rating },
    actionsRow: { gap: 8, marginTop: 12 },
    routeButton: {
      flex: 1,
      minHeight: 44,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 0,
    },
    bookingButton: { flex: 1.2, minHeight: 44 },
    emptyState: {
      color: colors.textSecondary,
      textAlign: "center",
      padding: 20,
    },
  });

/**
 * Преобразует координаты в проценты и выбирает цвет метки.
 *
 * @param colors - Палитра текущей темы.
 * @param x - Горизонтальная координата метки в процентах.
 * @param y - Вертикальная координата метки в процентах.
 * @param selected - Выбран ли элемент.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getMapPinStyle(
  colors: ThemeColors,
  x: number,
  y: number,
  selected: boolean,
): ViewStyle {
  return {
    left: `${x - 5}%`,
    top: `${y - 3}%`,
    backgroundColor: selected ? colors.accent : colors.primary,
  };
}
