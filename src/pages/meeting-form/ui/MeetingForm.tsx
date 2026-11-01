import { Pressable, ScrollView, View } from "react-native";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import {
  Avatars,
  Button,
  Chip,
  Field,
  Row,
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
}: {
  meeting?: Meeting; // Знак ? означает, что свойство можно не передавать.
  onSave: (m: Meeting) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();

  // ?. читает свойство, если встреча есть; ?? подставляет значение, если его нет.
  // useState хранит изменения формы до нажатия кнопки сохранения.
  const [title, setTitle] = useState(meeting?.title ?? "Ужин с командой");
  const date = meeting
    ? new Date(meeting.date + "T12:00:00")
    : new Date(2026, 8, 25); // Начальная дата новой встречи; месяцы в Date считаются с нуля.
  const [month, setMonth] = useState(date.getMonth());
  const [year, setYear] = useState(date.getFullYear());
  const [day, setDay] = useState(date.getDate());
  const [participants, setParticipants] = useState(
    meeting?.participants ?? ["Аня", "Полина", "Маша", "Илья"],
  );
  const [inviteOpen, setInviteOpen] = useState(false); // Видно ли поле добавления участника.
  const [participant, setParticipant] = useState("");
  const [time, setTime] = useState(meeting?.time ?? "19:00");
  const [timeOpen, setTimeOpen] = useState(false); // Раскрыт ли выбор времени.
  const [budget, setBudget] = useState(meeting?.budget ?? 1500);
  const [cuisines, setCuisines] = useState(
    meeting?.cuisines ?? ["Итальянская", "Кофе"],
  );
  const [district, setDistrict] = useState(meeting?.district ?? "Центр");
  const [districtOpen, setDistrictOpen] = useState(false); // Раскрыт ли выбор района.
  const [format, setFormat] = useState(meeting?.format ?? "В помещении");
  const [error, setError] = useState("");
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
      <View style={[uiStyles.section, styles.titleSection]}>
        <Field label="Название встречи" value={title} onChangeText={setTitle} />
      </View>
      <View style={uiStyles.section}>
        <Text style={uiStyles.label}>Дата и время</Text>
        <Row>
          <Pressable
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
          <Pressable onPress={() => shift(1)} style={styles.nextMonthButton}>
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
                style={[styles.dayLabel, getDayLabel(colors, day === i + 1)]}
              >
                {i + 1}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => setTimeOpen(!timeOpen)}
          style={[uiStyles.card, styles.timePickerButton]}
        >
          <Row>
            <Row style={styles.timeRow}>
              <Icon name="clock" size={18} />
              <Text style={styles.timeLabel}>{time}</Text>
            </Row>
            <Icon name="chevron" size={18} color={colors.textSecondary} />
          </Row>
        </Pressable>
        {/* Варианты времени показываем после раскрытия списка. */}
        {timeOpen && (
          <View style={styles.wrap}>
            {[
              "09:00",
              "11:00",
              "13:00",
              "15:00",
              "17:00",
              "18:00",
              "19:00",
              "20:00",
              "21:00",
            ].map((t) => (
              <Chip
                key={t}
                label={t}
                selected={t === time}
                onPress={() => {
                  setTime(t);
                  setTimeOpen(false);
                }}
              />
            ))}
          </View>
        )}
      </View>
      <View style={uiStyles.section}>
        <Text style={uiStyles.label}>Участники</Text>
        <Row>
          <Avatars names={participants} />
          <Pressable onPress={() => setInviteOpen(!inviteOpen)}>
            <Row style={styles.inviteRow}>
              <Icon name="plus" color={colors.primaryText} size={18} />
              <Text style={styles.inviteLabel}>Пригласить</Text>
            </Row>
          </Pressable>
        </Row>
        {inviteOpen && (
          <>
            <Field
              placeholder="Имя участника"
              value={participant}
              onChangeText={setParticipant}
            />
            <Button
              title="Добавить"
              onPress={() => {
                const name = participant.trim();
                // Добавляем только непустое имя, которого ещё нет в списке.
                if (name && !participants.includes(name)) {
                  // Создаём новый массив, сохранив прежних участников.
                  setParticipants([...participants, name]);
                  setParticipant("");
                  setInviteOpen(false);
                }
              }}
            />
          </>
        )}
      </View>
      <View style={uiStyles.section}>
        <Row>
          <Text style={uiStyles.label}>Бюджет</Text>
          <Text style={styles.budgetLabel}>{budget} ₽ / чел.</Text>
        </Row>
        <Slider
          // Бюджет на человека: от 500 до 5000 с шагом 100.
          minimumValue={500}
          maximumValue={5000}
          step={100}
          value={budget}
          onValueChange={setBudget}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.selectedSurface}
          thumbTintColor={colors.primary}
          accessibilityLabel="Бюджет на человека"
        />
        <Row>
          <Text style={styles.hint}>500 ₽</Text>
          <Text style={styles.hint}>5000 ₽</Text>
        </Row>
      </View>
      <View style={uiStyles.section}>
        <Text style={uiStyles.label}>Кухня</Text>
        <View style={styles.wrap}>
          {[
            "Итальянская",
            "Японская",
            "Русская",
            "Кофе",
            "Бар",
            "Вегетарианская",
          ].map((t) => (
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
      <View style={uiStyles.section}>
        <Text style={uiStyles.label}>Район</Text>
        <Pressable
          style={uiStyles.card}
          onPress={() => setDistrictOpen(!districtOpen)}
        >
          <Row>
            <Text style={styles.districtLabel}>{district}</Text>
            <Icon name="chevron" color={colors.textSecondary} />
          </Row>
        </Pressable>
        {districtOpen && (
          <View style={styles.wrap}>
            {["Центр", "Арбат", "Тверской", "Патриаршие", "Не важно"].map(
              (t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={district === t}
                  onPress={() => {
                    setDistrict(t);
                    setDistrictOpen(false);
                  }}
                />
              ),
            )}
          </View>
        )}
      </View>
      <View style={[uiStyles.section, styles.formatSection]}>
        <Text style={uiStyles.label}>Формат</Text>
        <View style={styles.formatSelector}>
          {["В помещении", "На улице", "Не важно"].map((t) => (
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
      {error.length > 0 && <Text style={styles.error}>{error}</Text>}
      <Button
        title={meeting ? "Сохранить предпочтения" : "Создать встречу"}
        onPress={() => {
          // Не сохраняем встречу без названия.
          if (!title.trim()) {
            setError("Введите название встречи");
            return;
          }
          // Собираем объект встречи из полей и передаём его родителю для сохранения.
          onSave({
            // При редактировании оставляем id, для новой встречи создаём его из времени.
            id: meeting?.id ?? Date.now().toString(),
            title: title.trim(),
            // Формат YYYY-MM-DD: padStart дополняет месяц и день нулём до двух цифр.
            date: `${year}-${String(month + 1).padStart(2, "0")}-${String(
              day,
            ).padStart(2, "0")}`,
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
            district,
            format,
          });
        }}
      />
    </ScrollView>
  );
}
