// render отрисовывает компонент в тесте, fireEvent имитирует действия пользователя.
import { render, fireEvent } from "@testing-library/react-native";
// Проверяем настоящий App; вложенный AppContent отрисовывается вместе с ним.
import App from "../App";
import { useAppController } from "../src/app/model/useAppController";
// Screen ограничивает названия экранов допустимыми значениями.
import type { Screen } from "../src/shared/config/screens";
// makeController создаёт тестовые данные и подставные обработчики.
// Переданный объект заменяет отдельные значения, например текущий экран.
import { makeController } from "./fixtures";

// Заменяем настоящий хук подставной функцией: каждый тест сам задаст её результат.
// jest.fn() также запоминает вызовы функции и переданные аргументы.
jest.mock("../src/app/model/useAppController", () => ({ useAppController: jest.fn() }));

// Контроллер подменён: здесь проверяются выбор экрана и передача действий.
describe("App и AppContent", () => {
  // test описывает одну проверку
  test("показывает логотип до загрузки данных", async () => {
    // jest.mocked сообщает TypeScript, что хук подменён; mockReturnValue задаёт его результат.
    // loaded: false означает, что приложение ещё ждёт загрузки данных.
    jest.mocked(useAppController).mockReturnValue(makeController({ loaded: false }));
    // Ждём отрисовки App. Через ui можно искать элементы в полученном интерфейсе.
    const ui = await render(<App />);
    // expect начинает проверку. getByText ищет текст и выдаёт ошибку, если его нет.
    // toBeOnTheScreen проверяет, что найденный элемент присутствует на экране.
    expect(ui.getByText("Meetly.")).toBeOnTheScreen();
    // queryByText возвращает null, если текста нет: список встреч пока не должен появиться.
    expect(ui.queryByText("Активные встречи")).toBeNull();
  });

  // test.each запускает отдельный тест для каждой строки таблицы ниже.
  // [Screen, RegExp] — тип пары: название экрана и регулярное выражение для поиска текста.
  // Например, /Соберите всех/ ищет текст, содержащий эти слова.
  test.each<[Screen, RegExp]>([
    ["intro", /Соберите всех/], ["login", /Войти в аккаунт/],
    ["register", /Создать аккаунт/], ["meetings", /Активные встречи/],
    ["detail", /Варианты мест/], ["new", /Создать встречу/],
    ["edit", /Сохранить предпочтения/], ["map", /Рестораны рядом/],
    ["chat", /ЛИДИРУЕТ/], ["profile", /ПОДКЛЮЧЕНИЯ/],
  ])("показывает экран %s", async (screen, marker) => {
    // %s в названии теста заменится названием экрана.
    // screen и marker берутся из текущей строки таблицы.
    // { screen } — сокращение для { screen: screen }.
    jest.mocked(useAppController).mockReturnValue(makeController({ screen }));
    const ui = await render(<App />);
    // На карте нужная надпись — подсказка в поле ввода, поэтому ищем по placeholder.
    if (screen === "map") expect(ui.getByPlaceholderText(marker)).toBeOnTheScreen();
    // На других экранах ищем обычный текст. getAllByText возвращает массив элементов;
    // проверяем, что его длина больше нуля — найден хотя бы один элемент.
    else expect(ui.getAllByText(marker).length).toBeGreaterThan(0);
  });

  test("после знакомства сохраняет флаг и открывает регистрацию", async () => {
    // Сохраняем контроллер в c, чтобы после нажатия проверить вызовы его обработчиков.
    const c = makeController({ screen: "intro" });
    jest.mocked(useAppController).mockReturnValue(c);
    const ui = await render(<App />);
    // Находим кнопку по тексту и имитируем нажатие на неё.
    await fireEvent.press(ui.getByText("Пропустить"));
    // Проверяем, что update вызван с флагом «знакомство с приложением пройдено».
    expect(c.update).toHaveBeenCalledWith({ onboarded: true });
    // Проверяем, что setScreen вызван с названием экрана регистрации.
    // Обработчики подставные: здесь проверяются их вызовы, а не реальное сохранение
    // данных или появление следующего экрана.
    expect(c.setScreen).toHaveBeenCalledWith("register");
  });
});
