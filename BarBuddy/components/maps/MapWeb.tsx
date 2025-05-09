import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { locationService } from '@/utils/locationService';

// IMPORTANT: Do NOT import react-native-maps or any native-only modules here!

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

interface MapWebProps {
  apiKey: string;
}

export default function MapWeb({ apiKey }: MapWebProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<any>(null);
  const googleRef = useRef<any>(null);

  // Initialize Google Maps
  useEffect(() => {
    // Load Google Maps script
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleRef.current = window.google;
        initMap();
      };
      document.head.appendChild(script);
    } else if (window.google) {
      googleRef.current = window.google;
      initMap();
    }

    return () => {
      // Cleanup
      if (mapRef.current) {
        // Remove event listeners if needed
      }
    };
  }, [apiKey]);

  const initMap = async () => {
    if (!googleRef.current || !mapContainerRef.current) {
      return;
    }

    try {
      const result = await locationService.getCurrentLocation();
      
      if (result.status === 'success' && result.location) {
        setLocation(result.location);
        
        // Create map
        const mapOptions = {
          center: {
            lat: result.location.coords.latitude,
            lng: result.location.coords.longitude
          },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        };
        
        mapRef.current = new googleRef.current.maps.Map(
          mapContainerRef.current,
          mapOptions
        );
        
        // Add marker for user's location
        new googleRef.current.maps.Marker({
          position: mapOptions.center,
          map: mapRef.current,
          title: 'Your Location',
          icon: {
            path: googleRef.current.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 10,
          },
        });
        
        // Fetch nearby places
        fetchNearbyPlaces(result.location.coords.latitude, result.location.coords.longitude);
      } else {
        setErrorMsg(result.errorMessage || 'Could not get your location');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setErrorMsg('Could not initialize the map');
      setIsLoading(false);
    }
  };

  // Function to get location and nearby places
  const handleTryAgain = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    initMap();
  };

  // Fetch nearby bars, restaurants and liquor stores
  const fetchNearbyPlaces = async (latitude: number, longitude: number) => {
    try {
      // For web, use Places API directly through Google Maps JavaScript API
      if (googleRef.current && mapRef.current) {
        const placesService = new googleRef.current.maps.places.PlacesService(mapRef.current);
        
        const request = {
          location: { lat: latitude, lng: longitude },
          radius: 1500,
          type: ['bar', 'restaurant', 'liquor_store']
        };
        
        placesService.nearbySearch(request, (results: any, status: any) => {
          if (status === googleRef.current.maps.places.PlacesServiceStatus.OK) {
            setPlaces(results);
            
            // Create markers for each place
            results.forEach((place: any) => {
              const marker = new googleRef.current.maps.Marker({
                position: place.geometry.location,
                map: mapRef.current,
                title: place.name,
                icon: {
                  path: googleRef.current.maps.SymbolPath.CIRCLE,
                  fillColor: '#6A0DAD', // Dark Purple
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                  scale: 8,
                },
              });
              
              // Add click listener to marker
              marker.addListener('click', () => {
                setSelectedPlace(place);
              });
            });
            
            setIsLoading(false);
          } else {
            console.error('Places API Error:', status);
            setErrorMsg('Error fetching nearby places');
            setIsLoading(false);
          }
        });
      } else {
        throw new Error('Google Maps not initialized');
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setErrorMsg('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  // Center on user's location
  const goToMyLocation = () => {
    if (googleRef.current && mapRef.current && location) {
      mapRef.current.panTo({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      mapRef.current.setZoom(15);
    }
  };

  // Get icon based on place type
  const getPlaceIcon = (types: string[]) => {
    if (types.includes('bar')) return 'beer-outline';
    if (types.includes('restaurant')) return 'restaurant-outline';
    if (types.includes('liquor_store')) return 'wine-outline';
    return 'storefront-outline';
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

  // Open directions in Google Maps
  const openDirections = (place: Place) => {
    const { lat, lng } = place.geometry.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
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
          onPress={handleTryAgain}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
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
          
          <View style={styles.detailsContent}>
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
          </View>
        </View>
      )}
    </View>
  );
}

// Add necessary type for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  detailsContent: {
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
});