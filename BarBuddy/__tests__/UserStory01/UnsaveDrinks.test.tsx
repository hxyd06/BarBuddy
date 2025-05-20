import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        drinks: [
          {
            strDrink: 'Margarita',
            strDrinkThumb: 'https://example.com/margarita.jpg',
            strInstructions: 'Shake and serve.',
            strIngredient1: 'Tequila',
            strMeasure1: '1 oz',
          },
        ],
      }),
  })
) as jest.Mock;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ drink: 'Margarita' }),
}));

jest.mock('@/firebase/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'test-user' } },
  db: {},
  model: {
    generateContent: jest.fn(() => ({
      response: { text: () => 'AI tip' },
    })),
  },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, testID }: any) => <Text testID={testID}>{name}</Text>,
  };
});

// ✅ Define in outer scope
let mockDeleteDoc: jest.Mock;

describe('DrinkDetailScreen - Unsave Button', () => {
  beforeEach(() => {
    mockDeleteDoc = jest.fn();
    let getDocCallCount = 0;

    jest.doMock('firebase/firestore', () => {
      return {
        doc: jest.fn((...args) => ({ path: args.join('/') })),
        getDoc: jest.fn((ref) => {
          getDocCallCount++;
          if (ref.path.includes('savedRecipes')) {
            return Promise.resolve({
              exists: () => getDocCallCount === 1,
              data: () => ({}),
            });
          }
          if (ref.path.includes('users/test-user')) {
            return Promise.resolve({
              exists: () => true,
              data: () => ({ preferences: {} }),
            });
          }
          return Promise.resolve({ exists: () => false, data: () => ({}) });
        }),
        setDoc: jest.fn(),
        deleteDoc: mockDeleteDoc,
        collection: jest.fn(),
        getDocs: jest.fn().mockResolvedValue({ docs: [] }),
        updateDoc: jest.fn(),
        increment: jest.fn(),
      };
    });
  });

  it('removes a drink from saved list when tapping the save button again', async () => {
    const DrinkDetailScreen = require('../../app/drink/[drink]/index').default;

    const { getByTestId } = render(<DrinkDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon').props.children).toBe('checkmark');
    });

    fireEvent.press(getByTestId('toggle-save-button'));

    await waitFor(() => {
      expect(getByTestId('icon').props.children).toBe('bookmark-outline');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });
});
