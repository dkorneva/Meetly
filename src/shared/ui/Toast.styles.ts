import type { Animated, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "../theme/index";
// ViewStyle описывает допустимые стили контейнера, тип TypeScript, 
// который проверяет, подходят ли записанные свойства для оформления View
/**
 * Создаёт стили Toast; значения зависят от переданной палитры, если она используется.
 *
 * @param colors - Палитра текущей темы.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      position: "absolute",
      left: 16,
      right: 16,
      zIndex: 10000,
      elevation: 10, // задаёт высоту элемента на Android, влияющую на тень и наложение
      backgroundColor: colors.surface, 
      borderRadius: 8,
      borderLeftWidth: 4,
      overflow: "hidden",
      boxShadow: "0px 4px 18px rgba(15,23,42,0.16)",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      minHeight: 64,
    },
    icon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    symbol: {
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "700",
      color: colors.onPrimary,
    },
    text: {
      flex: 1,
      fontFamily: "Inter",
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
    },
    cardBackground: { backgroundColor: colors.surface },
    progressTrack: { height: 3, backgroundColor: colors.dividerSurface },
    progressBar: { height: 3 },
  });

/**
 * Связывает анимированное появление уведомления с прозрачностью и смещением.
 *
 * @param top - Верхний безопасный отступ устройства.
 * @param entrance - Анимированное значение появления уведомления.
 * @param color - Цвет элемента.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getToastEntrance(
  top: number,
  entrance: Animated.Value,
  color: string,
): Animated.WithAnimatedObject<ViewStyle> { // функция возвращает стили контейнера, в которых могут использоваться анимируемые значения
  return {
    top: top + 12,
    borderLeftColor: color, // окрашивает левую границу толщиной 4, которую мы объявили в card - индикатор типа уведомления
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({ // interpolate переводит значение из одного диапазона в другой
          inputRange: [0, 1], // значение entrance: от начала до конца анимации
          outputRange: [-20, 0], // значение translateY: от -20 (сверху) до 0 (на месте)
        }),
      },
    ],
  };
}

/**
 * Возвращает фон значка уведомления.
 *
 * @param color - Цвет элемента.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getToastIconColor(color: string): ViewStyle {
  return { backgroundColor: color };
}

/**
 * Связывает ширину полосы уведомления с анимированным значением.
 *
 * @param progress - Анимированная доля оставшегося времени.
 * @param color - Цвет элемента.
 * @returns Вычисленное значение; точный тип указан в сигнатуре TypeScript.
 */
export function getToastProgress(
  progress: Animated.Value,
  color: string,
): Animated.WithAnimatedObject<ViewStyle> {
  return {
    backgroundColor: color,
    width: progress.interpolate({
      inputRange: [0, 1], // значение progress: от начала до конца анимации
      outputRange: ["0%", "100%"],
    }),
  };
}
