import { Pressable, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { Icon, type IconName } from "../Icon";
import { Text, useTheme, useThemedStyles } from "../../theme/index";
import { createStyles, getButtonState, getButtonLabelColor, type ButtonVariant } from "./Button.styles";

/**
 * Показывает кнопку выбранного варианта оформления; disabled блокирует нажатия.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  style,
  disabled = false,
  icon,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  // Один вариант оформления: основная, акцентная или кнопка с рамкой.
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  icon?: IconName;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles); // стили кнопки

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        getButtonState(colors, variant, disabled, pressed),
        style,
      ]}
    >
      {!!icon && (
        <Icon
          name={icon}
          size={18}
          color={variant === "outline" ? colors.text : colors.onPrimary}
        />
      )}
      <Text
        style={[
          styles.buttonLabel,
          getButtonLabelColor(colors, variant),
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
