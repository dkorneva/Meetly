import { View, type TextInputProps } from "react-native";
import { Text, TextInput, useTheme, useThemedStyles } from "../../theme/index";
import { createStyles } from "./Field.styles";
import { useUiStyles } from "../shared.styles";

/**
 * Показывает поле ввода с необязательной подписью и передаёт свойства внутреннему TextInput.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function Field({
  label, // специфично для поля ввода, не относится к TextInputProps
  ...props // остальные свойства TextInputProps, которые передаются из родительского компонента
}: TextInputProps & { label?: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();

  return (
    <View style={styles.fieldContainer}>
      {!!label && <Text style={uiStyles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}
