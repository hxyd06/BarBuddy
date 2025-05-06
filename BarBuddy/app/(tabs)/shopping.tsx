import { Text, View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Image, Dimensions, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';

const API_KEY = '12efb7805ad9018a5a8f1414046bad4e41052dc5662e9516e113f277044f0f6f';
const MAX_DISTANCE = 5000; // for location filtering (in meters)
const GRID = {
    numColumns: 3,
    itemWidth: (Dimensions.get('window').width - 65) / 3,
};

export default function ShoppingScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationName, setLocationName] = useState('');

    // to retrieve user location
    useEffect(() => {
        (async () => {
            try {
                setLocationLoading(true);
                const { status } = await Location.requestForegroundPermissionsAsync();
                
                if (status !== 'granted') {
                    console.log('User denied location permission');
                    Alert.alert(
                        'Location Permission Denied', 'Please enable location services in your device settings to use this feature.'
                    );
                    setLocationLoading(false);
                    return;
                }
                
                const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                console.log(`User coords: ${latitude}, ${longitude}`);
                
                const coordAddress = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude
                });
                
                if (coordAddress?.length > 0) {
                    const address = coordAddress[0];
                    console.log(`User address: ${JSON.stringify(address)}`);

                    if (address.city) {
                        setLocationName(address.city);
                    } 
                }
             } catch (error) {
                console.error('Error retrieving location:', error);
                Alert.alert(
                    'Location Error', 'Could not retrieve your location.'
                );
            } finally {
                setLocationLoading(false);
            }
        })();
    }, []);

    // fetch results from API
    const fetchResults = async () => {
        if (!searchQuery) return;

        setLoading(true);
        setResults([]);
        setFilteredResults([]);
        
        try {
            const apiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(searchQuery)}&api_key=${API_KEY}`;
            const response = await fetch(apiUrl); 
            const data = await response.json();
            
            if (data.shopping_results?.length > 0) {
                setResults(data.shopping_results);

                if (userLocation) {
                    const filtered = await locationFilter(data.shopping_results);
                    setFilteredResults(filtered);
                }
                console.log(`Found ${data.shopping_results.length} results total`);
            } else {
                console.log('No results found');
            }
        }
        catch (error) {
            console.error('Search failed:', error);
            Alert.alert('Search Failed', 'Please try again later.');
        }
        finally {
            setLoading(false);
        }
    };

    // filters results with user location
    const locationFilter = async (results: Array<{ source: string; title?: string; id?: string; position?: number }>) => {
        if (!userLocation) return results;
        
        const nearbyResults = [];
        
        for (const result of results) {
            try {
                const searchTerm = `${result.source} ${result.title?.split(' ').slice(0, 3).join(' ')}`;
                const locationResult = await Location.geocodeAsync(searchTerm);
                
                if (locationResult?.length > 0) {
                    const { latitude, longitude } = locationResult[0];
                    
                    const distance = getDistance(
                        { latitude: userLocation.latitude, longitude: userLocation.longitude },
                        { latitude, longitude }
                    );
                    
                    if (distance <= MAX_DISTANCE) {
                        nearbyResults.push({
                            ...result,
                            distance: distance.toFixed(1),
                        });
                    }
                }
            } catch (error) {
                
            }
        }

        return gridFormat(nearbyResults, GRID.numColumns);
    };


    const gridFormat = (data: any[], numColumns: number): any[] => {
        const totalItems = data.length;
        const remainder = totalItems % numColumns;
        
        if (remainder === 0) return data;

        const emptyItems = Array(numColumns - remainder).fill(null).map(() => ({
            empty: true,
            id: `empty-${Date.now()}-${Math.random()}`
        }));
        
        return [...data, ...emptyItems];
    };

    const renderItem = ({ item }: { item: { id?: string; thumbnail: string; title: string; price: string; source: string; distance?: string; empty?: boolean } }) => {
        if (item.empty) {
            return <View style={[styles.gridItem, styles.emptyItem]} />;
        }
        
        return (
            <View style={styles.gridItem}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail}/>

                <View style={styles.productDetails}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    
                    <Text style={styles.productPrice}>
                        {item.price}
                    </Text>
                    
                    <Text style={styles.productSource} numberOfLines={1}>
                        {item.source}
                    </Text>
                </View>
            </View>
        );
    };

    const displayData = filteredResults.length > 0 ? filteredResults : results.length > 0 ? gridFormat(results, GRID.numColumns) : [];

    //main container
    return (
        <View style={styles.container}>
            <Text style={styles.pageTitle}>Find Ingredients</Text>
            <View style={styles.searchContainer}>
                <TextInput style={styles.input} placeholder="Search ingredients..." placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery}/>
                <TouchableOpacity style={styles.searchButton} onPress={fetchResults}>
                    <Ionicons name="search" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
            
            {locationLoading ? (
                <Text style={styles.locationText}>
                    Retrieving location...
                </Text>
            ) : userLocation ? (
                <Text style={styles.locationText}>
                    Showing results for {locationName}
                </Text>
            ) : (
                <Text style={styles.locationText}>
                    Location unavailable.
                </Text>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5c5c99" />
                    <Text style={styles.loadingText}>
                        Searching for products...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={displayData}
                    keyExtractor={(item) => item.id || Math.random().toString()}
                    numColumns={GRID.numColumns}
                    contentContainerStyle={styles.gridContainer}
                    renderItem={renderItem}
                    ListEmptyComponent={ !loading && searchQuery ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={50} color="#5c5c99" />
                            <Text style={styles.emptyText}>
                                {userLocation && filteredResults.length === 0 && results.length > 0 ? `No results found within ${MAX_DISTANCE}m of ${locationName}` : 'No results found'}
                            </Text>
                            <Text style={styles.emptySubText}>
                                Try a different search term
                            </Text>
                        </View>
                    ) : null
                }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#5c5c99',
        marginBottom: 20,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5fc',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: '#333',
        fontSize: 16,
        borderColor: '#ccc',
        borderWidth: 1,
    },
    searchButton: {
        backgroundColor: '#5c5c99',
        padding: 12,
        borderRadius: 10,
        marginLeft: 10,
    },
    locationText: {
        color: '#5c5c99',
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#5c5c99',
        fontSize: 16,
        marginTop: 10,
    },
    gridContainer: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    gridItem: {
        backgroundColor: '#f5f5fc',
        borderRadius: 10,
        padding: 8,
        width: GRID.itemWidth,
        height: 210,
        margin: 5,
        borderColor: '#ccc',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    emptyItem: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },
    thumbnail: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        marginBottom: 8,
    },
    productDetails: {
        flex: 1,
        justifyContent: 'space-between',
    },
    productTitle: {
        fontSize: 12,
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 4,
        height: 32,
    },
    productPrice: {
        fontSize: 14,
        color: '#5c5c99',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    productSource: {
        fontSize: 11,
        color: '#666',
    },
    distanceText: {
        fontSize: 10,
        color: '#5c5c99',
        marginTop: 3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        marginTop: 50,
    },
    emptyText: {
        color: '#5c5c99',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptySubText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
        fontSize: 14,
    }
});