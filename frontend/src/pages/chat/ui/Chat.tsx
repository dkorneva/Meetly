import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { reactionCount } from "../../../entities/meeting";
import { Avatars, Row } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { Icon } from "../../../shared/ui/Icon";
import { restaurants } from "../../../entities/meeting";
import type { Meeting, Message } from "../../../entities/meeting";
import { Text, TextInput, useTheme, useThemedStyles } from "../../../shared/theme/index";
import {
  createStyles,
  getMessageAlignment,
  getMessageBackground,
  getMessageMetaInset,
  getReactionInset,
} from "./Chat.styles";

// Экран чата: получает данные встречи и функции обработки действий от родителя.
/**
 * Показывает сообщения выбранной встречи, реакции и поле отправки текста.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function Chat({
  meeting,
  messages,
  leader,
  onLeader,
  onSend,
  onLike,
  onAttach,
}: {
  meeting: Meeting;
  messages: Message[];
  leader: string;
  // onLeader — нажатие на лидера голосования; onSend — отправка текста;
  // onLike — реакция на сообщение по его id; onAttach — выбор вложения.
  onLeader: () => void;
  onSend: (text: string) => void;
  onLike: (id: string) => void;
  onAttach: () => void;
}) {
  // Цвета текущей темы, стили чата и общие стили интерфейса.
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();

  const [text, setText] = useState(""); // Текст, который пользователь ещё не отправил.
  // Ссылка на область сообщений позволяет управлять прокруткой из кода.
  const scroll = useRef<import("react-native").ScrollView>(null);
  useEffect(() => {
    // Прокручиваем к последнему сообщению при открытии и изменении их количества.
    // ?. вызывает метод только тогда, когда ссылка уже указывает на компонент.
    scroll.current?.scrollToEnd({ animated: true });
  }, [messages.length]);
  /**
   * Отправляет непустой текст без пробелов по краям и очищает поле ввода.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function send() {
    // trim() убирает пробелы по краям. Пустые сообщения не отправляем.
    if (text.trim()) {
      onSend(text.trim());
      setText(""); // Очищаем поле после вызова обработчика отправки.
    }
  }
  return (
  // автоматически сдвигает, изменяет высоту или добавляет отступ (padding) своему содержимому, чтобы поля ввода не перекрывались виртуальной клавиатурой на экране   
    <KeyboardAvoidingView
      style={styles.root}
      // На iOS добавляем отступ при появлении клавиатуры.
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Карточка ресторана, который сейчас лидирует в голосовании. */}
      <Pressable onPress={onLeader} style={styles.leaderCard}>
        <Row>
          <View>
            <Text style={styles.leaderLabel}>ЛИДИРУЕТ</Text>
            <Text style={styles.leaderTitle}>
              {leader} ·{" "}
              {
                // Берём все голоса и считаем те, что отданы за ресторан-лидер.
                Object.values(meeting.votes).filter(
                  (v) => v === restaurants.find((r) => r.name === leader)?.id,
                ).length
              }{" "}
              голоса
            </Text>
          </View>
          <Icon name="chevron" color={colors.primaryText} />
        </Row>
      </Pressable>
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled" // Нажатия на обработанные элементы не скрывают клавиатуру.
      >
        <Text style={styles.dateBadge}>Сегодня</Text>
        {/* Для каждого сообщения выбираем вид: системное, выбор места или обычное.
            key={m.id} помогает React различать сообщения при обновлении списка. */}
        {messages.map((m) =>
          m.kind === "system" ? (
            <Text key={m.id} style={styles.systemMessage}>
              {m.text}
            </Text>
          ) : m.kind === "selected" ? (
            <View key={m.id} style={styles.confirmationCard}>
              <Row style={styles.confirmationRow}>
                <View style={styles.confirmationIcon}>
                  <Icon name="check" color={colors.onPrimary} size={18} />
                </View>
                <View>
                  <Text style={styles.confirmationTitle}>Место выбрано</Text>
                  <Text
                    style={[uiStyles.muted, styles.confirmationDescription]}
                  >
                    {m.text}
                  </Text>
                </View>
              </Row>
            </View>
          ) : (
            <View
              key={m.id}
              // mine показывает, наше ли сообщение; от этого зависит его расположение.
              style={[styles.messageContainer, getMessageAlignment(m.mine)]}
            >
              <Text style={[styles.messageMeta, getMessageMetaInset(m.mine)]}>
                {m.name}
                {m.name === "Аня" ? " · " : " "}
                {m.time}
              </Text>
              <Row style={styles.messageRow}>
                {/* Аватар показываем только у чужих сообщений. */}
                {!m.mine && <Avatars names={[m.name]} size={24} />}
                <Pressable
                  // Долгое нажатие вызывает обработчик реакции на это сообщение.
                  onLongPress={() => onLike(m.id)}
                  style={[
                    styles.messageBubble,
                    getMessageBackground(colors, m.mine),
                  ]}
                >
                  {/* Картинку показываем, только если вложение отмечено как изображение. */}
                  {m.attachment?.image && (
                    <Image
                      source={{ uri: m.attachment.uri }}
                      style={styles.attachment}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.messageText}>{m.text}</Text>
                </Pressable>
              </Row>
              {/* Если реакции есть, показываем сердечко и их количество. */}
              {reactionCount(m) > 0 && (
                <Pressable
                  onPress={() => onLike(m.id)}
                  accessibilityLabel="Реакция на сообщение"
                  style={[styles.reactionBadge, getReactionInset(m.mine)]}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24">
                    <Path
                      d="M12 21l-8.5-8.4C-2 7.1 5.4-1 12 5.2 18.6-1 26 7.1 20.5 12.6Z"
                      fill={colors.dangerText}
                    />
                  </Svg>
                  <Text style={styles.reactionCount}>{reactionCount(m)}</Text>
                </Pressable>
              )}
            </View>
          ),
        )}
      </ScrollView>
      {/* Панель ввода: прикрепление файла, текст сообщения и кнопка отправки. */}
      <Row style={styles.composer}>
        <Pressable onPress={onAttach} accessibilityLabel="Прикрепить файл">
          <Icon name="clip" />
        </Pressable>
        <TextInput
          // Значение поля хранится в text, а ввод пользователя обновляет его через setText.
          value={text}
          onChangeText={setText}
          placeholder="Сообщение"
          placeholderTextColor={colors.placeholder}
          style={styles.messageInput}
          onSubmitEditing={send} // Отправка клавишей на экранной клавиатуре.
          returnKeyType="send"
        />
        <Pressable
          onPress={send}
          accessibilityLabel="Отправить сообщение"
          style={styles.sendButton}
        >
          <Icon name="send" color={colors.onPrimary} />
        </Pressable>
      </Row>
    </KeyboardAvoidingView>
  );
}
