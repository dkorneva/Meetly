import { Pressable } from "react-native";
import { Icon, type IconName } from "../Icon";
import { useTheme, useThemedStyles } from "../../theme/index";
import { createStyles } from "./IconButton.styles";

/**
 * Показывает кнопку с иконкой и вызывает переданный обработчик нажатия.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function IconButton({
  name,
  onPress,
  color,
}: {
  name: IconName;
  onPress: () => void;
  color?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  color ??= colors.text; // если color равен undefined или null, присвоить ему colors.text стандартный цвет текста текущей темы
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
