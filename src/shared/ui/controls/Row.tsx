import { useThemedStyles } from "../../theme/index";
import type React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { createStyles } from "./Row.styles";

/**
 * Располагает дочерние элементы горизонтально, объединяя базовый и переданный стили.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  // ViewStyle — допустимые свойства оформления View, например padding, gap, backgroundColor;
  // StyleProp — позволяет передать их как объект или массив стилей
}) {
  const styles = useThemedStyles(createStyles);

  return <View style={[styles.row, style]}>{children}</View>;
}
