jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn().mockReturnValue(true),
}));