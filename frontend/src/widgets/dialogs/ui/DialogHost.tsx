import type { DialogName } from "../../../shared/config/dialogs";
import type { ToastNotification, ToastType } from "../../../shared/ui/Toast.types";
import type { Restaurant, Meeting } from "../../../entities/meeting";
import type { Store } from "../../../entities/meeting";
import type { Screen } from "../../../shared/config/screens";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "../../../shared/ui/Toast";
import { AttachmentDialog } from "../../../features/attach-message";
import { BookingDialog } from "../../../features/booking";
import { CalendarExportDialog } from "../../../features/calendar-export";
import { FiltersDialog } from "../../../features/filter-restaurants";
import { InviteDialog } from "../../../features/manage-participants";
import { MeetingActionsDialog } from "../../../features/meeting-actions";
import { ParticipantsDialog } from "../../../features/manage-participants";
import { EditProfileDialog } from "../../../features/edit-profile";
import { IconButton, Row } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { Text, useThemedStyles } from "../../../shared/theme/index";
import { createStyles } from "./DialogHost.styles";


// Общая оболочка диалогов: фон, панель, заголовок и кнопки закрытия.
// controller приходит через пропсы из AppContent; состояние хранится в useAppController.
/**
 * Показывает выбранный диалог в общей модальной оболочке и уведомление над ним.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function DialogHost({
  controller,
}: {
  controller: {
    dialog: DialogName;
    setDialog: (dialog: DialogName) => void;
    toast: ToastNotification | null;
    dismissToast: () => void;
    sharePlaceInChat: () => void;
    pickAttachment: () => Promise<void>;
    confirmCurrentBooking: () => void;
    booking: Restaurant;
    showToast: (type: ToastType, message: string) => void;
    cancelCurrentBooking: () => void;
    meeting: Meeting;
    store: Store;
    update: (patch: Partial<Store>) => void;
    saveProfile: () => void;
    editName: string;
    setEditName: (value: string) => void;
    editEmail: string;
    setEditEmail: (value: string) => void;
    pickAvatar: () => Promise<void>;
    filterBudget: string;
    setFilterBudget: (value: string) => void;
    filterCuisine: string;
    setFilterCuisine: (value: string) => void;
    filterDistance: string;
    setFilterDistance: (value: string) => void;
    inviteParticipant: () => void;
    inviteName: string;
    setInviteName: (value: string) => void;
    share: () => void;
    selectLeader: () => void;
    setScreen: (screen: Screen) => void;
    removeParticipant: (name: string) => void;
  };
}) {
  const styles = useThemedStyles(createStyles); // Стили оболочки с учётом текущей темы.
  const uiStyles = useUiStyles(); // Общие стили интерфейса: здесь нужен heading для заголовка.

  // dialog — название открытого окна; null означает, что все окна закрыты.
  // setDialog меняет окно. toast содержит id показа, type для оформления и message с текстом.
  // dismissToast устанавливает toast в null и скрывает уведомление.
  const { dialog, setDialog, toast, dismissToast } = controller;

  return (
    <Modal
      visible={dialog !== null} // Показываем Modal поверх приложения, если выбран диалог.
      transparent // Основной экран остаётся виден; затемнение задаёт styles.overlay.
      animationType="slide" // Панель появляется с анимацией выдвижения.
      onRequestClose={() => setDialog(null)} // Закрытие по системному запросу, например «Назад» на Android.
    >
      {/* Учитывает появление клавиатуры. На iOS добавляет отступ, чтобы уменьшить перекрытие содержимого.
          styles.overlay также затемняет фон и располагает панель внизу по центру. */}
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Нажимаемая область позади панели: absoluteFill растягивает её по всем краям родителя.
            Нажатие на фон вокруг панели устанавливает dialog в null и закрывает окно. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setDialog(null)}
        />
        {/* Сама панель. edges={["bottom"]} учитывает безопасную область у нижнего края устройства,
            например место для системного индикатора жестов. */}
        <SafeAreaView
          edges={["bottom"]}
          style={[styles.dialog, styles.dialogBackground]}
        >
          {/* Декоративная полоска сверху. Перетаскивание панели здесь не реализовано. */}
          <View style={styles.handle} />
          {/* Row располагает заголовок и крестик горизонтально. */}
          <Row style={styles.dialogHeader}>
            <Text style={uiStyles.heading}>
              {
                // Объект связывает внутреннее название диалога с заголовком для пользователя.
                // [dialog ?? "menu"] выбирает свойство: например, при dialog === "filters" — «Фильтры».
                // Если dialog равен null или undefined, ?? подставляет ключ "menu".
                {
                  booking: "Забронировать",
                  participants: "Участники",
                  invite: "Пригласить участников",
                  calendar: "Яндекс Календарь",
                  profile: "Изменить профиль",
                  filters: "Фильтры",
                  attachment: "Прикрепить",
                  menu: "Встреча",
                }[dialog ?? "menu"]
              }
            </Text>
            <IconButton name="close" onPress={() => setDialog(null)} />
          </Row>
          {/* ScrollView позволяет прокрутить содержимое, если оно не помещается в панель.
              keyboardShouldPersistTaps="handled": при нажатии, обработанном дочерним элементом
              (например, кнопкой), ScrollView не скрывает клавиатуру автоматически.
              contentContainerStyle задаёт стили внутреннего контейнера с содержимым. */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.dialogContent}
          >
            {/* Условный рендеринг: показываем компонент, название которого совпало с dialog.
                Через проп controller передаём ему данные и функции для обработки действий. */}
            {dialog === "booking" && <BookingDialog controller={controller} />}
            {dialog === "participants" && (
              <ParticipantsDialog controller={controller} />
            )}
            {dialog === "invite" && <InviteDialog controller={controller} />}
            {dialog === "calendar" && <CalendarExportDialog controller={controller} />}
            {dialog === "profile" && <EditProfileDialog controller={controller} />}
            {dialog === "filters" && <FiltersDialog controller={controller} />}
            {dialog === "attachment" && (
              <AttachmentDialog controller={controller} />
            )}
            {dialog === "menu" && <MeetingActionsDialog controller={controller} />}
            {/* Общая кнопка закрытия для любого диалога. */}
            <Pressable
              onPress={() => setDialog(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeLabel}>Закрыть</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
      {/* Уведомление показывается, только если toast не null и открыт диалог.
          Toast находится внутри Modal, чтобы отображаться поверх диалогового окна.
          При изменении key React создаёт Toast заново и повторно запускает его анимацию.
          onDismiss устанавливает toast в null, после чего условие перестаёт выполняться. */}
      {toast !== null && dialog !== null && (
        <Toast key={toast.id} type={toast.type} text={toast.message} onDismiss={dismissToast} />
      )}
    </Modal>
  );
}
