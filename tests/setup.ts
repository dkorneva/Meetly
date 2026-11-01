jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Тестируем реакции приложения, не открывая браузер и системные окна устройства.
jest.mock("../src/shared/api/device", () => ({
  chooseAttachment: jest.fn(async () => null),
  chooseAvatar: jest.fn(async () => null),
  shareText: jest.fn(async () => ({})),
  openExternalLink: jest.fn(async () => undefined),
}));
