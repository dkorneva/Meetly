const namePattern = /^[A-Za-zА-Яа-яЁё-](?:[A-Za-zА-Яа-яЁё -]*[A-Za-zА-Яа-яЁё-])?$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])[\s\S]+$/;
// Формат email соответствует проверке Ant Design в MedClinic.
const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/;

type AuthValues = {
  register: boolean;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Проверяет поля регистрации или входа по правилам MedClinic, не изменяя ввод.
 * @param values - Режим формы и введённые значения.
 * @returns Сообщения для невалидных полей; пустая строка означает отсутствие ошибки.
 */
export function validateAuth(values: AuthValues) {
  const { register, name, email, password, confirmPassword } = values;
  let nameError = "";
  if (register) {
    if (!name) nameError = "Укажите имя";
    else if (name.length < 2 || name.length > 30)
      nameError = "Имя должно содержать от 2 до 30 символов";
    else if (!namePattern.test(name))
      nameError = "Допустимы буквы, пробел и дефис; пробелы по краям запрещены";
  }

  let emailError = "";
  if (!email) emailError = "Введите электронную почту";
  else if (email.length > 320 || !emailPattern.test(email))
    emailError = "Введите корректную электронную почту";

  let passwordError = "";
  if (!password) passwordError = "Введите пароль";
  else if (register && password.length < 6)
    passwordError = "Пароль должен содержать минимум 6 символов";
  else if (register && !passwordPattern.test(password))
    passwordError = "Пароль должен содержать строчную и заглавную латинские буквы, цифру и специальный символ";

  let confirmationError = "";
  if (register) {
    if (!confirmPassword) confirmationError = "Подтвердите пароль";
    else if (password !== confirmPassword) confirmationError = "Пароли не совпадают";
  }
  return { name: nameError, email: emailError, password: passwordError, confirmPassword: confirmationError };
}
