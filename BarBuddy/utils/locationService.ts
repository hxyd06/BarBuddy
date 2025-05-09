import * as Location from 'expo-location';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface LocationResult {
  status: 'success' | 'error' | 'denied' | 'unavailable';
  location?: Location.LocationObject;
  errorMessage?: string;
}

/**
 * Service to handle location permissions and retrieval across platforms
 */
export const locationService = {
  /**
   * Request location permission and get current location
   */
  getCurrentLocation: async (): Promise<LocationResult> => {
    try {
      // Check if location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        return {
          status: 'unavailable',
          errorMessage: 'Location services are not enabled on your device'
        };
      }

      // Request foreground permissions based on platform
      let { status } = await requestPermission();
      
      // If permission was denied, return immediately
      if (status !== 'granted') {
        return {
          status: 'denied',
          errorMessage: 'Permission to access location was denied'
        };
      }

      // Get current location with appropriate accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: getPlatformAccuracy(),
      });

      return {
        status: 'success',
        location,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return {
        status: 'error',
        errorMessage: 'An error occurred while getting your location'
      };
    }
  },

  /**
   * Check current permission status
   */
  checkPermissionStatus: async (): Promise<Location.PermissionStatus> => {
    return await Location.getForegroundPermissionsAsync()
      .then(({ status }) => status);
  },

  /**
   * Open device settings to allow user to enable location permissions
   */
  openLocationSettings: async (): Promise<void> => {
    console.warn('openSettings is not available in expo-location. Please guide the user to manually open device settings.');
  },
};

/**
 * Get appropriate location accuracy based on platform
 */
function getPlatformAccuracy(): Location.Accuracy {
  if (Platform.OS === 'android') {
    return Location.Accuracy.Balanced;
  } else if (Platform.OS === 'ios') {
    return Location.Accuracy.Balanced;
  } else {
    // Web
    return Location.Accuracy.Low;
  }
}

/**
 * Request appropriate permission based on platform
 */
async function requestPermission(): Promise<{ status: Location.PermissionStatus }> {
  // For web, we only request once when needed
  if (Platform.OS === 'web') {
    return await Location.requestForegroundPermissionsAsync();
  }

  // For native platforms, use the appropriate permission request
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Check if we already have permission
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    // Return immediately if we already have permission
    if (existingStatus === 'granted') {
      return { status: existingStatus };
    }
    
    // Otherwise request permission
    return await Location.requestForegroundPermissionsAsync();
  }
  
  // Fallback
  return await Location.requestForegroundPermissionsAsync();
}

/**
 * Gets location provider information - useful for debugging
 */
export async function getProviderStatus(): Promise<Location.LocationProviderStatus> {
  return await Location.getProviderStatusAsync();
}

/**
 * Determines if a specific location permission is available on this device/platform
 */
export function hasLocationPermissionDefinedInManifest(permission: string): boolean {
  if (Platform.OS !== 'android') return true;
  
  // For Android, check if the permission is in the manifest
  const manifestPermissions = Constants.expoConfig?.android?.permissions || [];
  return manifestPermissions.includes(permission);
}