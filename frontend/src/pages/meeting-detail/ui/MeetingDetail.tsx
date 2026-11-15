import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native";
import { Avatars, Button, Row } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { Icon } from "../../../shared/ui/Icon";
import PlacePhoto from "../../../shared/ui/PlacePhoto";
import type { Meeting, Restaurant } from "../../../entities/meeting";
import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import {
  createStyles,
  getVotingProgress,
} from "./MeetingDetail.styles";

// Карточка одного ресторана. restaurant: r даёт свойству короткое имя внутри функции.
/**
 * Показывает сведения об одном ресторане и кнопку передачи голоса родителю.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function RestaurantCard({
  restaurant: r,
  onVote,
  voted,
  disabled,
  onOpen,
  onRemove,
}: {
  restaurant: Restaurant;
  onVote: () => void;
  voted: boolean;
  disabled?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();

  return (
    <Pressable
      style={styles.restaurant}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Показать ${r.name} на карте`}
    >
      <View>
        <PlacePhoto
          id={r.id}
          name={r.name}
          image={r.image}
          style={styles.restaurantImage}
        />
        {onRemove && <Pressable
          accessibilityRole="button" accessibilityLabel={`Убрать ${r.name} из голосования`}
          hitSlop={6} style={styles.removeRestaurant}
          onPress={event => { event.stopPropagation(); onRemove(); }}>
          <Icon name="close" size={18} />
        </Pressable>}
      </View>
      <View style={styles.restaurantInfo}>
        <Row>
          <Text style={styles.restaurantName}>{r.name}</Text>
          {!!r.rating && <Text style={styles.rating}>☆ {r.rating}</Text>}
        </Row>
        <Text style={uiStyles.muted}>
          {r.cuisineLabel ?? r.cuisine}
        </Text>
        <Row style={styles.priceRow}>
          <View>
            <Text style={styles.price}>
              {`${r.price.toLocaleString("ru-RU")} ₽`}
            </Text>
            <Text style={styles.priceHint}>средний чек</Text>
            {!!r.priceSource && <Pressable accessibilityRole="link" accessibilityLabel={`Источник среднего чека ${r.name}`} onPress={event => {event.stopPropagation();void Linking.openURL(r.priceSource!);}}>
            </Pressable>}
          </View>
          <Button
            title={voted ? "Ваш голос" : "Голосовать"}
            stopPropagation
            disabled={disabled}
            textStyle={styles.voteButtonLabel}
            onPress={onVote}
            style={styles.voteButton}
          />
        </Row>
      </View>
    </Pressable>
  );
}
// Подробности встречи: участники, варианты мест и результаты голосования.
// Обработчики on... передают действия пользователя родителю.
/**
 * Показывает участников, варианты ресторанов и результаты голосования встречи.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function MeetingDetail({
  meeting: m, // Внутри компонента обращаемся к встрече через короткое имя m.
  onVote,
  onEdit,
  onManage,
  onChat,
  onBook,
  discoveryBusy,
  discoveryError,
  onMap,
  currentUserId,
  onRemoveCandidate,
}: {
  meeting: Meeting;
  onVote: (id: string) => void;
  onEdit: () => void;
  onManage: () => void;
  onChat: () => void;
  onBook: () => void;
  onRecommend?: () => void;
  discoveryBusy?: boolean;
  discoveryError?: string;
  onMap?: (restaurant?: Restaurant) => void;
  currentUserId?: string;
  onRemoveCandidate?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const uiStyles = useUiStyles();
  const restaurants = m.candidates ?? [];

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.meetingHeader}>
        <Text style={styles.meetingStatus}>
          {/* Преобразуем дату в русскую подпись с днём недели и названием месяца. */}
          {new Date(m.date + "T12:00:00").toLocaleDateString("ru-RU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
        <Text style={styles.meetingTitle}>{m.title}</Text>
        <Row style={styles.dateRow}>
          <Icon name="clock" size={15} color={colors.textSecondary} />
          <Text style={uiStyles.muted}>
            {m.time}, {m.city ?? "Москва"}
          </Text>
        </Row>
      </View>
      <View style={styles.content}>
        <Row style={styles.participantsHeader}>
          <Text style={uiStyles.heading}>Участники</Text>
          <Pressable onPress={onManage}>
            <Text style={styles.manageParticipantsLink}>Управлять</Text>
          </Pressable>
        </Row>
        <Row>
          <Avatars names={m.participants} limit={5} />
          <Text style={styles.participantsCount}>
            {/* votes хранит голоса по именам; число ключей — число проголосовавших. */}
            {Object.keys(m.votes).length} из {m.participants.length}{" "}
            проголосовали
          </Text>
        </Row>
        <View style={[uiStyles.card, styles.preferencesCard]}>
          <Row>
            <Text style={styles.preferencesLabel}>ВАШИ ПРЕДПОЧТЕНИЯ</Text>
            <Button
              title="Изменить"
              textStyle={styles.editPreferencesButtonLabel}
              onPress={onEdit}
              variant="outline"
              style={styles.editPreferencesButton}
            />
          </Row>
        </View>
        <View style={styles.divider} />
        <Row>
          <Text style={uiStyles.heading}>Варианты мест</Text>
          <Text style={styles.count}>{restaurants.length}</Text>
        </Row>
        <Text style={styles.placesHint}>
          Места по предпочтениям вашей компании
        </Text>
        {m.status === "voting" && !!m.unavailableCandidateCount && <Text style={uiStyles.muted}>
          Места без актуальной проверки скрыты. Если вы голосовали за такое место, выберите другой вариант.
        </Text>}
        {discoveryBusy && (
          <ActivityIndicator accessibilityLabel="Подбираем заведения" />
        )}
        {!!discoveryError && (
          <Text style={uiStyles.muted}>{discoveryError}</Text>
        )}
        
        {/* Показываем варианты из каталога; при голосовании передаём id ресторана. */}
        {restaurants.map((r) => (
          <RestaurantCard
            key={r.id}
            restaurant={r}
            onOpen={() => onMap?.(r)}
            onRemove={m.status === "voting" && m.ownerId === currentUserId && onRemoveCandidate ? () => onRemoveCandidate(r.id) : undefined}
            onVote={() => onVote(r.id)}
            voted={!!currentUserId && m.votes[currentUserId] === r.id}
            disabled={m.status !== "voting"}
          />
        ))}
        <View style={styles.votingSection}>
          <Row>
            <Text style={uiStyles.heading}>Голосование</Text>
            <Text style={styles.count}>
              {Object.keys(m.votes).length}/{m.participants.length}
            </Text>
          </Row>
          <View style={styles.progressTrack}>
            <View
              // Ширина полосы соответствует доле проголосовавших участников.
              style={[
                styles.progressBar,
                getVotingProgress(
                  Object.keys(m.votes).length,
                  m.participants.length,
                ),
              ]}
            />
          </View>
          {/* entries превращает объект голосов в пары: имя участника и id ресторана. */}
          {Object.entries(m.votes).map(([name, id]) => (
            <Row key={name}>
              <Row style={styles.votingRow}>
                <Avatars
                  names={[
                    m.members?.find((p) => p.id === name)?.name ?? "Участник",
                  ]}
                  size={22}
                />
                <Text style={styles.votingName}>
                  {m.members?.find((p) => p.id === name)?.name ?? "Участник"}
                </Text>
              </Row>
              <Text style={styles.votingCount}>
                {restaurants.find((r) => r.id === id)?.name}
              </Text>
            </Row>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        {/* Название кнопки зависит от статуса; действие бронирования выполняет родитель. */}
        <Button title="Перейти к чату" onPress={onChat} variant="outline" />
        <Button
          title={
            m.status === "completed"
              ? "Посмотреть бронирование"
              : m.status === "booked"
                ? "Посмотреть бронирование"
                : "Забронировать лидера"
          }
          onPress={onBook}
          variant="accent"
        />
      </View>
    </ScrollView>
  );
}
