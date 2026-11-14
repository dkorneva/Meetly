import type { AppController } from "../src/app/model/useAppController";
import type { Store, Meeting, Restaurant } from "../src/entities/meeting";
import { restaurants, initialMeetings, initialMessages } from "./data";
import { initialStore } from "../src/app/model/initialStore";

/** Новый независимый набор данных и обработчиков для каждого теста. */
type ControllerFixture = AppController & {
  meeting: Meeting;
  booking: Restaurant;
};
export function makeController(
  overrides: Partial<ControllerFixture> = {},
): ControllerFixture {
  const store = JSON.parse(
    JSON.stringify({
      ...initialStore,
      name: "Аня Смирнова",
      email: "anya@example.com",
      meetings: initialMeetings,
      messages: { team: initialMessages },
    }),
  ) as Store;
  store.meetings = store.meetings.map((m) => ({
    ...m,
    ownerId: "Аня",
    members: m.participants.map((name) => ({ id: name, name })),
    candidates: restaurants,
  }));
  return {
    removeParticipant: jest.fn(),
    sharePlaceInChat: jest.fn(),
    saveMeeting: jest.fn(),
    toggleMessageLike: jest.fn(),
    sendMessage: jest.fn(),
    enterSession: jest.fn(),
    confirmCurrentBooking: jest.fn(),
    selectLeader: jest.fn(),
    saveProfile: jest.fn(),
    inviteParticipant: jest.fn(),
    signOut: jest.fn(),
    fontsLoaded: true,
    fontError: null,
    store: store,
    loaded: true,
    screen: "meetings",
    setScreen: jest.fn(),
    selected: store.meetings[0].id,
    dialog: null,
    setDialog: jest.fn(),
    booking: restaurants[0],
    meetingSection: "active",
    setMeetingSection: jest.fn(),
    search: "",
    setSearch: jest.fn(),
    inviteName: "",
    setInviteName: jest.fn(),
    editName: store.name,
    setEditName: jest.fn(),
    editEmail: store.email,
    setEditEmail: jest.fn(),
    toast: null,
    showToast: jest.fn(),
    dismissToast: jest.fn(),
    cancelCurrentBooking: jest.fn(),
    filterOpenNow: false, setFilterOpenNow: jest.fn(), filterQuery: "", setFilterQuery: jest.fn(),
    filterBudget: "Все",
    setFilterBudget: jest.fn(),
    filterCuisine: [],
    setFilterCuisine: jest.fn(),
    meeting: store.meetings[0],
    update: jest.fn(),
    busy: false,
    propose: jest.fn(),
    recommend: jest.fn(),
    exportMeeting: jest.fn(),
    loadOlderMessages: jest.fn(),
    hasOlderMessages: false,
    discoveryBusy: false,
    discoveryError: "",
    refreshMeetings: jest.fn(async () => {}),
    leader: jest.fn(() => restaurants[0]),
    matchingMeetings: store.meetings,
    openMeeting: jest.fn(),
    openChat: jest.fn(),
    removeCandidate: jest.fn(),
    book: jest.fn(),
    share: jest.fn(),
    vote: jest.fn(),
    pickAttachment: jest.fn(async () => {}),
    pickAvatar: jest.fn(async () => {}),
    goBack: jest.fn(),
    isTabs: true,
    title: "",
    ...overrides,
  };
}
