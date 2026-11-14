// forwardRef позволяет передать ref через нашу обёртку внутреннему компоненту.
// Например, через ref можно вызвать focus() у поля ввода.
import { forwardRef } from "react";
// Все экспорты react-native доступны под именем Native.
// Так мы различаем стандартный Native.Text и наш собственный Text.
import * as Native from "react-native";
// Наш хук получает текущую тему приложения: в том числе её набор цветов.
import { useTheme } from "./useTheme";

// Общие настройки текста. Создаются один раз при загрузке этого файла.
const typography = Native.StyleSheet.create({
  // Inter — шрифт, 14 — размер текста.
  // includeFontPadding: false убирает дополнительные отступы шрифта
  // сверху и снизу на Android, чтобы текст было проще выравнивать.
  body: { fontFamily: "Inter", fontSize: 14, includeFontPadding: false },
});


// <Native.Text, Native.TextProps> — типы TypeScript:
// первый описывает объект, доступный через ref, второй — допустимые свойства.
// props — переданные свойства (например, children, style, numberOfLines).
// ref — ссылка, которую родитель может получить на внутренний Native.Text.
/**
 * Показывает текст с Inter и цветом темы; переданный style имеет приоритет.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @param ref - Значение ref, используемое для вычисления результата.
 * @returns Элементы интерфейса React.
 */
export const Text = forwardRef<Native.Text, Native.TextProps>((props, ref) => {
  // Из объекта текущей темы берём только colors.
  // При смене темы компонент получит новые цвета и обновится.
  const { colors } = useTheme();
  return (
    <Native.Text
      // Передаём все полученные свойства стандартному компоненту.
      // В том числе children — содержимое между <Text> и </Text>.
      {...props}
      // Передаём ссылку родителя внутреннему компоненту.
      ref={ref}
      // Стили применяются слева направо. Если свойство повторяется,
      // значение справа имеет приоритет: общие настройки → цвет темы → props.style.
      style={[typography.body, { color: colors.text }, props.style]}
    />
  );
});


// Здесь ref ссылается на Native.TextInput, а свойства имеют тип TextInputProps.
/**
 * Показывает поле ввода с цветами темы и передаёт ref внутреннему полю.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @param ref - Значение ref, используемое для вычисления результата.
 * @returns Элементы интерфейса React.
 */
export const TextInput = forwardRef<Native.TextInput, Native.TextInputProps>(
  (props, ref) => {
    const { colors } = useTheme();
    return (
      <Native.TextInput
        // Цвет подсказки, видимой, пока поле пустое.
        placeholderTextColor={colors.placeholder}
        // Цвет выделения текста; на поддерживаемых платформах — также курсора.
        selectionColor={colors.primaryText}
        // Передаём свойства, например value, onChangeText, placeholder.
        // Они идут ПОСЛЕ цветов выше, поэтому позволяют заменить эти цвета.
        {...props}
        // Через эту ссылку родитель может, например, вызвать focus() или blur().
        ref={ref}
        // Как и у Text, явно переданный style имеет приоритет над стилями темы.
        style={[typography.body, { color: colors.text }, props.style]}
      />
    );
  },
);
