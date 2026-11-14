jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

// Тестируем реакции приложения, не открывая браузер и системные окна устройства.
jest.mock("../src/shared/api/device", () => ({
  chooseAttachment: jest.fn(async () => null),
  chooseAvatar: jest.fn(async () => null),
  openExternalLink: jest.fn(async () => undefined),
}));
jest.mock("../src/shared/api/client", () => ({
  api: jest.fn(async (path: string) => path === "/restaurants/filters" ? require("./catalogFilters").catalogFilters : []),
  restoreSession: jest.fn(async () => false),
  setTokens: jest.fn(async () => {}),
  accessToken: jest.fn(() => "access"),
  refreshToken: jest.fn(() => "refresh"),
  serverUrl: "http://localhost:3000",
  upload: jest.fn(),
}));
jest.mock("../src/features/calendar-export/lib/exportCalendar", () => ({
  exportCalendar: jest.fn(async () => {}),
}));
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({ on: jest.fn(), disconnect: jest.fn() })),
}));
jest.mock("react-native-webview", () => ({
  __esModule: true,
  default: require("react-native").View,
}));
jest.mock("../src/shared/ui/RestaurantMap", () => ({
  __esModule: true,
  default: require("react-native").View,
}));
