import type { Restaurant, Meeting } from "../../../entities/meeting";
import type { ToastType } from "../../../shared/ui/Toast.types";
import { Image, Pressable, View } from "react-native";

import { openExternalLink } from "../../../shared/api/device";
import { Text, useThemedStyles } from "../../../shared/theme/index";
import { Button, Row } from "../../../shared/ui/controls/index";
import { createStyles } from "./BookingDialog.styles";

/**
 * Показывает контакты ресторана и доступные действия подтверждения или отмены локальной брони.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function BookingDialog({
  controller,
}: {
  controller: {
    confirmCurrentBooking: () => void;
    booking: Restaurant;
    showToast: (type: ToastType, message: string) => void;
    cancelCurrentBooking: () => void;
    meeting: Meeting;
  };
}) {
  // useThemedStyles получает цвета текущей темы и передаёт их в createStyles из BookingDialog.styles.ts.
  // Внутри хука useMemo сохраняет результат между перерисовками, пока функция
  // createStyles и цвета не изменились. При смене темы стили создаются заново.
  const styles = useThemedStyles(createStyles);

  // деструктуризация
  const {
    confirmCurrentBooking,
    booking,
    showToast,
    cancelCurrentBooking,
    meeting,
  } = controller;
  return (
    <>
      <Row style={styles.restaurantSummary}>
        <Image source={booking.image} style={styles.restaurantImage} />
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{booking.name}</Text>
          <Text style={styles.restaurantDescription}>
            {booking.address || "Адрес не указан"}
          </Text>
        </View>
      </Row>
      <View style={styles.contactList}>
        {[
          {
            label: "Телефон",
            value: booking.phone,
            url: booking.phone ? `tel:${booking.phone}` : "",
          },
          {
            label: "Сайт",
            value: booking.website.replace("https://", ""),
            url: booking.website,
          },
          {
            label: "ВКонтакте",
            value: booking.vk.replace("https://", ""),
            url: booking.vk,
          },
        ]
          .filter((x) => x.url) // оставить только те объекты, у которых есть url
          .map((item, i) => (
            // превратить объект в кликабельный элемент интерфейса
            <Pressable
              key={item.label} // key помогает React различать элементы списка при обновлениях
              onPress={() =>
                openExternalLink(item.url).catch(() =>
                  showToast("error", "Не удалось открыть ссылку"),
                )
              }
              // первая строка (i === 0) без линии, у остальных — разделитель сверху.
              style={i === 0 ? styles.firstContactRow : styles.contactRow}
            >
              <Row>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactLink}>{item.value}</Text>
              </Row>
            </Pressable>
          ))}
      </View>
      <Button
        title="Позвонить"
        disabled={!booking.phone}
        variant="accent"
        onPress={() =>
          openExternalLink(`tel:${booking.phone}`).catch(
            () => showToast("info", "Звонок доступен на телефоне"), // тост показывается, если после нажатия «Позвонить» не удалось открыть адрес tel:номер
          )
        }
      />
      {!booking.phone && (
        <Text>
          Телефон не указан в источнике. Уточните контакты на сайте заведения
          или в Яндекс Картах.
        </Text>
      )}
      <Button
        title="Открыть в Яндекс Картах"
        variant="outline"
        onPress={() =>
          openExternalLink(
            `https://yandex.ru/maps/?pt=${booking.longitude},${booking.latitude}&z=17`,
          ).catch(() => showToast("error", "Не удалось открыть карту"))
        }
      />
      {meeting.status !== "completed" && (
        <Button
          title={
            meeting.status === "booked" && meeting.restaurantId === booking.id
              ? "Бронь подтверждена"
              : "Подтвердить бронь после звонка"
          }
          variant="outline"
          onPress={confirmCurrentBooking}
        />
      )}
      {meeting.status === "completed" && (
        <Button
          title="Отменить бронирование"
          variant="outline"
          onPress={cancelCurrentBooking}
        />
      )}
    </>
  );
}
