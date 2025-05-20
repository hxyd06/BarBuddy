// BarBuddy/__mocks__/@expo/vector-icons.tsx
import React from 'react';
import { Text } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export const Ionicons = ({ name }: IconProps) => {
  return <Text>{`Icon: ${name}`}</Text>;
};