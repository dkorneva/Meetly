// createContext создаёт общий канал, через который компоненты получают тему.
import { createContext, type ReactNode } from "react";
import { darkColors, lightColors, type ThemeColors } from "./colors";

// Описываем, какие данные есть у темы:
// dark — включена ли тёмная тема; colors — её набор цветов.
export type Theme = { dark: boolean; colors: ThemeColors };
// Заранее создаём два готовых объекта темы.
const lightTheme: Theme = { dark: false, colors: lightColors };
const darkTheme: Theme = { dark: true, colors: darkColors };
// Создаём контекст с данными типа Theme.
// lightTheme — запасное значение для компонентов, над которыми нет провайдера.
// Если провайдер есть, компоненты получают его value вместо запасного значения.
export const ThemeContext = createContext<Theme>(lightTheme);

// Провайдер — компонент-обёртка, который делает тему доступной внутри себя.
// { dark, children } извлекает два свойства из переданного объекта props.
// После двоеточия указаны их типы, а не значения.
/**
 * Передаёт светлую или тёмную тему всем вложенным потребителям контекста.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function ThemeProvider({
  dark,
  children,
}: {
  dark: boolean;
  // children — всё, что написано между <ThemeProvider> и </ThemeProvider>.
  children: ReactNode;
}) {
  return (
    // Если dark равно true, передаём тёмную тему, иначе — светлую.
    // При изменении value React обновляет компоненты, читающие этот контекст.
    <ThemeContext.Provider value={dark ? darkTheme : lightTheme}>
      {/* Показываем вложенное содержимое. Оно и его потомки могут читать тему
          через useTheme(), без передачи цветов вручную через каждый компонент. */}
      {children}
    </ThemeContext.Provider>
  );
}
