import { validateAuth } from "../../src/pages/auth/model/validation";

const valid = { register: true, name: "Маша", email: "mail@example.ru", password: "Qw1!er", confirmPassword: "Qw1!er" };

describe("Имя при регистрации", () => {
  test.each([
    ["", false], ["И", false], ["Ия", true],
    ["И".repeat(30), true], ["И".repeat(31), false],
    ["Анна-Мария", true], ["Иван Иванов", true], ["Ёлка", true], ["John", true],
    [" Иван", false], ["Иван ", false], ["   ", false],
    ["Иван3", false], ["Иван!", false], ["Иван\tИванов", false],
    ["--", true], // Точное поведение регулярного выражения MedClinic.
  ])("имя %s: допустимость %s", (name, accepted) => {
    expect(validateAuth({ ...valid, name }).name === "").toBe(accepted);
  });
});

describe("Пароль при регистрации", () => {
  test.each([
    ["", false], ["Qw1!e", false], ["Qw1!er", true],
    ["qwerty1!", false], ["QWERTY1!", false], ["Qwerty!", false], ["Qwerty1", false],
    ["Qw1 er", true], ["Qw1яer", true], // MedClinic допускает пробел и кириллицу как спецсимвол.
  ])("пароль %s: допустимость %s", (password, accepted) => {
    expect(validateAuth({ ...valid, password, confirmPassword: password }).password === "").toBe(accepted);
  });
});

describe("Электронная почта", () => {
  test.each([true, false])("проверяет почту в режиме регистрации: %s", (register) => {
    for (const email of ["", "непочта", "a@@example.ru", "a..b@example.ru", "a@example.r", " a@example.ru"]) {
      expect(validateAuth({ ...valid, register, email }).email).not.toBe("");
    }
    expect(validateAuth({ ...valid, register }).email).toBe("");
  });
});
