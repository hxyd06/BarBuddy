import { Linking, Alert, Platform } from 'react-native';

export interface MapPlace {
  id: string;
  name: string;
  vicinity: string;
  rating: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  open_now?: boolean;
}

export interface NavigationOptions {
  useInApp?: boolean;
}

export const enhancedNavigationService = {
  /**
   * Show navigation options popup ; 2nd providing nav options
   */
  showNavigationOptions: (
    place: MapPlace,
    userLocation?: { latitude: number; longitude: number }
  ) => {
    const options = Platform.OS === 'ios' 
      ? ['Apple Maps', 'Google Maps', 'In-App Directions', 'Cancel']
      : ['Google Maps', 'In-App Directions', 'Cancel'];

    Alert.alert(
      'Choose Navigation Method',
      `Get directions to ${place.name}`,
      [
        ...options.slice(0, -2).map((option) => ({
          text: option,
          onPress: () => {
            if (option === 'In-App Directions') {
              enhancedNavigationService.showInAppDirections(place, userLocation);
            } else {
              const appPreference = option === 'Apple Maps' ? 'apple' : 'google';
              enhancedNavigationService.openExternalMaps(place, { appPreference });
            }
          }
        })),
        {
          text: 'In-App Directions',
          onPress: () => enhancedNavigationService.showInAppDirections(place, userLocation)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  },

  /**
   * Open external maps app 1&2nd selecting location & nav options
   */
  openExternalMaps: async (
    place: MapPlace,
    options: { appPreference?: 'apple' | 'google' } = {}
  ): Promise<boolean> => {
    try {
      const { lat, lng } = place.geometry.location;
      let url = '';

      // simplier , only Apple Maps and Google Maps
      if (Platform.OS === 'ios' && options.appPreference === 'apple') {
        // Apple Maps
        url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
      } else if (Platform.OS === 'android') {
        // Android - Google Maps navigation
        url = `google.navigation:q=${lat},${lng}`;
      } else {
        // Default to Google Maps web/app
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Could not open maps application');
      return false;
    }
  },

  /**
   * Show detailed in-app directions with live-like instructions ;3rd locServ for directions
   */
  showInAppDirections: (
    place: MapPlace,
    userLocation?: { latitude: number; longitude: number }
  ) => {
    if (!userLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to get turn-by-turn directions.',
        [{ text: 'OK' }]
      );
      return;
    }

    const directions = enhancedNavigationService.generateDetailedDirections(place, userLocation);
    
    Alert.alert(
      '🧭 Live Directions',
      directions,
      [
        { 
          text: 'Open in Google Maps', 
          onPress: () => enhancedNavigationService.openExternalMaps(place, { appPreference: 'google' })
        },
        { text: 'Close', style: 'default' }
      ],
      { cancelable: true }
    );
  },

  /**
   * Generate detailed step-by-step directions; 3rd
   */
  generateDetailedDirections: (
    place: MapPlace,
    userLocation: { latitude: number; longitude: number }
  ): string => {
    // Calculate direction and distance
    const latDiff = place.geometry.location.lat - userLocation.latitude;
    const lonDiff = place.geometry.location.lng - userLocation.longitude;
    
    // Calculate primary direction
    let primaryDirection = '';
    let secondaryDirection = '';
    
    if (Math.abs(latDiff) > Math.abs(lonDiff)) {
      primaryDirection = latDiff > 0 ? 'North' : 'South';
      secondaryDirection = lonDiff > 0 ? 'East' : 'West';
    } else {
      primaryDirection = lonDiff > 0 ? 'East' : 'West';
      secondaryDirection = latDiff > 0 ? 'North' : 'South';
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = latDiff * Math.PI / 180;
    const dLon = lonDiff * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(place.geometry.location.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    const distanceText = distance < 1 
      ? `${Math.round(distance * 1000)} meters`
      : `${distance.toFixed(1)} km`;

    // Generate step-by-step instructions (simplified but detailed)
    const steps = [
      `1. 🚗 Start heading ${primaryDirection}`,
      `2. 📍 Continue for approximately ${distanceText}`,
      `3. 👀 Look for ${place.name} on your ${secondaryDirection.toLowerCase()}`,
      `4. 🅿️ Destination: ${place.vicinity}`
    ];

    const instructions = steps.join('\n\n');
    
    const placeInfo = [
      `📍 ${place.name}`,
      `📮 ${place.vicinity}`,
      place.rating ? `⭐ ${place.rating.toFixed(1)}/5` : '',
      place.open_now !== undefined ? (place.open_now ? '🟢 Open Now' : '🔴 Currently Closed') : ''
    ].filter(Boolean).join('\n');

    return `${placeInfo}\n\n📋 DIRECTIONS:\n${instructions}\n\n💡 For live turn-by-turn navigation, open in Google Maps.`;
  },

  /**
   * simple text directions - for quick info button
   */
  getSimpleDirections: (
    place: MapPlace,
    userLocation?: { latitude: number; longitude: number }
  ): string => {
    if (!userLocation) {
      return `Navigate to ${place.name}\n📍 ${place.vicinity}\n\nPlease enable location services for detailed directions.`;
    }

    // Calculate basic direction and distance
    const latDiff = place.geometry.location.lat - userLocation.latitude;
    const lonDiff = place.geometry.location.lng - userLocation.longitude;
    
    let direction = '';
    if (Math.abs(latDiff) > Math.abs(lonDiff)) {
      direction = latDiff > 0 ? 'North' : 'South';
    } else {
      direction = lonDiff > 0 ? 'East' : 'West';
    }

    // Calculate distance
    const R = 6371; // Earth's radius in km
    const dLat = latDiff * Math.PI / 180;
    const dLon = lonDiff * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(place.geometry.location.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    const distanceText = distance < 1 
      ? `${Math.round(distance * 1000)} meters`
      : `${distance.toFixed(1)} km`;

    return `🧭 Head ${direction} towards ${place.name}\n\n📏 Distance: ${distanceText}\n📍 Address: ${place.vicinity}\n\n⭐ Rating: ${place.rating ? place.rating.toFixed(1) + '/5' : 'Not rated'}\n\n${place.open_now !== undefined ? (place.open_now ? '🟢 Open Now' : '🔴 Currently Closed') : ''}`;
  }
};