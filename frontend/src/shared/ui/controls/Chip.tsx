import { Pressable } from "react-native";
import { Text, useTheme, useThemedStyles } from "../../theme/index";
import { createStyles, getSelectedChip, getChipLabel } from "./Chip.styles";

/**
 * Показывает выбираемую метку с оформлением выбранного или обычного состояния.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && getSelectedChip(colors)]}
    >
      <Text style={[styles.chipLabel, getChipLabel(colors, selected)]}>
        {label}
      </Text>
    </Pressable>
  );
}
