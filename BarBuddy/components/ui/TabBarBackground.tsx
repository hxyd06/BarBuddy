// This is a shim for web and Android where the tab bar is generally opaque.
import { BlurView } from 'expo-blur';
import { View, StyleSheet } from 'react-native';

export default function TabBarBackground() {
  return (
    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(41, 41, 103, 0.9)',
        }}
      />
    </BlurView>
  );
}
export function useBottomTabOverflow() {
  return 0;
}

