import type { Store } from "../../../entities/meeting";
import type { Screen } from "../../../shared/config/screens";
import type { Meeting } from "../../../entities/meeting";
import { Pressable, ScrollView, View } from "react-native";
import {
  meetingDate,
  meetingPlace,
  participantLabel,
} from "../../../entities/meeting";
import { Avatars, Row } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { Icon } from "../../../shared/ui/Icon";

import { Text, TextInput, useTheme, useThemedStyles } from "../../../shared/theme/index";
import {
  createStyles,
  getMeetingBadge,
  getSectionLabel,
} from "./MeetingsScreen.styles";

// Список встреч с поиском, вкладками статусов и переходом к созданию встречи.
/**
 * Показывает отфильтрованные встречи, поиск и вкладки активных и завершённых встреч.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function MeetingsScreen({
  controller,
}: {
  // Компонент получает только необходимые ему данные и обработчики.
  controller: {
    store: Store;
    setScreen: (screen: Screen) => void;
    meetingSection: "active" | "completed";
    setMeetingSection: (section: "active" | "completed") => void;
    search: string;
    setSearch: (value: string) => void;
    matchingMeetings: Meeting[];
    openMeeting: (id: string) => void;
  };
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();

  // Поиск и фильтрация выполняются в контроллере: matchingMeetings уже готов к показу.
  const {
    store,
    setScreen,
    meetingSection,
    setMeetingSection,
    search,
    setSearch,
    matchingMeetings,
    openMeeting,
  } = controller;
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Row style={styles.greetingRow}>
          <View>
            {/* Дата пока задана вручную, а первое слово имени берётся из профиля. */}
            <Text style={styles.dateLabel}>Пятница, 24 мая</Text>
            <Text style={styles.greeting}>
              Привет, {store.name.split(" ")[0]}
            </Text>
          </View>
          <Pressable
            onPress={() => setScreen("profile")}
            style={styles.profileButton}
          >
            <Text style={styles.avatarInitial}>{store.name[0]}</Text>
          </Pressable>
        </Row>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            // При вводе обновляем строку поиска в контроллере.
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по встречам"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
          />
        </View>
        <Row style={styles.sectionHeader}>
          <Row style={styles.tabsRow}>
            {/* Переключаем список между активными и завершёнными встречами. */}
            {(["active", "completed"] as const).map((section) => (
              <Pressable
                key={section}
                onPress={() => setMeetingSection(section)}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: meetingSection === section,
                }}
              >
                <Text
                  style={[
                    uiStyles.heading,
                    styles.tabLabel,
                    getSectionLabel(colors, meetingSection === section),
                  ]}
                >
                  {section === "active" ? "Активные встречи" : "Завершённые"}
                </Text>
              </Pressable>
            ))}
          </Row>
          <Text style={styles.count}>{matchingMeetings.length}</Text>
        </Row>
        {/* Каждая карточка открывает встречу по её id. key помогает React различать карточки. */}
        {matchingMeetings.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => openMeeting(m.id)}
            style={[uiStyles.card, styles.meetingCard]}
          >
            <Row>
              <Text style={[styles.badge, getMeetingBadge(colors, m.status)]}>
                {m.status === "voting"
                  ? "Идёт голосование"
                  : m.status === "selected"
                    ? "Выбрано место"
                    : m.status === "completed"
                      ? "Завершена"
                      : "Забронировано"}
              </Text>
              <Icon name="chevron" size={17} color={colors.textMuted} />
            </Row>
            <Text style={styles.meetingTitle}>{m.title}</Text>
            <Row style={styles.metadataRow}>
              <Row style={styles.dateRow}>
                <Icon name="clock" size={14} color={colors.textSecondary} />
                <Text style={styles.dateText}>
                  {meetingDate(m.date)}, {m.time}
                </Text>
              </Row>
              <Row style={styles.participantsRow}>
                <Icon name="users" size={15} color={colors.textSecondary} />
                <Text style={styles.participantsText}>
                  {participantLabel(m.participants.length)}
                </Text>
              </Row>
            </Row>
            {/* Название места выводим, только если ресторан уже выбран. */}
            {m.restaurantId && (
              <Text style={uiStyles.muted}>
                {meetingPlace(m).name}
                {m.bookedAt ? " · Бронь подтверждена" : ""}
              </Text>
            )}
            <Avatars names={m.participants} limit={3} />
          </Pressable>
        ))}
        {/* Текст пустого списка зависит от поиска и выбранной вкладки. */}
        {matchingMeetings.length === 0 && (
          <Text style={[uiStyles.muted, styles.emptyState]}>
            {search
              ? "Встречи не найдены"
              : meetingSection === "completed"
                ? "Завершённых встреч пока нет"
                : "Активных встреч пока нет"}
          </Text>
        )}
      </ScrollView>
      <Pressable
        accessibilityLabel="Создать встречу"
        // Переключаем экран на форму создания встречи.
        onPress={() => setScreen("new")}
        style={styles.fab}
      >
        <Icon name="plus" size={26} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}
