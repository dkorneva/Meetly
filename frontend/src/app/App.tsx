// App.tsx собирает приложение: выбирает экран и передаёт ему данные и обработчики действий.
import { ActivityIndicator, View } from "react-native";
import { useState } from "react";
import type { Restaurant } from "../entities/meeting";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { meetingDate, meetingPlace } from "../entities/meeting";
import Toast from "../shared/ui/Toast";
import { Auth } from "../pages/auth";
import { Chat, ChatsScreen } from "../pages/chat";
import { MapScreen } from "../pages/map";
import { MeetingDetail } from "../pages/meeting-detail";
import { MeetingForm } from "../pages/meeting-form";
import { MeetingsScreen } from "../pages/meetings";
import { Onboarding } from "../pages/onboarding";
import { ProfileScreen } from "../pages/profile";
import { Text, ThemeProvider, useThemedStyles } from "../shared/theme/index";
import { createStyles } from "./App.styles";
import { DialogHost } from "../widgets/dialogs";
import { AppHeader } from "../widgets/navigation";
import { BottomNavigation } from "../widgets/navigation";
import { type AppController, useAppController } from "./model/useAppController";

// Главный компонент, с которого начинается интерфейс приложения.

/**
 * Собирает приложение: подключает безопасные отступы, тему и основной интерфейс.
 *
 * @returns Элементы интерфейса React.
 */
export default function App() {
  // Получаем общее состояние и действия: встречи, сообщения, настройки, навигацию и т. д.
  const controller = useAppController();
  return (
    // Делает сведения о безопасных отступах экрана доступными вложенным компонентам.
    <SafeAreaProvider>
      {/* Передаём текущую тему всем компонентам внутри обёртки. */}
      <ThemeProvider dark={controller.store.dark}>
        <AppContent controller={controller} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Выбирает экран по состоянию навигации и передаёт данные и обработчики дочерним компонентам.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
function AppContent({ controller }: { controller: AppController }) {
  const [mapResetKey, setMapResetKey] = useState(0);
  const [mapTarget, setMapTarget] = useState<{
    meetingId: string;
    restaurant?: Restaurant;
  }>();
  // Создаём стили с цветами текущей темы
  const styles = useThemedStyles(createStyles);

  const {
    saveMeeting,
    toggleMessageLike,
    sendMessage,
    enterSession,
    fontsLoaded,
    fontError,
    store, // Данные приложения: профиль, встречи, сообщения и настройки.
    loaded, // Закончена ли загрузка сохранённых данных.
    screen, // Название текущего экрана.
    setScreen, // Функция перехода на другой экран.
    selected, // id выбранной встречи.
    dialog, // Название открытого диалога; null, если все закрыты.
    setDialog,
    toast,
    dismissToast,
    filterBudget,
    filterCuisine,
    meeting, // Объект выбранной встречи.
    update,
    leader,
    book,
    vote,
    isTabs, // Нужно ли показывать нижнюю навигацию на текущем экране.
  } = controller;
  const meetingMap = !!mapTarget && mapTarget.meetingId === meeting?.id;
  // Пока данные или шрифт загружаются, показываем логотип вместо основного интерфейса.
  // При ошибке загрузки шрифта разрешаем продолжить, чтобы не зависнуть на логотипе.
  if (!loaded || (!fontsLoaded && !fontError))
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>Meetly.</Text>
      </View>
    );
  return (
    <>
      <View style={[styles.viewport, styles.viewportBackground]}>
        <SafeAreaView
          style={[styles.app, styles.appBackground]}
          // Добавляем безопасные отступы сверху и снизу: для выреза камеры и системных областей.
          edges={["top", "bottom"]}
        >
          {/* На тёмном фоне значки системной строки светлые, на светлом — тёмные. */}
          <StatusBar style={store.dark ? "light" : "dark"} />
          {/* screen определяет, что показать: знакомство, вход/регистрацию или основные экраны. */}
          {screen === "intro" ? (
            <Onboarding
              onDone={() => {
                // Запоминаем прохождение знакомства и переходим к регистрации.
                update({ onboarded: true });
                setScreen("register");
              }}
              onLogin={() => {
                // Пользователь уже имеет аккаунт — открываем вход.
                update({ onboarded: true });
                setScreen("login");
              }}
            />
          ) : screen === "login" || screen === "register" ? (
            <Auth
              // Один компонент Auth работает в двух режимах.
              register={screen === "register"}
              onBack={() => setScreen("intro")}
              onSwitch={() =>
                setScreen(screen === "login" ? "register" : "login")
              }
              onEnter={enterSession}
            />
          ) : (
            <>
              {/* Шапка нужна только на перечисленных экранах. includes проверяет наличие в массиве. */}
              {["detail", "new", "edit", "chat"].includes(screen) && (
                <AppHeader controller={controller} />
              )}
              {/* && показывает компонент, только когда условие слева истинно. */}
              {screen === "meetings" && (
                <MeetingsScreen controller={controller} />
              )}
              {screen === "detail" && meeting && (
                <MeetingDetail
                  meeting={meeting}
                  onVote={vote}
                  onRemoveCandidate={controller.removeCandidate}
                  onRecommend={controller.recommend}
                  discoveryBusy={controller.discoveryBusy}
                  discoveryError={controller.discoveryError}
                  onMap={(restaurant) => {
                    setMapTarget(
                      { meetingId: meeting.id, restaurant },
                    );
                    setScreen("map");
                  }}
                  currentUserId={store.userId}
                  onEdit={() => setScreen("edit")}
                  onManage={() => setDialog("participants")} // Открываем диалог, сохраняя текущий экран.
                  onChat={() => controller.openChat(meeting.id, "meeting")}
                  onBook={() => book(meetingPlace(meeting))} // Передаём выбранное место в обработчик бронирования.
                />
              )}
              {(screen === "new" || screen === "edit") && (
                <MeetingForm
                  // При смене new/edit React создаёт форму заново и сбрасывает её локальные поля.
                  key={screen}
                  // Для редактирования передаём встречу; для создания — оставляем свойство без значения.
                  meeting={screen === "edit" ? meeting : undefined}
                  preferencesOnly={
                    screen === "edit" && meeting?.ownerId !== store.userId
                  }
                  onSave={saveMeeting}
                />
              )}
              {screen === "map" && (
                <>
                  <MapScreen
                    key={meetingMap ? `meeting:${meeting?.id}` : `catalog:${mapResetKey}`}
                    mode={meetingMap ? "meeting" : "catalog"}
                    meeting={meeting}
                    initialRestaurant={
                      mapTarget?.meetingId === meeting?.id
                        ? mapTarget?.restaurant
                        : undefined
                    }
                    onChanged={controller.refreshMeetings}
                    // Передаём выбранные в приложении ограничения поиска ресторанов.
                    filters={{
                      budget: filterBudget,
                      cuisine: filterCuisine,
                      openNow: controller.filterOpenNow,
                      q: controller.filterQuery,
                    }}
                    onFilterChange={patch => {
                      if (patch.budget !== undefined) controller.setFilterBudget(patch.budget);
                      if (patch.cuisine !== undefined) controller.setFilterCuisine(patch.cuisine);
                      if (patch.openNow !== undefined) controller.setFilterOpenNow(patch.openNow);
                      if (patch.q !== undefined) controller.setFilterQuery(patch.q);
                    }}
                    onBook={book}
                    onPropose={controller.propose}
                    onFilters={() => setDialog("filters")}
                  />
                </>
              )}
              {screen === "chats" && <ChatsScreen meetings={store.meetings} userId={store.userId} onOpen={id => controller.openChat(id, "list")} />}
              {screen === "chat" && meeting && (
                <Chat
                  key={meeting.id}
                  meeting={meeting}
                  messages={[
                    // ... добавляет элементы массива в новый массив.
                    // Берём чат выбранной встречи; если его нет, ?? [] даёт пустой список.
                    // Серверные события выбора места остаются в истории.
                    ...(store.messages[selected] ?? []),
                    // Старые встречи могли быть подтверждены до появления событий выбора места.
                    ...(meeting.status !== "voting" && meeting.restaurantId && !(store.messages[selected] ?? []).some(m => m.kind === "selected")
                      ? [
                          {
                            id: "meeting-place",
                            name: "",
                            time: "",
                            createdAt: meeting.bookedAt ?? meeting.updatedAt,
                            kind: "selected" as const, // Для TypeScript это точное значение "selected".
                            text: `${meetingPlace(meeting)?.name ?? "Место"}, ${meetingDate(
                              meeting.date,
                            ).toLowerCase()} в ${meeting.time}`,
                          },
                        ]
                      : []),
                  ]}
                  leader={leader()?.name ?? "Место пока не выбрано"}
                  onLeader={() => setScreen("detail")}
                  onSend={sendMessage} // Chat вызывает эту функцию, когда пользователь отправляет текст.
                  onLike={toggleMessageLike}
                  onAttach={() => setDialog("attachment")}
                  onLoadOlder={controller.loadOlderMessages}
                  hasOlderMessages={controller.hasOlderMessages}
                />
              )}
              {screen === "profile" && (
                <ProfileScreen controller={controller} />
              )}
              {(screen === "chat" ||
                screen === "detail" ||
                screen === "edit") &&
                !meeting && (
                  <Text>
                    Выберите или создайте встречу во вкладке «Встречи».
                  </Text>
                )}
              {/* Нижние вкладки переключают основные разделы приложения. */}
              {isTabs && <BottomNavigation controller={{...controller,setScreen:(next)=>{if(next==="map"){setMapTarget(undefined);if(screen==="map"){controller.setFilterBudget("Все");controller.setFilterCuisine([]);controller.setFilterOpenNow(false);controller.setFilterQuery("");setMapResetKey(value=>value+1);}}setScreen(next === "chat" ? "chats" : next);}}} />}
            </>
          )}
          {/* Короткое уведомление видно, если оно есть и поверх экрана не открыт диалог. */}
          {toast !== null && dialog === null && (
            // Новый key создаёт Toast заново, перезапуская его анимацию для нового уведомления.
            <Toast
              key={toast.id}
              type={toast.type}
              text={toast.message}
              onDismiss={dismissToast}
            />
          )}
          {/* DialogHost показывает нужное диалоговое окно по значению dialog. */}
          <DialogHost controller={controller} />
          {controller.busy && (
            <ActivityIndicator
              accessibilityLabel="Загрузка"
              style={{ position: "absolute", top: 10, right: 10 }}
            />
          )}
        </SafeAreaView>
      </View>
    </>
  );
}
