import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Linking, Share } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { io } from "socket.io-client";
import {
  api,
  accessToken,
  refreshToken,
  restoreSession,
  serverUrl,
  setTokens,
  upload,
} from "../../shared/api/client";
import type {
  RemoteMeeting,
  RemoteMessage,
  RemoteRestaurant,
  RemoteUser,
  RemoteDiscovery,
} from "../../shared/api/contracts";
import {
  getLeader,
  restaurantView,
  replaceCatalog,
  type Meeting,
  type Restaurant,
  type Store,
} from "../../entities/meeting";
import { chooseAttachment, chooseAvatar } from "../../shared/api/device";
import type { Screen } from "../../shared/config/screens";
import type { DialogName } from "../../shared/config/dialogs";
import type { ToastNotification, ToastType } from "../../shared/ui/Toast.types";
import { initialStore } from "./initialStore";
import { exportCalendar } from "../../features/calendar-export";

/** Координатор интерфейса: вызывает API и отображает подтверждённые сервером данные.
 * Права, переходы статусов и подсчёт победителя проверяются серверными сервисами. */
export function useAppController() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require("../../../assets/fonts/Inter.ttf"),
  });
  const [store, setStore] = useState<Store>(initialStore);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>("intro");
  const [selected, setSelected] = useState("");
  const [chatOrigin, setChatOrigin] = useState<"list" | "meeting">("list");
  const [dialog, setDialog] = useState<DialogName>(null);
  const [booking, setBooking] = useState<Restaurant>();
  const [meetingSection, setMeetingSection] = useState<"active" | "completed">(
    "active",
  );
  const [search, setSearch] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [filterBudget, setFilterBudget] = useState("Все");
  const [filterCuisine, setFilterCuisine] = useState<string[]>([]);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [busy, setBusy] = useState(false);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [discoveryError, setDiscoveryError] = useState("");
  const attemptedRecommendations = useRef(new Set<string>());
  const requestCount = useRef(0);
  const currentUser = useRef("");
  const selectedRef = useRef("");
  const inviteToken = useRef<string | null>(null);
  const generation = useRef(0);
  selectedRef.current = selected;
  const showToast = useCallback(
    (type: ToastType, message: string) =>
      setToast({ id: Date.now(), type, message }),
    [],
  );
  /** Закрывает уведомление. */
  const dismissToast = () => setToast(null);
  const loadMessages = useCallback(async (id: string, before?: string) => {
    const sessionGeneration = generation.current;
    const result = await api<{
      items: RemoteMessage[];
      nextCursor: string | null;
    }>(`/meetings/${id}/messages${before ? `?before=${before}` : ""}`);
    if (generation.current !== sessionGeneration) return;
    const items = result.items.map((m) => ({
      ...m,
      time: new Date(m.createdAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      kind: m.kind === "system" || m.kind === "selected" ? m.kind : undefined,
      mine: m.senderId === currentUser.current,
      liked: m.reactions.some((r) => r.userId === currentUser.current),
      otherLikes: m.reactions.filter((r) => r.userId !== currentUser.current)
        .length,
    }));
    setStore((s) => ({
      ...s,
      messages: {
        ...s.messages,
        [id]: before ? [...items, ...(s.messages[id] ?? [])] : items,
      },
    }));
    setMessageCursors(cursors => ({ ...cursors, [id]: result.nextCursor }));
  }, []);
  const [messageCursors, setMessageCursors] = useState<Record<string, string | null>>({});
  const reload = useCallback(async () => {
    const sessionGeneration = generation.current;
    const [user, meetings, catalog] = await Promise.all([
      api<RemoteUser>("/users/me"),
      api<RemoteMeeting[]>("/meetings"),
      api<RemoteRestaurant[]>("/restaurants"),
    ]);
    if (generation.current !== sessionGeneration) return;
    currentUser.current = user.id;
    replaceCatalog(catalog.map(restaurantView));
    const mapped: Meeting[] = meetings.map((m) => {
      const local = new Date(
        new Date(m.startsAt).getTime() + 10800000,
      ).toISOString();
      const preference = m.members.find((p) => p.userId === user.id)!;
      return {
        id: m.id,
        updatedAt: m.updatedAt,
        lastMessage: m.lastMessage,
        unavailableCandidateCount: m.unavailableCandidateCount,
        preferencesKey: JSON.stringify([
          m.city,
          m.format,
          m.members.map((p) => [p.userId, p.budget, p.cuisines]).sort(),
        ]),
        ownerId: m.ownerId,
        title: m.title,
        date: local.slice(0, 10),
        time: local.slice(11, 16),
        participants: m.members.map((p) => p.user.name),
        members: m.members.map((p) => ({ id: p.userId, name: p.user.name })),
        votes: Object.fromEntries(
          m.candidates.flatMap((c) =>
            c.votes.map((v) => [v.userId, v.restaurantId]),
          ),
        ),
        candidates: m.candidates.map((c) => restaurantView(c.restaurant)),
        status: m.status,
        restaurantId: m.restaurantId ?? undefined,
        bookedAt: m.bookedAt ?? undefined,
        completedAt: m.completedAt ?? undefined,
        budget: preference.budget,
        cuisines: JSON.parse(preference.cuisines),
        city: m.city,
        format: m.format,
      };
    });
    setStore((s) => ({
      ...s,
      ...user,
      userId: user.id,
      session: true,
      onboarded: true,
      meetings: mapped,
      messages: Object.fromEntries(
        Object.entries(s.messages).filter(([id]) =>
          mapped.some((m) => m.id === id),
        ),
      ),
    }));
    setSelected((id) =>
      mapped.some((m) => m.id === id) ? id : (mapped[0]?.id ?? ""),
    );
  }, [showToast]);
  /** Выполняет действие с обработкой ошибок. */
  async function run(action: () => Promise<void>) {
    requestCount.current++;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      showToast(
        "error",
        e instanceof Error ? e.message : "Не удалось выполнить действие",
      );
    } finally {
      requestCount.current--;
      setBusy(requestCount.current > 0);
    }
  }
  useEffect(() => {
    void run(async () => {
      const onboarded = await AsyncStorage.getItem("meetly.onboarded");
      if (await restoreSession()) {
        await reload();
        setScreen("meetings");
      } else {
        setStore((s) => ({ ...s, onboarded: !!onboarded }));
        setScreen(onboarded ? "login" : "intro");
      }
    }).finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!store.session) return;
    const socket = io(serverUrl, {
      auth: (cb) => cb({ token: accessToken() }),
      transports: ["websocket"],
    });
    /** Загружает актуальные данные пользователя и встреч. */
    const refresh = () =>
      void run(async () => {
        await reload();
        if (selectedRef.current) await loadMessages(selectedRef.current);
      });
    socket.on("meeting.changed", refresh);
    socket.on("connect", refresh);
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect")
        void api("/users/me")
          .then(() => socket.connect())
          .catch(() => {});
    });
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      socket.disconnect();
      subscription.remove();
    };
  }, [store.session, reload, loadMessages]);
  useEffect(() => {
    if (selected && store.session) void run(() => loadMessages(selected));
  }, [selected, store.session, loadMessages]);
  useEffect(() => {
    /** Принимает приглашение по токену. */
    const accept = (url: string) => {
      if (!url.startsWith("meetly://invite")) return;
      const token = new URL(url).searchParams.get("token");
      if (!token) return;
      inviteToken.current = token;
      if (currentUser.current) void run(acceptInvitation);
    };
    Linking.getInitialURL().then((url) => {
      if (url) accept(url);
    });
    const sub = Linking.addEventListener("url", (e) => accept(e.url));
    return () => sub.remove();
  }, []);
  /** Обрабатывает принятие приглашения пользователем. */
  async function acceptInvitation() {
    if (!inviteToken.current) return;
    const r = await api<{ meetingId: string }>(
      "/meetings/invitations/accept",
      "POST",
      { token: inviteToken.current },
    );
    inviteToken.current = null;
    await reload();
    setSelected(r.meetingId);
    setScreen("detail");
  }
  const meeting = store.meetings.find((m) => m.id === selected);
  useEffect(() => {
    if (!meeting || meeting.status !== "voting" || !store.session) return;
    const key = meeting.id + meeting.preferencesKey;
    if (attemptedRecommendations.current.has(key)) return;
    attemptedRecommendations.current.add(key);
    setDiscoveryBusy(true);
    setDiscoveryError("");
    let active = true;
    void api<RemoteDiscovery>(
      `/meetings/${meeting.id}/recommendations/apply`,
      "POST",
      {},
    )
      .then(async (result) => {
        if (!active) return;
        setDiscoveryError(result.warning ?? "");
        if (result.changed) await reload();
      })
      .catch((e) => {
        if (active)
          setDiscoveryError(
            e instanceof Error ? e.message : "Не удалось подобрать места",
          );
      })
      .finally(() => {
        if (active) setDiscoveryBusy(false);
      });
    return () => {
      active = false;
    };
  }, [meeting?.id, meeting?.preferencesKey, store.session, reload]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (dialog) {
        setDialog(null);
        return true;
      }
      if (!["intro", "login", "register", "meetings"].includes(screen)) {
        setScreen(screen === "chat" ? (chatOrigin === "list" ? "chats" : "detail") : "meetings");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [dialog, screen, chatOrigin]);
  /** Возвращает текущую встречу или сообщает об отсутствии выбора. */
  const requireMeeting = () => {
    if (!meeting) throw new Error("Сначала создайте или выберите встречу");
    return meeting;
  };
  /** Выполняет изменение на сервере и обновляет данные. */
  const mutate = (path: string, method: string, body?: unknown) =>
    run(async () => {
      await api(path, method, body);
      await reload();
      if (selected) await loadMessages(selected);
    });
  /** Обновляет поля состояния приложения. */
  const update = (patch: Partial<Store>) => {
    if (patch.onboarded !== undefined) {
      void AsyncStorage.setItem("meetly.onboarded", "1");
      setStore((s) => ({ ...s, onboarded: patch.onboarded! }));
      return;
    }
    void run(async () => {
      await api("/users/me", "PATCH", patch);
      await reload();
    });
  };
  /** Выполняет вход или регистрацию. */
  const enterSession = (name: string, email: string, password: string) =>
    run(async () => {
      const result = await api<{ accessToken: string; refreshToken: string }>(
        screen === "register" ? "/auth/register" : "/auth/login",
        "POST",
        screen === "register" ? { name, email, password } : { email, password },
      );
      await setTokens(result);
      generation.current++;
      await reload();
      await AsyncStorage.setItem("meetly.onboarded", "1");
      setScreen("meetings");
      await acceptInvitation();
    });
  /** Завершает текущую сессию. */
  const signOut = () =>
    run(async () => {
      const token = refreshToken();
      if (token)
        await api("/auth/logout", "POST", { refreshToken: token }).catch(() =>
          showToast(
            "info",
            "Локальный выход выполнен. Сервер недоступен, сессия завершится по сроку действия",
          ),
        );
      generation.current++;
      await setTokens(null);
      currentUser.current = "";
      setStore({ ...initialStore, onboarded: true });
      replaceCatalog([]);
      setSelected("");
      setMessageCursors({});
      setDialog(null);
      setScreen("login");
    });
  /** Открывает подробности встречи. */
  const openMeeting = (id: string) => {
    setSelected(id);
    setScreen("detail");
  };
  /** Открывает переписку встречи. */
  const openChat = (id: string, origin: "list" | "meeting" = "list") => {
    setChatOrigin(origin);
    setSelected(id);
    setScreen("chat");
  };
  /** Открывает диалог бронирования заведения. */
  const book = (r: Restaurant | undefined) => {
    if (!r) {
      showToast("info", "Сначала предложите заведение и завершите голосование");
      return;
    }
    setBooking(r);
    setDialog("booking");
  };
  /** Возвращает лидера голосования. */
  const leader = () => (meeting ? getLeader(meeting) : undefined);
  /** Сохраняет встречу через API. */
  const saveMeeting = (m: Meeting) =>
    run(async () => {
      const body = {
        title: m.title,
        date: m.date,
        time: m.time,
        budget: m.budget,
        cuisines: m.cuisines,
        city: m.city ?? "Москва",
        format: m.format,
      };
      if (screen === "edit") {
        const original = requireMeeting();
        if (original.ownerId === currentUser.current)
          await api(`/meetings/${m.id}`, "PATCH", body);
        else
          await api(`/meetings/${m.id}/preferences`, "PUT", {
            budget: m.budget,
            cuisines: m.cuisines,
          });
      } else {
        const created = await api<{ id: string }>("/meetings", "POST", body);
        setSelected(created.id);
      }
      await reload();
      setScreen("detail");
    });
  /** Отправляет голос за заведение. */
  const vote = (id: string) => {
    if (meeting)
      void mutate(`/meetings/${meeting.id}/vote`, "PUT", { restaurantId: id });
  };
  /** Удаляет вариант заведения из голосования. */
  const removeCandidate = (id: string) => {
    if (meeting) void mutate(`/meetings/${meeting.id}/candidates/${id}`, "DELETE");
  };
  /** Подтверждает выбор победителя на сервере. */
  const selectLeader = () =>
    run(async () => {
      const m = requireMeeting();
      await api(`/meetings/${m.id}/select`, "POST", {});
      await reload();
      setDialog(null);
    });
  /** Подтверждает бронирование. */
  const confirmCurrentBooking = () =>
    run(async () => {
      const m = requireMeeting();
      if (!booking) throw new Error("Выберите заведение");
      await api(`/meetings/${m.id}/booking`, "POST", {
        restaurantId: booking.id,
      });
      await reload();
      setDialog(null);
      setMeetingSection("completed");
      setScreen("meetings");
    });
  /** Отменяет бронирование. */
  const cancelCurrentBooking = () =>
    run(async () => {
      const m = requireMeeting();
      await api(`/meetings/${m.id}/booking`, "DELETE");
      await reload();
      setDialog(null);
      setMeetingSection("active");
      setScreen("meetings");
    });
  /** Добавляет участника встречи по email. */
  const inviteParticipant = () =>
    run(async () => {
      const m = requireMeeting();
      await api(`/meetings/${m.id}/members`, "POST", {
        email: inviteName.trim(),
      });
      await reload();
      setInviteName("");
      setDialog(null);
    });
  /** Удаляет участника встречи. */
  const removeParticipant = (id: string) => {
    if (meeting) void mutate(`/meetings/${meeting.id}/members/${id}`, "DELETE");
  };
  /** Создаёт ссылку приглашения и открывает меню отправки. */
  const share = () =>
    run(async () => {
      const m = requireMeeting();
      const invite = await api<{ url: string }>(
        `/meetings/${m.id}/invitations`,
        "POST",
        {},
      );
      await Share.share({
        message: `Приглашение на встречу «${m.title}»: ${invite.url}`,
      });
    });
  /** Отправляет сообщение текущей встречи. */
  const sendMessage = (text: string) =>
    run(async () => {
      const m = requireMeeting();
      await api(`/meetings/${m.id}/messages`, "POST", { text });
      await loadMessages(m.id);
    });
  /** Переключает реакцию на сообщение. */
  const toggleMessageLike = (id: string) => {
    const msg = store.messages[selected]?.find((m) => m.id === id);
    if (meeting && msg)
      void mutate(`/meetings/${meeting.id}/messages/${id}/reaction`, "PUT", {
        liked: !msg.liked,
      });
  };
  /** Выбирает и загружает вложение для сообщения. */
  const pickAttachment = async () =>
    run(async () => {
      const m = requireMeeting();
      const a = await chooseAttachment();
      if (!a) return;
      const f = await upload(a.uri, a.name, a.mimeType, m.id);
      await api(`/meetings/${m.id}/messages`, "POST", {
        text: a.name,
        fileId: f.id,
      });
      await loadMessages(m.id);
      setDialog(null);
    });
  /** Выбирает и загружает изображение профиля. */
  const pickAvatar = async () =>
    run(async () => {
      const image = await chooseAvatar();
      if (!image) return;
      const f = await upload(image.uri, image.name, image.mimeType);
      await api("/users/me", "PATCH", { avatarId: f.id });
      await reload();
    });
  /** Сохраняет изменения профиля. */
  const saveProfile = () =>
    run(async () => {
      await api("/users/me", "PATCH", {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      await reload();
      setDialog(null);
    });
  /** Отправляет предложение заведения в чат. */
  const sharePlaceInChat = () =>
    run(async () => {
      const place = leader();
      if (!place) throw new Error("Сначала предложите место");
      await sendMessage(
        `Предлагаю ${place.name}${place.address ? `, ${place.address}` : ""}`,
      );
      setDialog(null);
    });
  /** Добавляет заведение во встречу из списка карты либо в текущую встречу. */
  const propose = (r: Restaurant, meetingId?: string) =>
    run(async () => {
      const m = meetingId === undefined
        ? requireMeeting()
        : store.meetings.find(item => item.id === meetingId);
      if (!m) throw new Error("Встреча больше недоступна");
      if (m.status !== "voting") throw new Error("Голосование в этой встрече завершено");
      await api(`/meetings/${m.id}/candidates`, "POST", { restaurantId: r.id });
      await reload();
      showToast("success", "Место добавлено в голосование");
    });
  /** Обновляет автоматические варианты заведений. */
  const recommend = () =>
    run(async () => {
      const m = requireMeeting();
      const result = await api<RemoteDiscovery>(
        `/meetings/${m.id}/recommendations/apply`,
        "POST",
        {},
      );
      setDiscoveryError(result.warning ?? "");
      await reload();
    });
  /** Запрашивает и экспортирует календарное событие. */
  const exportMeeting = (id: string) =>
    run(async () => {
      const text = await api<string>(`/meetings/${id}/calendar.ics`);
      await exportCalendar(text, id);
    });
  /** Загружает предыдущую страницу сообщений. */
  const loadOlderMessages = () =>
    run(async () => {
      if (messageCursors[selected] && selected)
        await loadMessages(selected, messageCursors[selected]!);
    });
  /** Возвращает на предыдущий экран. */
  const goBack = () => setScreen(screen === "chat" ? (chatOrigin === "list" ? "chats" : "detail") : screen === "edit" ? "detail" : "meetings");
  const isTabs = ["meetings", "map", "chat", "chats", "profile"].includes(screen);
  const title =
    screen === "new"
      ? "Новая встреча"
      : screen === "edit"
        ? "Предпочтения встречи"
        : screen === "chat"
          ? (meeting?.title ?? "Чат")
          : "";
  const matchingMeetings = store.meetings.filter(
    (m) =>
      (meetingSection === "completed"
        ? m.status === "completed"
        : m.status !== "completed") &&
      m.title.toLowerCase().includes(search.toLowerCase()),
  );
  return {
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
    filterOpenNow, setFilterOpenNow, filterQuery, setFilterQuery,
    filterBudget,
    setFilterBudget,
    filterCuisine,
    setFilterCuisine,
    meeting,
    update,
    leader,
    matchingMeetings,
    openMeeting,
    openChat,
    removeCandidate,
    book,
    share,
    vote,
    pickAttachment,
    pickAvatar,
    goBack,
    isTabs,
    title,
    saveMeeting,
    toggleMessageLike,
    sendMessage,
    enterSession,
    confirmCurrentBooking,
    cancelCurrentBooking,
    selectLeader,
    saveProfile,
    inviteParticipant,
    removeParticipant,
    sharePlaceInChat,
    signOut,
    fontsLoaded,
    fontError,
    busy,
    propose,
    recommend,
    exportMeeting,
    loadOlderMessages,
    hasOlderMessages: !!messageCursors[selected],
    discoveryBusy,
    discoveryError,
    refreshMeetings: reload,
  };
}
export type AppController = ReturnType<typeof useAppController>;
