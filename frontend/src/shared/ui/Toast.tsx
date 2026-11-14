import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, useThemedStyles } from "../theme/index";
import {
  createStyles,
  getToastEntrance,
  getToastIconColor,
  getToastProgress,
} from "./Toast.styles";
import { Icon } from "./Icon";
import type { ToastType } from "./Toast.types";

/**
 * Показывает анимированное уведомление и кнопку закрытия; время скрытия управляется снаружи.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function Toast({
  text,
  type,
  onDismiss,
}: {
  text: string;
  type: ToastType;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets(); // получение отступов безопасной зоны

  // useRef позволяет сохранять один и тот же объект анимации между перерисовками компонента
  const entrance = useRef(new Animated.Value(0)).current; // появление тоста, начальное значение
  const progress = useRef(new Animated.Value(1)).current; // прогресс-бар, конечное значение, 1 - полностью заполнен, 0 - пустой
  // Тип приходит через пропсы и определяет оформление. Сам текст больше не анализируется.
  const error = type === "error";
  const success = type === "success";
  const color = error
    ? colors.accent
    : success
      ? colors.success
      : colors.primary;
  // когда React добавит уведомление на экран, useEffect запустит анимации
  // когда уведомление будет убрано, остановит их
  useEffect(() => {
    // создание анимации появления тоста и прогресс-бара
    // изменяет значение Animated.Value от 0 до 1 за указанное время
    // useNativeDriver: true - использовать нативный драйвер анимации, что повышает производительность
    // тост постепенно становится видимым
    const enter = Animated.timing(entrance, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    // уменьшение прогресс-бара от 1 до 0 за 3500 мс, линейная анимация
    // данная анимация меняет ширину полоски — width
    // нативный драйвер Animated не поддерживает анимацию ширины, поэтому выставлен в false
    const timer = Animated.timing(progress, {
      toValue: 0,
      duration: 3500,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    // запуск анимаций
    enter.start();
    timer.start();
    return () => {
      // возвраащет не разметку, а функцию, которая будет вызвана при размонтировании компонента
      enter.stop();
      timer.stop();
    };
    // если entrance или progress заменились другими объектами, 
    // нужно очистить предыдущий эффект и запустить его заново
  }, [entrance, progress]);
  // Animated.View — контейнер React Native, у которого можно анимировать свойства
  // здесь анимируются прозрачность и положение уведомления
  return (
    <Animated.View
    // улучшение ux - работа с accessibility
      accessibilityLiveRegion="polite" // программа должна распознать сообщение как уведомление
      accessibilityRole="alert" // роль компонента - оповещение
      style={[
        styles.card,
        styles.cardBackground,
        getToastEntrance(insets.top, entrance, color),
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, getToastIconColor(color)]}>
          {success ? (
            <Icon name="check" size={16} color={colors.onPrimary} />
          ) : (
            <Text style={styles.symbol}>{error ? "!" : "i"}</Text>
          )}
        </View>
        <Text style={styles.text}>{text}</Text>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button" // обозначает кнопку для средств доступности
          accessibilityLabel="Закрыть уведомление" // текст, который будет озвучен при фокусе на кнопке
          hitSlop={10} // расширяет область нажатия вокруг крестика на 10 единиц, 
          // чтобы по маленькому значку было удобнее попасть
        >
          <Icon name="close" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressBar, getToastProgress(progress, color)]}
        />
      </View>
    </Animated.View>
  );
}
