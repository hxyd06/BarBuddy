import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { locationService } from '@/utils/locationService';

// Types for our place data
interface Place {
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
  opening_hours?: {
    open_now?: boolean;
  };
}

interface MapNativeProps {
  apiKey: string;
}

export default function MapNative({ apiKey }: MapNativeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<MapView>(null);
  
  // Get initial location and places
  useEffect(() => {
    getLocationAndPlaces();
  }, []);

  // Function to get location and nearby places
  const getLocationAndPlaces = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    
    const result = await locationService.getCurrentLocation();
    
    if (result.status === 'success' && result.location) {
      setLocation(result.location);
      fetchNearbyPlaces(result.location.coords.latitude, result.location.coords.longitude);
    } else if (result.status === 'denied') {
      setErrorMsg('Location permission is required to find bars near you. Please enable location permissions in your settings.');
      setIsLoading(false);
    } else if (result.status === 'unavailable') {
      setErrorMsg('Location services are not available. Please enable location services on your device.');
      setIsLoading(false);
    } else {
      setErrorMsg(result.errorMessage || 'Could not get your location.');
      setIsLoading(false);
    }
  };

  // Function to handle permission settings
  const handleOpenSettings = async () => {
    await locationService.openLocationSettings();
  };

  // Fetch nearby bars, restaurants and liquor stores
  const fetchNearbyPlaces = async (latitude: number, longitude: number) => {
    try {
      if (apiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&type=bar|restaurant|liquor_store&key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK') {
          setPlaces(data.results);
        } else {
          console.error('Places API Error:', data.status);
          setErrorMsg('Error fetching nearby places. Please try again later.');
        }
      } else {
        console.error('API Key is missing');
        setErrorMsg('Configuration error. Please contact support.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching places:', error);
      setErrorMsg('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  // Go to user's current location on the map
  const goToMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  };

  // Open directions
  const openDirections = (place: Place) => {
    const { lat, lng } = place.geometry.location;
    const url = Platform.OS === 'ios' 
      ? `maps://app?daddr=${lat},${lng}`
      : `google.navigation:q=${lat},${lng}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback if app-specific URL fails
          return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
        }
      })
      .catch(err => {
        console.error('Error opening directions:', err);
        Alert.alert('Error', 'Could not open directions. Please try again.');
      });
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  // Get icon based on place type
  const getPlaceIcon = (types: string[]) => {
    if (types.includes('bar')) return 'beer-outline';
    if (types.includes('restaurant')) return 'restaurant-outline';
    if (types.includes('liquor_store')) return 'wine-outline';
    return 'storefront-outline';
  };

  // Loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.text, { color: colors.text }]}>Finding bars near you...</Text>
      </SafeAreaView>
    );
  }

  // Error message
  if (errorMsg) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={50} color={colors.tint} />
        <Text style={[styles.text, { color: colors.text }]}>{errorMsg}</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.tint }]} 
          onPress={handleOpenSettings}
        >
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={true}
          >
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng
                }}
                title={place.name}
                description={place.vicinity}
                onPress={() => setSelectedPlace(place)}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name={getPlaceIcon(place.types)} size={16} color="white" />
                </View>
              </Marker>
            ))}
          </MapView>

          {/* My Location Button */}
          <TouchableOpacity 
            style={[styles.myLocationButton, { backgroundColor: colors.background }]} 
            onPress={goToMyLocation}
          >
            <Ionicons name="locate" size={24} color={colors.tint} />
          </TouchableOpacity>

          {/* Selected place info */}
          {selectedPlace && (
            <View style={[styles.placeDetails, { backgroundColor: colors.background }]}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setSelectedPlace(null)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <ScrollView style={styles.detailsScrollView}>
                <Text style={[styles.placeName, { color: colors.text }]}>{selectedPlace.name}</Text>
                <Text style={[styles.placeAddress, { color: colors.text }]}>{selectedPlace.vicinity}</Text>
                
                <View style={styles.placeMetaContainer}>
                  <View style={styles.placeTypeContainer}>
                    <Ionicons name={getPlaceIcon(selectedPlace.types)} size={16} color={colors.tint} />
                    <Text style={[styles.placeTypeText, { color: colors.text }]}>
                      {selectedPlace.types.includes('bar') ? 'Bar' : 
                       selectedPlace.types.includes('restaurant') ? 'Restaurant' : 
                       selectedPlace.types.includes('liquor_store') ? 'Liquor Store' : 'Place'}
                    </Text>
                  </View>
                  
                  {selectedPlace.rating && renderStars(selectedPlace.rating)}
                  
                  {selectedPlace.opening_hours?.open_now !== undefined && (
                    <View style={styles.openStatusContainer}>
                      <View style={[styles.statusDot, { 
                        backgroundColor: selectedPlace.opening_hours.open_now ? '#4CAF50' : '#F44336' 
                      }]} />
                      <Text style={[styles.openStatusText, { color: colors.text }]}>
                        {selectedPlace.opening_hours.open_now ? 'Open Now' : 'Closed'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={[styles.directionsButton, { backgroundColor: colors.tint }]}
                  onPress={() => openDirections(selectedPlace)}
                >
                  <Ionicons name="navigate" size={18} color="white" />
                  <Text style={styles.directionsText}>Get Directions</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  text: {
    fontSize: 16,
    margin: 20,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  placeDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    maxHeight: '40%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  detailsScrollView: {
    padding: 20,
  },
  placeName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  placeAddress: {
    fontSize: 16,
    marginBottom: 15,
    opacity: 0.7,
  },
  placeMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  placeTypeText: {
    marginLeft: 5,
    fontSize: 14,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginRight: 10,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  openStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  openStatusText: {
    fontSize: 14,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  directionsText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  markerContainer: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: '#6A0DAD', // Dark Purple
  },
});