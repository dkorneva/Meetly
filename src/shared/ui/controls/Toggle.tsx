import { Pressable, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/index";
import { createStyles, getSwitchTrack, getSwitchThumb } from "./Toggle.styles";

/**
 * Показывает управляемый переключатель и передаёт родителю противоположное значение.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="switch" // сообщает, что элемент является переключателем
      accessibilityState={{ checked: value }} // сообщает, что элемент находится в состоянии "включено" или "выключено"
      accessibilityLabel={accessibilityLabel} // передаёт понятное название, например «Тёмная тема», название приходит от родительского компонента (экран, в данном случае ProfileScreen)
      onPress={() => onValueChange(!value)}
      style={[styles.switchTrack, getSwitchTrack(colors, value)]} 
      // styles.switchTrack задаёт то, что не зависит от включения
      // getSwitchTrack(colors, value) возвращает цвет фона в зависимости от состояния value (включено/выключено)
    >
      {/* styles.switchThumb задаёт постоянное оформление кружка тумблера.
          getSwitchThumb(value) определяет, где кружок должен стоять (flex-start или flex-end)
          в зависимости от состояния value (включено/выключено). */}
      <View style={[styles.switchThumb, getSwitchThumb(value)]} />
    </Pressable>
  );
}
