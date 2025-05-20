const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();

mockGetDoc.mockImplementation((ref) => {
  if (ref && ref._key && ref._key.path && ref._key.path.includes('savedRecipes')) {
    return Promise.resolve({ exists: () => false, data: () => ({}) });
  }
  return Promise.resolve({ exists: () => true, data: () => ({}) });
});

jest.mock('firebase/firestore', () => ({
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: mockGetDoc,
  doc: jest.fn(() => ({ _key: { path: 'users/test-user/savedRecipes/margarita' } })),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  updateDoc: jest.fn(),
  increment: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ drink: 'Margarita' }),
}));

jest.mock('@/firebase/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'test-user' } },
  db: {},
  model: {
    generateContent: jest.fn(() => ({
      response: { text: () => 'AI generated tip' }
    })),
  },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: any) => <Text>{name}</Text>,
  };
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DrinkDetailScreen from '../../app/drink/[drink]/index';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      drinks: [{
        strDrink: 'Margarita',
        strDrinkThumb: 'https://example.com/margarita.jpg',
        strInstructions: 'Shake and serve.',
        strIngredient1: 'Tequila',
        strMeasure1: '1 oz',
      }],
    }),
  })
) as jest.Mock;

describe('DrinkDetailScreen - Save Button', () => {
  it('calls setDoc when saving drink', async () => {
    const { getByText } = render(<DrinkDetailScreen />);

    await waitFor(() => {
      expect(getByText('Margarita')).toBeTruthy();
    });

    fireEvent.press(getByText('bookmark-outline'));

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });
});
