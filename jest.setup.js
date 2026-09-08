// expo-sqlite mock — avoid native module errors in Jest
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(),
      runAsync: jest.fn(),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
      closeAsync: jest.fn(),
    })
  ),
  SQLiteDatabase: jest.fn(),
}));

// expo-router mock
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Link: ({ children }) => children,
  Stack: { Screen: jest.fn() },
  Tabs: { Screen: jest.fn() },
}));

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Silence noisy console.warn from native mocks in test output
global.console = {
  ...console,
  warn: jest.fn(),
};
