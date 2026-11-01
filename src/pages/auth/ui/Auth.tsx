import { Pressable, ScrollView, View } from "react-native";
import { useState } from "react";
import { Button, Field } from "../../../shared/ui/controls/index";
import { Icon } from "../../../shared/ui/Icon";
import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import { createStyles } from "./Auth.styles";

// Общая форма входа и регистрации. register выбирает режим формы.
// onSwitch переключает режим, onBack возвращает назад, onEnter передаёт данные родителю.
/**
 * Показывает форму входа или регистрации и проверяет заполнение полей перед вызовом onEnter.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function Auth({
  register,
  onSwitch,
  onBack,
  onEnter,
}: {
  register: boolean;
  onSwitch: () => void;
  onBack: () => void;
  onEnter: (name: string, email: string) => void;
}) {
  // Получаем цвета и стили для текущей темы.
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Состояния хранят введённые данные; функции set... обновляют их при вводе.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false); // Показывать ли пароль открытым текстом.
  const [error, setError] = useState(""); // Сообщение о неверно заполненной форме.
  return (
    <ScrollView
      contentContainerStyle={styles.root}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Icon name="back" size={18} color={colors.textSecondary} />
        <Text style={styles.backLabel}>Назад</Text>
      </Pressable>
      <Text style={styles.logo}>
        Meetly<Text style={styles.logoAccent}>.</Text>
      </Text>
      <Text style={styles.title}>
        {register ? "Создать аккаунт" : "Войти в аккаунт"}
      </Text>
      <Text style={styles.subtitle}>
        {register
          ? "Один аккаунт — все встречи, участники и предпочтения в одном месте."
          : "Продолжите планировать встречи без потери переписок."}
      </Text>
      <View style={styles.fields}>
        {/* Поле имени нужно только при регистрации. */}
        {register && (
          <Field
            label="Имя"
            placeholder="Как к вам обращаться"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
        )}
        <Field
          label="Электронная почта"
          placeholder="name@example.ru"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <View style={styles.passwordContainer}>
          <Field
            label="Пароль"
            placeholder={register ? "Не менее 8 символов" : "Введите пароль"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible} // Скрываем символы пароля, пока visible равно false.
            autoCapitalize="none"
            style={styles.passwordInput}
          />
          <Pressable
            onPress={() => setVisible(!visible)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleLabel}>
              {visible ? "Скрыть" : "Показать"}
            </Text>
          </Pressable>
        </View>
      </View>
      {/* Ошибка видна только тогда, когда её текст не пустой. */}
      {error.length > 0 && <Text style={styles.error}>{error}</Text>}
      <Button
        style={styles.submitButton}
        title={register ? "Создать аккаунт" : "Войти"}
        onPress={() => {
          // Проверяем поля по очереди; return прекращает обработку при ошибке.
          if (register && !name.trim()) {
            setError("Укажите имя");
            return;
          }
// ^       — начало строки
// [^\s@]+ — один или больше символов, кроме пробельных символов и @
// @       — обязательный символ @
// [^\s@]+ — один или больше символов, кроме пробельных символов и @
// \.      — обязательная точка (обратный слеш делает её обычной точкой)
// [^\s@]+ — один или больше символов, кроме пробельных символов и @
// $       — конец строки
// .test(email) — проверяет, соответствует ли email этому выражению
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Введите корректную электронную почту");
            return;
          }
          if (password.length < 8) {
            setError("Пароль должен содержать не менее 8 символов");
            return;
          }
          // Передаём данные родителю. Проверки пароля на сервере здесь нет:
          // в режиме входа пока используется демонстрационное имя «Аня».
          onEnter(register ? name.trim() : "Аня", email.trim());
        }}
      />
      <Pressable onPress={onSwitch} style={styles.switchButton}>
        <Text style={styles.switchLabel}>
          {register ? "Уже есть аккаунт? " : "Нет аккаунта? "}
          <Text style={styles.switchLink}>
            {register ? "Войти" : "Зарегистрироваться"}
          </Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
