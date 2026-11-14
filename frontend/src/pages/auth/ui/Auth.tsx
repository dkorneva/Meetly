import { Pressable, ScrollView, View } from "react-native";
import { useState } from "react";
import { Button, Field } from "../../../shared/ui/controls/index";
import { Icon } from "../../../shared/ui/Icon";
import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import { createStyles } from "./Auth.styles";
import { validateAuth } from "../model/validation";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false); // Показывать ли пароль открытым текстом.
  const [submitted, setSubmitted] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const errors = validateAuth({ register, name, email, password, confirmPassword });
  const error = submitted ? errors.name || errors.email || errors.password : "";
  const confirmationError = (submitted || confirmationTouched) ? errors.confirmPassword : "";
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
            placeholder={register ? "Не менее 6 символов" : "Введите пароль"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible} // Скрываем символы пароля, пока visible равно false.
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={register ? "new-password" : "current-password"}
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
        {register && (
          <>
            <Text style={styles.passwordHint}>
              Минимум 6 символов: строчная и заглавная латинские буквы, цифра и специальный символ.
            </Text>
            <Field
              label="Подтверждение пароля"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setConfirmationTouched(true);
              }}
              onBlur={() => setConfirmationTouched(true)}
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
            />
            {!!confirmationError && <Text style={styles.error}>{confirmationError}</Text>}
          </>
        )}
      </View>
      {/* Ошибка видна только тогда, когда её текст не пустой. */}
      {error.length > 0 && <Text style={styles.error}>{error}</Text>}
      <Button
        style={styles.submitButton}
        title={register ? "Создать аккаунт" : "Войти"}
        onPress={() => {
          setSubmitted(true);
          if (Object.values(errors).some(Boolean)) return;
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
