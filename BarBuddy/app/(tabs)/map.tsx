import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { locationService } from '../../utils/locationService';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';

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
  open_now?: boolean;
}

export default function MapScreen() {
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
    if (Platform.OS === 'web') {
      // For web, we can only ask again
      getLocationAndPlaces();
    } else {
      // For native platforms, open settings
      await locationService.openLocationSettings();
    }
  };

// Replace the hardcoded API key with environment variable
const fetchNearbyPlaces = async (latitude: number, longitude: number) => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''; // Use environment variable
    
    if (Platform.OS === 'web') {
      // For web, use a CORS proxy or your own backend
      const response = await fetch(
        `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&type=bar|restaurant|liquor_store&key=${apiKey}`
      );
      
        const data = await response.json();
        
        if (data.status === 'OK') {
          setPlaces(data.results);
        } else if (data.status === 'ZERO_RESULTS') {
          setPlaces([]);
        } else {
          // If API key is missing or invalid, use demo data
          console.log('Using demo data due to API issue:', data.status);
          setPlaces(generateDemoPlaces(latitude, longitude));
        }
      } else {
        // For native apps, direct request is fine
        if (apiKey) {
          // Only make the API call if you have an API key
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&type=bar|restaurant|liquor_store&key=${apiKey}`
          );
          
          const data = await response.json();
          
          if (data.status === 'OK') {
            setPlaces(data.results);
          } else if (data.status === 'ZERO_RESULTS') {
            setPlaces([]);
          } else {
            setPlaces(generateDemoPlaces(latitude, longitude));
          }
        } else {
          // If no API key, use demo data
          setPlaces(generateDemoPlaces(latitude, longitude));
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching places:', error);
      // Fallback to demo data if API fails
      setPlaces(generateDemoPlaces(latitude, longitude));
      setIsLoading(false);
    }
  };

  // Generate demo places near the user (fallback if API key not provided)
  const generateDemoPlaces = (latitude: number, longitude: number): Place[] => {
    return [
      {
        id: '1',
        name: 'Downtown Pub',
        vicinity: '123 Main St',
        rating: 4.5,
        types: ['bar'],
        geometry: {
          location: {
            lat: latitude + 0.001,
            lng: longitude + 0.001
          }
        },
        open_now: true
      },
      {
        id: '2',
        name: 'Cocktail Heaven',
        vicinity: '456 First Ave',
        rating: 4.8,
        types: ['bar'],
        geometry: {
          location: {
            lat: latitude - 0.001,
            lng: longitude + 0.002
          }
        },
        open_now: true
      },
      {
        id: '3',
        name: 'Vine & Spirits',
        vicinity: '789 Wine St',
        rating: 4.2,
        types: ['liquor_store'],
        geometry: {
          location: {
            lat: latitude + 0.002,
            lng: longitude - 0.001
          }
        },
        open_now: false
      },
      {
        id: '4',
        name: 'The Beer Garden',
        vicinity: '101 Brew Ave',
        rating: 4.6,
        types: ['restaurant', 'bar'],
        geometry: {
          location: {
            lat: latitude - 0.002,
            lng: longitude - 0.002
          }
        },
        open_now: true
      },
    ];
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
    let url = '';
    
    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${lat},${lng}`;
    } else if (Platform.OS === 'android') {
      url = `google.navigation:q=${lat},${lng}`;
    } else {
      // Web
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback to web URL for all platforms if app-specific URL fails
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
        <ActivityIndicator size="large" color={'#5c5c99'} />
        <Text style={[styles.text, { color: '#5c5c99' }]}>Finding bars near you...</Text>
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
          <Text style={styles.buttonText}>
            {Platform.OS === 'web' ? 'Try Again' : 'Open Settings'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Status bar visible */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerText}>Bars near you</Text>
      </View>

      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.35)',
          'rgba(0, 0, 0, 0.25)',
          'rgba(0, 0, 0, 0.15)',
          'rgba(0, 0, 0, 0.05)',
          'rgba(0, 0, 0, 0)',
        ]}
        style={styles.headerShadow}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {location && (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'web' ? undefined : PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={true}
            customMapStyle={lightMapStyle} // Always use light map style
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
            style={[styles.myLocationButton]} 
            onPress={goToMyLocation}
          >
            <Ionicons name="locate" size={24} color="#5c5c99" />
          </TouchableOpacity>

          {/* Selected place info */}
          {selectedPlace && (
            <View style={styles.placeDetails}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setSelectedPlace(null)}
              >
                <Ionicons name="close" size={24} color="#5c5c99" />
              </TouchableOpacity>
              
              <ScrollView style={styles.detailsScrollView}>
                <Text style={styles.placeName}>{selectedPlace.name}</Text>
                <Text style={styles.placeAddress}>{selectedPlace.vicinity}</Text>
                
                <View style={styles.placeMetaContainer}>
                  <View style={styles.placeTypeContainer}>
                    <Ionicons name={getPlaceIcon(selectedPlace.types)} size={16} color={'white'} />
                    <Text style={[styles.placeTypeText, { color: colors.text }]}>
                      {selectedPlace.types.includes('bar') ? 'Bar' : 
                       selectedPlace.types.includes('restaurant') ? 'Restaurant' : 
                       selectedPlace.types.includes('liquor_store') ? 'Liquor Store' : 'Place'}
                    </Text>
                  </View>
                  
                  {selectedPlace.rating && renderStars(selectedPlace.rating)}
                  
                  {selectedPlace.open_now !== undefined && (
                    <View style={styles.openStatusContainer}>
                      <View style={[styles.statusDot, { 
                        backgroundColor: selectedPlace.open_now ? '#4CAF50' : '#F44336' 
                      }]} />
                      <Text style={styles.openStatusText}>
                        {selectedPlace.open_now ? 'Open Now' : 'Closed'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.directionsButton}
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

// Light map style with enhanced features
const lightMapStyle = [
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "visibility": "simplified"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e8e8e0"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#c8e6c8"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "visibility": "simplified"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffd286"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#b3d1ff"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text",
    "stylers": [
      {
        "color": "#4d8fcc"
      }
    ]
  },
  {
    "featureType": "building",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e7e5df"
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  headerText: {
    color: '#5c5c99',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerShadow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 998,
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
    right: 20,
    bottom: 80,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  placeDetails: {
    position: 'absolute',
    backgroundColor: '#fff',
    paddingBottom: 60,
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
    color: '#5c5c99',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  placeAddress: {
    color: '#5c5c99',
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
    backgroundColor: '#5c5c99',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  placeTypeText: {
    color: '#fff',
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
    color:'#5c5c99',
    fontSize: 14,
  },
  directionsButton: {
    backgroundColor: '#5c5c99',
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
    backgroundColor: '#5c5c99',
  },
});