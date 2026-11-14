import type { Store } from "../../../entities/meeting";
import type { DialogName } from "../../../shared/config/dialogs";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Row, Toggle } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { Icon } from "../../../shared/ui/Icon";

import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import {
  createStyles,
  getCalendarStatus,
  getSettingDivider,
} from "./ProfileScreen.styles";

// Профиль пользователя, настройки оформления и переход к настройкам календаря.
/**
 * Показывает профиль и передаёт изменения настроек и запрос выхода родителю.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function ProfileScreen({
  controller,
}: {
  // Компонент получает только необходимые ему данные и обработчики.
  controller: {
    signOut: () => void;
    store: Store;
    setDialog: (dialog: DialogName) => void;
    setEditName: (value: string) => void;
    setEditEmail: (value: string) => void;
    update: (patch: Partial<Store>) => void;
  };
}) {
  // Стили экрана и общие стили используют цвета текущей темы.
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();

  const { signOut, store, setDialog, setEditName, setEditEmail, update } =
    controller;
  return (
    <ScrollView>
      <View style={styles.profileHeader}>
        <Pressable
          onPress={() => {
            // Заполняем поля текущими данными до открытия окна редактирования.
            setEditName(store.name);
            setEditEmail(store.email);
            setDialog("profile");
          }}
          style={styles.avatarButton}
        >
          {/* Если фото нет, вместо него показываем первую букву имени. */}
          {store.avatar ? (
            <Image source={{ uri: store.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{store.name[0]}</Text>
          )}
          <View style={styles.editBadge}>
            <Icon name="plus" size={15} color={colors.onPrimary} />
          </View>
        </Pressable>
        <Text style={styles.profileName}>{store.name}</Text>
        <Text style={styles.profileEmail}>{store.email}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>ПОДКЛЮЧЕНИЯ</Text>
        {/* Показываем сохранённый переключатель календаря; сам экспорт пока не реализован. */}
        <View style={[uiStyles.card, styles.calendarCard]}>
          <Row style={styles.calendarRow}>
            <View style={styles.settingIcon}>
              <Text style={styles.calendarIconLabel}>31</Text>
            </View>
            <View style={styles.calendarInfo}>
              <Text style={styles.settingTitle}>Яндекс Календарь</Text>
              <Text
                style={[
                  styles.calendarStatus,
                  getCalendarStatus(colors, store.calendar),
                ]}
              >
                {store.calendar ? "Экспорт включён" : "Экспорт выключен"}
              </Text>
            </View>
            <Pressable onPress={() => setDialog("calendar")}>
              <Text style={styles.configureLink}>Настроить</Text>
            </Pressable>
          </Row>
        </View>
        <Text style={styles.sectionLabel}>НАСТРОЙКИ</Text>
        <View style={[uiStyles.card, styles.settingsCard]}>
          {/* Описываем настройки массивом и создаём одинаковые строки через map.
              update передаёт новое значение выбранной настройки в хранилище. */}
          {(
            [
              {
                icon: "bell",
                title: "Напоминания",
                sub: "Уведомления о встречах",
                value: store.reminders,
                onChange: (v: boolean) => update({ reminders: v }),
              },
              {
                icon: "moon",
                title: "Тёмная тема",
                sub: "Тёмное оформление",
                value: store.dark,
                onChange: (v: boolean) => update({ dark: v }),
              },
            ] as const // Сохраняем точные типы значений, например имён иконок.
          ).map((item, i) => (
            <Row
              key={item.title}
              style={[styles.settingRow, getSettingDivider(i)]}
            >
              <View style={styles.settingIcon}>
                <Icon name={item.icon} color={colors.primaryText} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{item.title}</Text>
                <Text style={styles.settingDescription}>{item.sub}</Text>
              </View>
              <Toggle
                value={item.value}
                onValueChange={item.onChange}
                accessibilityLabel={item.title}
              />
            </Row>
          ))}
        </View>
        {/* Сам выход выполняет родитель через переданную функцию signOut. */}
        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Icon name="exit" color={colors.accentText} />
          <Text style={styles.signOutLabel}>Выйти из аккаунта</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
