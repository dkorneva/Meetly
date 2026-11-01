import { View } from "react-native";
import { Text, useTheme, useThemedStyles } from "../../theme/index";
import { createStyles, getAvatarStyle, getAvatarFontSize } from "./Avatars.styles";

/**
 * Показывает инициалы участников и число имён, не поместившихся в limit.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function Avatars({
  names,
  limit = 4,
  size = 36,
}: {
  names: string[];
  limit?: number;
  size?: number;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.avatarGroup}>
      {names.slice(0, limit).map((n, i) => (
        // n — текущее имя;
        // i — его индекс,
        <View
          key={n + i} // уникальный идентификатор элемента списка, нужен для оптимизации React
          style={[styles.avatar, getAvatarStyle(colors, size, n, i)]}
        >
          <Text style={[styles.avatarInitial, getAvatarFontSize(size)]}>
            {n[0]}
          </Text>
        </View>
      ))}
      {names.length > limit && (
        <Text style={styles.avatarOverflow}>+{names.length - limit}</Text>
      )}
    </View>
  );
}
