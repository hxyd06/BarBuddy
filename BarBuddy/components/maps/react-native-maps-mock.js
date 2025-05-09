// This is a mock module for react-native-maps on web
// It prevents "Importing native-only module" errors

export default {
    MapView: () => null,
    Marker: () => null,
    PROVIDER_GOOGLE: 'google',
  };
  
  export const MapView = () => null;
  export const Marker = () => null;
  export const PROVIDER_GOOGLE = 'google';