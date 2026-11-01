// App.tsx собирает приложение: выбирает экран и передаёт ему данные и обработчики действий.
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { meetingDate, meetingPlace } from "../entities/meeting";
import Toast from "../shared/ui/Toast";
import { Auth } from "../pages/auth";
import { Chat } from "../pages/chat";
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
    filterDistance,
    meeting, // Объект выбранной встречи.
    update,
    leader,
    book,
    vote,
    isTabs, // Нужно ли показывать нижнюю навигацию на текущем экране.
  } = controller;
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
              {screen === "detail" && (
                <MeetingDetail
                  meeting={meeting}
                  onVote={vote}
                  onEdit={() => setScreen("edit")}
                  onManage={() => setDialog("participants")} // Открываем диалог, сохраняя текущий экран.
                  onChat={() => setScreen("chat")}
                  onBook={() => book(meetingPlace(meeting))} // Передаём выбранное место в обработчик бронирования.
                />
              )}
              {(screen === "new" || screen === "edit") && (
                <MeetingForm
                  // При смене new/edit React создаёт форму заново и сбрасывает её локальные поля.
                  key={screen}
                  // Для редактирования передаём встречу; для создания — оставляем свойство без значения.
                  meeting={screen === "edit" ? meeting : undefined}
                  onSave={saveMeeting}
                />
              )}
              {screen === "map" && (
                <MapScreen
                  // Передаём выбранные в приложении ограничения поиска ресторанов.
                  filters={{
                    budget: filterBudget,
                    cuisine: filterCuisine,
                    distance: filterDistance,
                  }}
                  onBook={book}
                  onFilters={() => setDialog("filters")}
                />
              )}
              {screen === "chat" && (
                <Chat
                  meeting={meeting}
                  messages={[
                    // ... добавляет элементы массива в новый массив.
                    // Берём чат выбранной встречи; если его нет, ?? [] даёт пустой список.
                    // Старые карточки выбора места исключаем: ниже создаём актуальную.
                    ...(store.messages[selected] ?? []).filter(
                      (m) => m.kind !== "selected",
                    ),
                    // В конце завершённой встречи показываем карточку с её местом и временем.
                    ...(meeting.status === "completed" && meeting.restaurantId
                      ? [
                          {
                            id: "meeting-place",
                            name: "",
                            time: "",
                            kind: "selected" as const, // Для TypeScript это точное значение "selected".
                            text: `${meetingPlace(meeting).name}, ${meetingDate(
                              meeting.date,
                            ).toLowerCase()} в ${meeting.time}`,
                          },
                        ]
                      : []),
                  ]}
                  leader={leader().name} // Получаем название ресторана-лидера голосования.
                  onLeader={() => setScreen("detail")}
                  onSend={sendMessage} // Chat вызывает эту функцию, когда пользователь отправляет текст.
                  onLike={toggleMessageLike}
                  onAttach={() => setDialog("attachment")}
                />
              )}
              {screen === "profile" && (
                <ProfileScreen controller={controller} />
              )}
              {/* Нижние вкладки переключают основные разделы приложения. */}
              {isTabs && <BottomNavigation controller={controller} />}
            </>
          )}
          {/* Короткое уведомление видно, если оно есть и поверх экрана не открыт диалог. */}
          {toast !== null && dialog === null && (
            // Новый key создаёт Toast заново, перезапуская его анимацию для нового уведомления.
            <Toast key={toast.id} type={toast.type} text={toast.message} onDismiss={dismissToast} />
          )}
          {/* DialogHost показывает нужное диалоговое окно по значению dialog. */}
          <DialogHost controller={controller} />
        </SafeAreaView>
      </View>
    </>
  );
}
