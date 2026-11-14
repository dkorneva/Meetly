import { useCatalogFilters } from "../../../shared/api/useCatalogFilters";
import { Pressable, ScrollView, View } from "react-native";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import {
  validateMeetingForm,
} from "../model/validation";
import {
  Avatars,
  Button,
  Chip,
  Field,
  Row,
  Select,
} from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { Icon } from "../../../shared/ui/Icon";
import type { Meeting } from "../../../entities/meeting";
import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import {
  createStyles,
  getDayLabel,
  getFormatBackground,
  getFormatLabel,
  getSelectedDay,
} from "./MeetingForm.styles";

// Одна форма для создания и редактирования: если meeting передан, заполняем его данными.
/**
 * Собирает данные новой встречи или изменяет предпочтения существующей встречи.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function MeetingForm({
  meeting,
  onSave,
  preferencesOnly = false,
}: {
  meeting?: Meeting; // Знак ? означает, что свойство можно не передавать.
  onSave: (m: Meeting) => void;
  preferencesOnly?: boolean;
}) {
  const { colors } = useTheme();
  const { options, error: filtersError, retry } = useCatalogFilters();
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();

  // ?. читает свойство, если встреча есть; ?? подставляет значение, если его нет.
  // useState хранит изменения формы до нажатия кнопки сохранения.
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [date] = useState(() =>
    meeting ? new Date(meeting.date + "T12:00:00") : new Date(),
  );
  const [month, setMonth] = useState(date.getMonth());
  const [year, setYear] = useState(date.getFullYear());
  const [day, setDay] = useState(date.getDate());
  const [participants] = useState(meeting?.participants ?? []);
  const [time, setTime] = useState(meeting?.time ?? "19:00");
  const [budget, setBudget] = useState(meeting?.budget ?? 1500);
  const [cuisines, setCuisines] = useState(
    meeting?.cuisines ?? ["Итальянская", "Кофе"],
  );
  const [format, setFormat] = useState(meeting?.format ?? "В помещении");
  const [error, setError] = useState("");
  const cuisineOptions = [...new Set([...(options?.cuisines ?? []), ...cuisines])];
  const formatOptions = options?.formats ?? [];
  const maximumBudget = Math.max(options?.budget.max ?? 5000, budget);
  // Нулевой день следующего месяца — последний день текущего: получаем число дней.
  const days = new Date(year, month + 1, 0).getDate();
  // Число пустых ячеек перед первым днём; переводим неделю к началу с понедельника.
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  // Сдвигаем месяц на n; Date сам обрабатывает переход между годами.
  /**
   * Переключает месяц календаря с переходом между годами и выбирает первый день.
   *
   * @param n - Число месяцев для сдвига; отрицательное значение переключает назад.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function shift(n: number) {
    const date = new Date(year, month + n, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setDay(1); // Первый день есть в любом месяце.
  }
  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {filtersError ? <><Text accessibilityRole="alert">{filtersError}</Text><Button title="Повторить загрузку фильтров" onPress={retry} /></> : !options && <Text>Загрузка предпочтений…</Text>}
      {!preferencesOnly && (
        <>
          <View style={[uiStyles.section, styles.titleSection]}>
            <Field
              label="Название встречи"
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          <View style={uiStyles.section}>
            <Text style={uiStyles.label}>Дата и время</Text>
            <Row>
              <Pressable
                accessibilityLabel="Предыдущий месяц"
                onPress={() => shift(-1)}
                style={styles.previousMonthButton}
              >
                <Icon name="back" color={colors.textSecondary} size={18} />
              </Pressable>
              <Text style={styles.monthLabel}>
                {new Date(year, month).toLocaleDateString("ru-RU", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Pressable
                accessibilityLabel="Следующий месяц"
                onPress={() => shift(1)}
                style={styles.nextMonthButton}
              >
                <Icon name="chevron" color={colors.textSecondary} size={18} />
              </Pressable>
            </Row>
            <View style={styles.grid}>
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((w) => (
                <Text key={w} style={styles.week}>
                  {w}
                </Text>
              ))}
              {/* Пустые ячейки ставят первое число под правильным днём недели. */}
              {Array.from({ length: offset }, (_, i) => (
                <View key={"blank" + i} style={styles.day} />
              ))}
              {/* Создаём кнопку для каждого дня; индекс i начинается с нуля. */}
              {Array.from({ length: days }, (_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setDay(i + 1)}
                  style={[styles.day, day === i + 1 && getSelectedDay(colors)]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      getDayLabel(colors, day === i + 1),
                    ]}
                  >
                    {i + 1}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.timeSelectors}>
              <Select label="Часы" accessibilityLabel="Часы встречи" value={time.slice(0,2)} options={Array.from({length:24},(_,i)=>String(i).padStart(2,"0"))} onChange={hour=>setTime(current=>hour+current.slice(2))}/>
              <Text style={styles.timeSeparator}>:</Text>
              <Select label="Минуты" accessibilityLabel="Минуты встречи" value={time.slice(3)} options={Array.from({length:60},(_,i)=>String(i).padStart(2,"0"))} onChange={minute=>setTime(current=>current.slice(0,3)+minute)}/>
            </View>
          </View>
          <View style={uiStyles.section}>
            <Text style={uiStyles.label}>Участники</Text>
            <Row>
              <Avatars names={participants} />
            </Row>
            <Text style={styles.hint}>
              После создания встречи добавьте участников по email или отправьте
              приглашение.
            </Text>
          </View>
        </>
      )}
      <View style={uiStyles.section}>
        <Row>
          <Text style={uiStyles.label}>Бюджет</Text>
          <Text style={styles.budgetLabel}>{budget} ₽ / чел.</Text>
        </Row>
        <Slider
          // Верхняя граница покрывает весь текущий каталог и сохранённый бюджет.
          minimumValue={options?.budget.min ?? 500}
          maximumValue={maximumBudget}
          step={options?.budget.step ?? 100}
          value={budget}
          onValueChange={setBudget}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.selectedSurface}
          thumbTintColor={colors.primary}
          accessibilityLabel="Бюджет на человека"
        />
        <Row>
          <Text style={styles.hint}>{options?.budget.min ?? 500} ₽</Text>
          <Text style={styles.hint}>{maximumBudget} ₽</Text>
        </Row>
      </View>
      <View style={uiStyles.section}>
        <Text style={uiStyles.label}>Кухня</Text>
        <View style={styles.wrap}>
          {cuisineOptions.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={cuisines.includes(t)}
              onPress={() =>
                // Повторное нажатие убирает кухню из выбора, первое — добавляет.
                setCuisines((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                )
              }
            />
          ))}
        </View>
      </View>
      {!preferencesOnly && (
        <>
          <View style={[uiStyles.section, styles.formatSection]}>
            <Text style={uiStyles.label}>Формат</Text>
            <View style={styles.formatSelector}>
              {formatOptions.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setFormat(t)}
                  style={[
                    styles.formatOption,
                    getFormatBackground(colors, format === t),
                  ]}
                >
                  <Text
                    style={[
                      styles.formatOptionLabel,
                      getFormatLabel(colors, format === t),
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
      {error.length > 0 && <Text style={styles.error}>{error}</Text>}
      <Button
        title={meeting ? "Сохранить предпочтения" : "Создать встречу"}
        disabled={!options}
        onPress={() => {
          const selectedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const error = validateMeetingForm(
            {
              title,
              date: selectedDate,
              time,
              participants,
              budget,
              cuisines,
              format,
            },
            meeting,
            new Date(),
            cuisineOptions,
            formatOptions,
          );
          setError(error);
          if (error) return;
          // Собираем объект встречи из полей и передаём его родителю для сохранения.
          onSave({
            // При редактировании оставляем id, для новой встречи создаём его из времени.
            id: meeting?.id ?? Date.now().toString(),
            title: title.trim(),
            // Формат YYYY-MM-DD: padStart дополняет месяц и день нулём до двух цифр.
            date: selectedDate,
            time,
            participants,
            // Сохраняем прежний статус и результаты; новая встреча начинает с голосования.
            status: meeting?.status ?? "voting",
            restaurantId: meeting?.restaurantId,
            bookedAt: meeting?.bookedAt,
            completedAt: meeting?.completedAt,
            votes: meeting?.votes ?? {},
            budget,
            cuisines,
            format,
          });
        }}
      />
    </ScrollView>
  );
}
