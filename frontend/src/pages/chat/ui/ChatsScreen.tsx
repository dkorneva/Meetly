import { useState } from "react";
import { Pressable, ScrollView, View, StyleSheet } from "react-native";
import type { Meeting } from "../../../entities/meeting";
import { Text, TextInput, useTheme, useThemedStyles, type ThemeColors } from "../../../shared/theme";
import { Icon } from "../../../shared/ui/Icon";

/** Форматирует время сообщения. */
function messageTime(value?: string) {
  if (!value) return "";
  const date = new Date(value), today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

/** Показывает список переписок встреч. */
export default function ChatsScreen({ meetings, userId, onOpen }: {
  meetings: Meeting[]; userId?: string; onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const styles = useThemedStyles(createStyles), { colors } = useTheme();
  const items = meetings.filter(m => m.title.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU")))
    .sort((a, b) => (b.lastMessage?.createdAt ?? b.updatedAt ?? b.date).localeCompare(a.lastMessage?.createdAt ?? a.updatedAt ?? a.date));
  return <View style={styles.root}>
    <Text style={styles.heading}>Чаты</Text>
    <View style={styles.search}>
      <Icon name="search" size={19} color={colors.textMuted} />
      <TextInput value={query} onChangeText={setQuery} placeholder="Поиск чатов" accessibilityLabel="Поиск чатов"
        placeholderTextColor={colors.placeholder} style={styles.input} />
    </View>
    <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      {items.map(meeting => {
        const last = meeting.lastMessage;
        const author = last && last.kind === "text" ? `${last.senderId === userId ? "Вы" : last.name}: ` : "";
        return <Pressable key={meeting.id} accessibilityRole="button" accessibilityLabel={`Открыть чат ${meeting.title}`}
          onPress={() => onOpen(meeting.id)} style={styles.row}>
          <View style={styles.avatar}><Icon name="users" size={25} color={colors.primaryText} /></View>
          <View style={styles.summary}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={styles.title}>{meeting.title}</Text>
              <Text style={styles.time}>{messageTime(last?.createdAt)}</Text>
            </View>
            <Text numberOfLines={1} style={styles.preview}>
              {author && <Text style={styles.author}>{author}</Text>}
              {last?.kind === "selected" || (last?.kind === "system" && last.text === "Организатор подтвердил бронирование после связи с заведением") ? "Место выбрано" : last?.text || "Начните обсуждение встречи"}
            </Text>
          </View>
        </Pressable>;
      })}
      {!items.length && <View style={styles.empty}>
        <Icon name="chat" size={36} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{query ? "Чаты не найдены" : "Здесь будут чаты встреч"}</Text>
        <Text style={styles.emptyText}>{query ? "Попробуйте другое название" : "Создайте встречу, чтобы начать общение"}</Text>
      </View>}
    </ScrollView>
  </View>;
}

/** Создаёт стили для текущей темы. */
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1 }, heading: { fontSize: 26, fontWeight: "600", color: colors.text, padding: 20, paddingBottom: 16 },
  search: { marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 14, height: 44, gap: 10,
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised, borderRadius: 14 },
  input: { flex: 1, fontSize: 15, color: colors.text, height: "100%", paddingVertical: 0 },
  list: { paddingBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15, paddingHorizontal: 20 },
  avatar: { width: 52, height: 52, borderRadius: 19, backgroundColor: colors.selectedSurface, alignItems: "center", justifyContent: "center" },
  summary: { flex: 1, minWidth: 0, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 15, marginBottom: -15 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 }, title: { flex: 1, color: colors.text, fontWeight: "600", fontSize: 16 },
  time: { fontSize: 11, color: colors.textMuted }, preview: { fontSize: 13, color: colors.textSecondary, marginTop: 7, lineHeight: 19 },
  author: { color: colors.primaryText }, empty: { alignItems: "center", padding: 32, gap: 12, marginTop: 50 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.text }, emptyText: { color: colors.textSecondary, textAlign: "center", lineHeight: 21 },
});
