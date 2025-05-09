import React from 'react';
import { Platform } from 'react-native';
import MapNative from './MapNative';
import MapWeb from './MapWeb';

interface MapImplementationProps {
  apiKey: string;
}

// This file serves as a fallback if the platform-specific files (.web.tsx or .native.tsx) aren't picked up
// It contains the same logic as our original conditional approach
export default function MapImplementation({ apiKey }: MapImplementationProps) {
  if (Platform.OS === 'web') {
    return <MapWeb apiKey={apiKey} />;
  } else {
    return <MapNative apiKey={apiKey} />;
  }
}