import { shareInvitation } from "../../features/share-invitation";
import { useFonts } from "expo-font";
import { useEffect,useRef,useState } from "react";
import { BackHandler } from "react-native";
import {
cancelBooking,
confirmBooking,
getLeader,
toggleReaction,
} from "../../entities/meeting";
import { restaurants } from "../../entities/meeting";
import type { Meeting,Message,Restaurant } from "../../entities/meeting";
import {
chooseAttachment,
chooseAvatar,

} from "../../shared/api/device";
import { timeNow } from "../../shared/lib/time";
import { validateParticipant } from "../../shared/lib/participants";
import type { Screen } from "../../shared/config/screens";
import type { DialogName } from "../../shared/config/dialogs";
import type { Store } from "../../entities/meeting";
import type { ToastNotification, ToastType } from "../../shared/ui/Toast.types";
import { usePersistentStore } from "./usePersistentStore";

// Пользовательский React-хук: объединяет общее состояние приложения и обработчики действий.
// Вызывается в App; возвращённый объект controller передаётся экранам и диалогам через пропсы.
// Сам хук не рисует JSX. Изменение состояния вызывает повторный рендер App,
// после чего дочерние компоненты получают актуальные данные.

/**
 * Объединяет общее состояние, навигацию и обработчики действий приложения.
 *
 * @returns Данные и функции хука; точная структура указана в сигнатуре TypeScript.
 */
export function useAppController() {
  // Хук Expo загружает шрифт: fontsLoaded сообщает об успехе, fontError — об ошибке.
  const [fontsLoaded, fontError] = useFonts({
    Inter: require("../../../assets/fonts/Inter.ttf"),
  });
  // Наш хук загружает store из локального хранилища и сохраняет его при изменениях.
  // loaded означает завершение загрузки данных, storageError содержит текст ошибки.
  const { store, setStore, loaded, storageError } = usePersistentStore();
  // useState возвращает [текущее значение, функцию его изменения]. Аргумент — начальное значение.
  // <Screen> ограничивает названия экранов допустимыми значениями из типа Screen.
  // Эти состояния интерфейса не входят в сохраняемый store и сбрасываются при новом запуске.
  const [screen, setScreen] = useState<Screen>("intro");
  // ID выбранной встречи. "team" — ID начальной демонстрационной встречи.
  const [selected, setSelected] = useState("team");
  // Название открытого диалогового окна (модального); null — ни один диалог не открыт.
  const [dialog, setDialog] = useState<DialogName>(null);
  // Объект ресторана для окна бронирования; изначально берём первый из каталога.
  const [booking, setBooking] = useState<Restaurant>(restaurants[0]);
  // Выбранный раздел списка встреч: активные или завершённые.
  const [meetingSection, setMeetingSection] = useState<"active" | "completed">(
    "active"
  );
  const [search, setSearch] = useState(""); // Текст поиска по названию встречи.
  // Значения полей ввода: имя приглашённого и черновик редактирования профиля.
  const [inviteName, setInviteName] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  // Всё уведомление хранится в одном состоянии; null скрывает его.
  const [toast, setToast] = useState<ToastNotification | null>(null);
  // useRef хранит счётчик между рендерами. Изменение ref само по себе не вызывает рендер.
  const nextToastId = useRef(0);
  // Тип указывается явно: showToast("error", "Не удалось открыть файл").
  // Новый объект обновляет состояние, новый ID перезапускает анимацию даже при одинаковом тексте.
  
  /**
   * Создаёт новое уведомление с уникальным номером показа.
   *
   * @param type - Вид уведомления: info, success или error.
   * @param message - Сообщение для обработки.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function showToast(type: ToastType, message: string) {
    nextToastId.current += 1;
    setToast({ id: nextToastId.current, type, message });
  }
  
  /**
   * Скрывает текущее уведомление.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function dismissToast() {
    setToast(null);
  }
  // Обработчик отмены брони: меняет выбранную встречу и открывает список активных встреч.
  
  /**
   * Отменяет локальную бронь и открывает активные встречи.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function cancelCurrentBooking() {
    updateMeeting(cancelBooking);
    setDialog(null);
    setMeetingSection("active");
    setScreen("meetings");
    showToast("success", "Бронирование отменено. Встреча снова активна");
  }
  // Выбранные фильтры ресторанов на карте. "Все" означает отсутствие ограничения.
  const [filterBudget, setFilterBudget] = useState("Все");
  const [filterCuisine, setFilterCuisine] = useState("Все");
  const [filterDistance, setFilterDistance] = useState("Все");
  // Вычисляем выбранную встречу из store по её ID. find возвращает объект, а не true/false.
  // Если совпадения нет, ?? берёт первую встречу.
  // Это вычисляемое значение: оно определяется заново при каждом рендере, отдельный useState не нужен.
  const meeting =
    store.meetings.find((m) => m.id === selected) ?? store.meetings[0];
  // useEffect выполняет побочное действие после рендера. Массив в конце задаёт зависимости:
  // React повторяет эффект при их изменении. Здесь после загрузки выбираем стартовый экран.
  // Если вход выполнен — встречи; иначе после знакомства — вход, до знакомства — intro.
  // Эффект зависит только от loaded, поэтому служит для запуска, а не для каждого изменения store.
  useEffect(() => {
    if (loaded)
      setScreen(
        store.session ? "meetings" : store.onboarded ? "login" : "intro"
      );
  }, [loaded]);
  // При изменении ошибки хранилища показываем её текст как уведомление.
  useEffect(() => {
    if (storageError) showToast("error", storageError);
  }, [storageError]);
  // При новом объекте toast запускаем таймер: через 3500 мс скрываем уведомление.
  // Даже одинаковые сообщения создают новый объект, поэтому время показа отсчитывается заново.
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => dismissToast(), 3500);
      // Возвращённая функция — очистка эффекта: React вызывает её перед следующим запуском
      // этого эффекта и при размонтировании компонента. Старый таймер больше не нужен.
      return () => clearTimeout(t);
    }
  }, [toast]);
  // Подписываемся на системную кнопку «Назад» Android.
  // Сначала закрываем диалог; если его нет — возвращаемся с внутренних экранов к встречам.
  // true означает «мы обработали нажатие», false оставляет стандартное поведение системе.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (dialog) {
        setDialog(null);
        return true;
      }
      if (!["intro", "meetings", "login", "register"].includes(screen)) {
        setScreen("meetings");
        return true;
      }
      return false;
    });
    // Удаляем старую подписку, чтобы обработчики не накапливались.
    // При изменении screen или dialog эффект создаёт обработчик с актуальными значениями.
    return () => sub.remove();
  }, [screen, dialog]);
  // Частичное обновление store.
  // prev — предыдущее состояние. Создаём новый объект: копируем старые поля и заменяем поля из patch.
  // Состояние React здесь обновляется без изменения исходного объекта.
  
  /**
   * Обновляет только переданные поля общего состояния, сохраняя остальные.
   *
   * @param patch - Поля состояния, которые нужно заменить.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const update = (patch: Partial<Store>) =>
    setStore((prev) => ({ ...prev, ...patch }));
  // Принимает функцию преобразования встречи: fn получает старый объект и возвращает новый.
  // map создаёт новый массив: изменяем только встречу с выбранным ID, остальные оставляем прежними.
  
  /**
   * Применяет преобразование только к выбранной встрече.
   *
   * @param fn - Функция, получающая текущую встречу и возвращающая обновлённую.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const updateMeeting = (fn: (m: Meeting) => Meeting) =>
    setStore((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) => (m.id === selected ? fn(m) : m)),
    }));
  // Добавляем сообщение в чат выбранной встречи, создавая новые объекты и массив сообщений.
  // [selected] — ключ с ID встречи. Если чата ещё нет, ?? [] даёт пустой массив.
  
  /**
   * Добавляет сообщение в чат выбранной встречи без изменения исходных массивов.
   *
   * @param message - Сообщение для обработки.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function addMessage(message: Message) {
    setStore((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [selected]: [...(prev.messages[selected] ?? []), message],
      },
    }));
  }
  // Получаем ресторан-лидер голосования выбранной встречи через функцию из meetingLogic.
  
  /**
   * Определяет ресторан-лидер выбранной встречи.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function leader() {
    return getLeader(meeting);
  }
  // Вычисляем список для экрана встреч: нужный раздел и совпадение с поисковой строкой.
  // filter возвращает новый массив. toLowerCase позволяет искать без учёта регистра букв.
  const matchingMeetings = store.meetings.filter(
    (m) =>
      (meetingSection === "completed"
        ? m.status === "completed"
        : m.status !== "completed") &&
      m.title.toLowerCase().includes(search.toLowerCase())
  );
  // Обработчик открытия встречи: запоминаем её ID и переключаем экран на подробности.
  
  /**
   * Запоминает идентификатор встречи и открывает её подробности.
   *
   * @param id - Идентификатор обрабатываемого объекта.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function openMeeting(id: string) {
    setSelected(id);
    setScreen("detail");
  }
  // Выбираем ресторан и открываем окно бронирования. Сама бронь здесь ещё не подтверждается.
  
  /**
   * Выбирает ресторан для диалога бронирования; саму бронь не подтверждает.
   *
   * @param r - Выбранный ресторан.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function book(r: Restaurant) {
    setBooking(r);
    setDialog("booking");
  }
  // Запускаем отправку приглашения средствами устройства; catch обрабатывает ошибку операции.
  
  /**
   * Отправляет приглашение на выбранную встречу и показывает ошибку при неудаче.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function share() {
    shareInvitation(meeting).catch(() =>
      showToast("error", "Не удалось открыть меню отправки")
    );
  }
  // id — ID ресторана. Если голосование уже закончено, показываем сообщение и выходим через return.
  
  /**
   * Записывает голос демонстрационного пользователя Ани, если статус встречи допускает голосование.
   *
   * @param id - Идентификатор обрабатываемого объекта.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function vote(id: string) {
    if (meeting.status !== "voting") {
      showToast("info", "Голосование завершено");
      return;
    }
    // Создаём новые объекты встречи и голосов. В текущем прототипе голос записывается под именем «Аня».
    updateMeeting((m) => ({ ...m, votes: { ...m.votes, Аня: id } }));
    showToast("success", `Ваш голос: ${restaurants.find((r) => r.id === id)?.name}`);
  }
  // Асинхронный обработчик: await ждёт результат выбора файла, не блокируя интерфейс.
  // try выполняет операцию, catch показывает уведомление, если возникла ошибка.
  
  /**
   * Выбирает файл, создаёт сообщение с вложением и закрывает диалог; ошибки показывает уведомлением.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  async function pickAttachment() {
    try {
      const attachment = await chooseAttachment();
      if (!attachment) return; // Пользователь отменил выбор — сообщение не добавляем.
      // Создаём сообщение с вложением. mine: true помечает его как сообщение текущего пользователя.
      // Date.now() даёт временную метку для ID, split(" ")[0] берёт первое слово имени.
      addMessage({
        id: Date.now().toString(),
        name: store.name.split(" ")[0],
        text: attachment.name,
        time: timeNow(),
        mine: true,
        attachment,
      });
      setDialog(null);
    } catch {
      showToast("error", "Не удалось открыть файл");
    }
  }
  // Ждём выбор изображения и обновляем avatar в store. При отмене выбора ничего не меняем.
  
  /**
   * Выбирает фотографию и обновляет профиль только при успешном выборе.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  async function pickAvatar() {
    try {
      const avatar = await chooseAvatar();
      if (avatar) update({ avatar });
    } catch {
      showToast("error", "Не удалось выбрать фотографию");
    }
  }
  // Явно выбираем экран возврата: из редактирования — подробности, иначе — список встреч.
  // История переходов здесь не хранится.
  
  /**
   * Открывает подробности после редактирования или список встреч с остальных внутренних экранов.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function goBack() {
    setScreen(screen === "edit" ? "detail" : "meetings");
  }
  // Вычисляемые значения для интерфейса: нужна ли нижняя навигация и какой заголовок показать.
  const isTabs = ["meetings", "map", "chat", "profile"].includes(screen);
  const title =
    screen === "new"
      ? "Новая встреча"
      : screen === "edit"
      ? "Ваши предпочтения"
      : screen === "chat"
      ? meeting.title
      : "";

  // Обработчик формы получает готовый объект встречи m через аргумент.
  // При редактировании заменяем выбранную встречу; при создании добавляем новую в начало списка.
  
  /**
   * Сохраняет изменения встречи либо добавляет новую встречу вместе с начальным системным сообщением.
   *
   * @param m - Объект встречи для сохранения.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const saveMeeting = (m: Meeting) => {
    if (screen === "edit") {
      updateMeeting(() => m);
      setScreen("detail");
      showToast("success", "Предпочтения сохранены");
    } else {
      setStore((prev) => ({
        ...prev,
        meetings: [m, ...prev.meetings],
        // Для новой встречи сразу создаём чат с системным сообщением о её создании.
        messages: {
          ...prev.messages,
          [m.id]: [
            {
              id: Date.now().toString(),
              name: "",
              text: `${store.name.split(" ")[0]} создала встречу`,
              time: "",
              kind: "system",
            },
          ],
        },
      }));
      setSelected(m.id);
      setScreen("detail");
    }
  };
  // В чате выбранной встречи меняем реакцию только у сообщения с указанным ID.
  // toggleReaction возвращает обновлённое сообщение, остальные map оставляет прежними.
  
  /**
   * Переключает реакцию только у сообщения с переданным id в текущем чате.
   *
   * @param id - Идентификатор обрабатываемого объекта.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const toggleMessageLike = (id: string) =>
    setStore((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [selected]: (prev.messages[selected] ?? []).map((m) =>
          m.id === id ? toggleReaction(m) : m
        ),
      },
    }));
  // Обработчик отправки текста: создаёт объект сообщения и передаёт его в addMessage.
  
  /**
   * Создаёт и добавляет текстовое сообщение от текущего локального пользователя.
   *
   * @param text - Текст сообщения.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const sendMessage = (text: string) =>
    addMessage({
      id: Date.now().toString(),
      name: store.name.split(" ")[0],
      text,
      time: timeNow(),
      mine: true,
    });
  // Локальный вход в текущем прототипе: сохраняем имя, email и флаги, затем показываем встречи.
  // Запроса на сервер и проверки учётной записи здесь нет.
  
  /**
   * Запоминает имя, email и флаг локального входа; серверную аутентификацию не выполняет.
   *
   * @param name - Имя участника или пользователя.
   * @param email - Адрес электронной почты пользователя.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const enterSession = (name: string, email: string) => {
    update({ name, email, session: true, onboarded: true });
    setScreen("meetings");
  };
  // Подтверждаем бронь выбранного ресторана, закрываем диалог и показываем завершённые встречи.
  
  /**
   * Подтверждает локальную бронь и открывает завершённые встречи.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const confirmCurrentBooking = () => {
    updateMeeting((m) => confirmBooking(m, booking.id));
    setDialog(null);
    setMeetingSection("completed");
    setScreen("meetings");
    showToast("success", "Бронь подтверждена. Встреча завершена");
  };
  // Фиксируем ресторан-лидер: сохраняем его ID во встрече и переводим её в статус selected.
  
  /**
   * Закрепляет ресторан-лидер за встречей и меняет её статус на selected.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const selectLeader = () => {
    updateMeeting((m) => ({
      ...m,
      status: "selected",
      restaurantId: getLeader(m).id,
    }));
    setDialog(null);
  };
  // Проверяем черновик профиля: trim убирает пробелы по краям, регулярное выражение проверяет формат email.
  // При ошибке return прекращает выполнение; при успехе сохраняем данные и закрываем диалог.
  
  /**
   * Проверяет имя и формат email, обновляет профиль и закрывает диалог.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const saveProfile = () => {
    if (!editName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      showToast("error", "Проверьте имя и электронную почту");
      return;
    }
    update({
      name: editName.trim(),
      email: editEmail.trim(),
    });
    setDialog(null);
  };
  // Проверяем, что имя не пустое и ещё не добавлено. Затем обновляем список участников встречи.
  // В текущем прототипе это локальное добавление имени, без отправки приглашения другому человеку.
  
  /**
   * Проверяет формат и уникальность имени, добавляет участника и закрывает приглашение.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const inviteParticipant = () => {
    const error = validateParticipant(inviteName, meeting.participants);
    if (error) {
      showToast("error", error);
      return;
    }
    updateMeeting((m) => ({
      ...m,
      participants: [...m.participants, inviteName],
    }));
    setInviteName("");
    setDialog(null);
    showToast("success", "Участник добавлен");
  };
  // Сбрасываем флаг входа и открываем экран авторизации; остальные данные store сохраняются.
  
  /**
   * Сбрасывает локальный флаг входа и открывает форму авторизации.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  const signOut = () => {
    update({ session: false });
    setScreen("login");
  };
  // Удаляем участника и его голос. filter создаёт список без нужного имени.
  // Для голосов: Object.entries превращает объект в пары [имя, голос], filter убирает пару участника,
  // Object.fromEntries собирает оставшиеся пары обратно в объект.
  
  /**
   * Удаляет участника и его голос из выбранной встречи.
   *
   * @param name - Имя участника или пользователя.
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function removeParticipant(name: string) {
    updateMeeting((m) => ({
      ...m,
      participants: m.participants.filter((x) => x !== name),
      votes: Object.fromEntries(
        Object.entries(m.votes).filter(([voter]) => voter !== name)
      ),
    }));
  }
  // Добавляем в текущий чат текст с названием и ценой ресторана-лидера, затем закрываем диалог вложений.
  
  /**
   * Добавляет в текущий чат предложение ресторана-лидера с ценой.
   *
   * @returns Результат операции; для обработчиков без результата — void.
   */
  function sharePlaceInChat() {
    addMessage({
      id: Date.now().toString(),
      name: store.name.split(" ")[0],
      text: `Предлагаю ${leader().name} · ${leader().price} ₽ / чел.`,
      time: timeNow(),
      mine: true,
    });
    setDialog(null);
  }
  // Возвращаем объект controller: обработчики, значения состояния, сеттеры и вычисленные данные.
  // Компоненты получают его через пропсы, читают нужные значения и вызывают функции при действиях пользователя.
  return {
    removeParticipant,
    sharePlaceInChat,
    saveMeeting,
    toggleMessageLike,
    sendMessage,
    enterSession,
    confirmCurrentBooking,
    selectLeader,
    saveProfile,
    inviteParticipant,
    signOut,
    fontsLoaded,
    fontError,
    store,
    loaded,
    screen,
    setScreen,
    selected,
    dialog,
    setDialog,
    booking,
    meetingSection,
    setMeetingSection,
    search,
    setSearch,
    inviteName,
    setInviteName,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    toast,
    showToast,
    dismissToast,
    cancelCurrentBooking,
    filterBudget,
    setFilterBudget,
    filterCuisine,
    setFilterCuisine,
    filterDistance,
    setFilterDistance,
    meeting,
    update,
    updateMeeting,
    addMessage,
    leader,
    matchingMeetings,
    openMeeting,
    book,
    share,
    vote,
    pickAttachment,
    pickAvatar,
    goBack,
    isTabs,
    title,
  };
}
// TypeScript выводит тип controller из результата хука автоматически.
// typeof получает тип функции, ReturnType берёт тип возвращаемого ею объекта.
export type AppController = ReturnType<typeof useAppController>;
