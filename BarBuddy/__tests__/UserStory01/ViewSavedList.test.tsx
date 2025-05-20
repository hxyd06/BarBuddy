import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../app/(tabs)/settings';

// Mock the router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

// Mock Firebase config
jest.mock('@/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user',
      email: 'test@example.com',
    },
  },
  db: {},
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      username: 'Test User',
      photoURL: null,
      role: '',
    }),
  }),
  setDoc: jest.fn(),
}));

// Mock Image Picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true, // no image picked
  }),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock Icon
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: any) => <Text>{name}</Text>,
  };
});

// ✅ Test
describe('SettingsScreen - Navigation to Saved Drinks', () => {
  it('navigates to /settings/saved when saved drinks button is pressed', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      const savedButton = getByText('Saved Drinks');
      fireEvent.press(savedButton);

      expect(mockPush).toHaveBeenCalledWith('/settings/saved');
    });
  });
});
