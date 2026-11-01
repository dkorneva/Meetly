import type { Store } from "../../../entities/meeting";
import type { DialogName } from "../../../shared/config/dialogs";
import type { ToastType } from "../../../shared/ui/Toast.types";
import type { Meeting } from "../../../entities/meeting";
import { Pressable, View } from "react-native";
import { useState } from "react";

import { openExternalLink } from "../../../shared/api/device";
import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import { Button, Row } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { Icon } from "../../../shared/ui/Icon";
import { createStyles, getMeetingSelection } from "./CalendarExportDialog.styles";

/**
 * Показывает настройки календаря; кнопка экспорта пока не выполняет действий.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function CalendarExportDialog({
  controller,
}: {
  controller: {
    store: Store;
    setDialog: (dialog: DialogName) => void;
    showToast: (type: ToastType, message: string) => void;
    meeting: Meeting;
    update: (patch: Partial<Store>) => void;
  };
}) {
  const { colors } = useTheme(); // получение цвета текущей темы
  const styles = useThemedStyles(createStyles); // создание стилей конкретного окна
  const uiStyles = useUiStyles(); // создание стилей общих компонентов

  const { store, setDialog, showToast, meeting, update } = controller;
  const [selectedId, setSelectedId] = useState(meeting.id); // идентификатор встречи, которую пользователь выбрал для экспорта в календарь
  const selected = store.meetings.find((item) => item.id === selectedId); // объект выбранной встречи
  return (
    <>
      <Text style={uiStyles.muted}>
        Выберите встречу и сохраните файл. В Яндекс Календаре откройте
        «Добавить» → «Импорт» → «Из файла» и выберите его. Проверьте дату и
        время перед импортом.
      </Text>
      {/* Внутри View элементы по умолчанию располагаются вертикально. */}
      <View style={styles.meetingList}>
        {store.meetings.map((item) => (
          <Pressable
            key={item.id} // уникальный идентификатор элемента списка, нужен для оптимизации React
            accessibilityRole="radio" // радиокнопка
            accessibilityState={{ checked: selectedId === item.id }} // состояние радиокнопки: выбрана или нет
            onPress={() => setSelectedId(item.id)}
            style={[
              uiStyles.card, // задаёт общее оформление карточки
              getMeetingSelection(colors, selectedId === item.id), // выбирает цвет рамки в зависимости от того, выбрана карточка или нет
            ]}
          >
            <Row style={styles.meetingRow}>
              <Icon
                name="calendar"
                color={
                  selectedId === item.id
                    ? colors.primaryText
                    : colors.textSecondary
                }
              />
              <View style={styles.meetingInfo}>
                <Text style={uiStyles.label}>{item.title}</Text>
                <Text style={uiStyles.muted}>
                  {item.date.split("-").reverse().join(".")} · {item.time}
                </Text>
              </View>
              {selectedId === item.id && (
                <Icon name="check" color={colors.primaryText} />
              )}
            </Row>
          </Pressable>
        ))}
      </View>
      <Button
        title={"Сохранить встречу\nдля Яндекс Календаря"}
        style={styles.exportButton}
        textStyle={styles.exportButtonLabel}
        disabled={!store.calendar || !selected}
        // Экспорт будет реализован позже; пока нажатие ничего не делает.
        onPress={() => {}}
      />
      <Button
        title="Открыть Яндекс Календарь"
        variant="outline"
        onPress={() =>
          openExternalLink("https://calendar.yandex.ru/").catch(() =>
            showToast("error", "Не удалось открыть Яндекс Календарь"),
          )
        }
      />
      <Button
        title={store.calendar ? "Выключить экспорт" : "Включить экспорт"}
        variant="outline"
        onPress={() => {
          update({ calendar: !store.calendar });
          setDialog(null);
        }}
      />
    </>
  );
}
