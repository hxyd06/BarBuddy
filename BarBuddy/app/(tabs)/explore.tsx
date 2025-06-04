import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { StatusBar } from 'react-native';

const KeyboardSafeWrapper = ({ children }: { children: React.ReactNode }) => (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
    {children}
  </KeyboardAvoidingView>
);

// Explore screen component:
export default function ExploreScreen() {

  // Local state:
  const [categories, setCategories] = useState<any[]>([]);
  const [drinks, setDrinks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Fetching user info:
  useEffect(() => {
    fetchCategories();
    fetchDrinks();
  }, []);

  // Fetching drink categories from Firestore:
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  //Fetching drinks from Firestore:
  const fetchDrinks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'cocktails'));
      const drinksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDrinks(drinksData);
    } catch (error) {
      console.error('Error fetching drinks:', error);
    }
  };

  // Drink filter based on search input:
  const filteredDrinks = drinks.filter((drink) =>
    typeof drink.name === 'string' &&
    drink.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSearching = searchQuery.length > 0;

  // Static Moods & Events with images:
  const moods = [
    { id: 'party', name: 'Party', image: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fparty.jpg?alt=media&token=ca8e8cb5-ea32-43d9-8756-ec38dde72ac7' },
    { id: 'date_night', name: 'Date Night', image: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fdatenight.jpg?alt=media&token=64b56afb-684f-41b2-89cc-b37792637498' },
    { id: 'chill', name: 'Chill', image: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fchill.jpg?alt=media&token=a50dfda9-2680-46df-be37-c0a1e420986c' },
    { id: 'summer', name: 'Summer', image: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fsummer.jpg?alt=media&token=626c0932-2f80-4bd6-aa5f-ccc140404037' },
    { id: 'winter', name: 'Winter', image: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fwinter.jpg?alt=media&token=0603c9b3-9675-40e3-92c8-1a93f9933e40' },
    { id: 'brunch', name: 'Brunch', image: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fbrunch.jpg?alt=media&token=59f4cca2-f766-4d67-91de-731c569647cb' },
  ];

  //Function to handle random drink
  const handleRandomDrink = () => {
    //Generate random index of drink list
    const randomIndex = Math.floor(Math.random() * drinks.length);
    const randomDrink = drinks[randomIndex];

    //Go to drink screen
    router.push(`/drink/${randomDrink.name}`);
  };

  return (
    <KeyboardSafeWrapper>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={styles.container}>

          {/* Explore header */}
          <View style={styles.header}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#5c5c9a', textAlign: 'center' }}>
              Explore drinks
            </Text>
          </View>

          {/* Search bar input with cancel button */}
          <View style={styles.searchContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder="Search for drinks..."
                placeholderTextColor='#888'
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { flex: 1 }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Result count when searching */}
          {isSearching && (
            <Text style={styles.resultCount}>
              {filteredDrinks.length} result{filteredDrinks.length !== 1 ? 's' : ''}
            </Text>
          )}

          {/* Drink search results list */}
          {isSearching ? (
            <FlatList
              data={filteredDrinks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.drinkCard}
                  onPress={() => router.push(`/drink/${encodeURIComponent(item.name)}`)}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.drinkImage} />
                  ) : (
                    <View style={styles.placeholderBox} />
                  )}
                  <Text style={styles.drinkText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>

            {/* Available and Trending Drinks */}
              <View style={styles.topButtons}>
                <TouchableOpacity style={styles.categoryCard} onPress={() => router.push('../settings/available-drinks')}>
                  <Image source={require('../../assets/images/drinksicanmake.webp')} style={styles.categoryImage} />
                  <Text style={styles.categoryText}>Drinks I Can Make</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topCategoryCard} onPress={() => router.push('../explore/trending')}>
                  <Image source={require('../../assets/images/trendingdrinks.jpg')} style={styles.categoryImage}/>
                  <Text style={styles.categoryText}>Trending Drinks</Text>
                </TouchableOpacity>
              </View>
              {/* Drink/Meal Suggestion and Random Drinks */}
              <View style={styles.topButtons}>
                <TouchableOpacity style={styles.categoryCard} onPress={() => router.push('../explore/meal-suggestion')}>
                  <Image source={require('../../assets/images/mealsuggestion.jpg')} style={styles.categoryImage}/>
                  <Text style={styles.categoryText}>Match Drink to a Meal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topCategoryCard} onPress={handleRandomDrink}>
                  <Image source={require('../../assets/images/surpriseme.jpg')} style={styles.categoryImage}/>
                  <Text style={styles.categoryText}>Surprise Me</Text>
                </TouchableOpacity>
              </View>
              {/* Categories section */}
              <Text style={styles.subheader}>Categories</Text>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ marginBottom: 30 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryCard}
                    onPress={() => router.push(`/explore/${item.id}`)}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.categoryImage} />
                    ) : (
                      <View style={styles.categoryPlaceholder} />
                    )}
                    <Text style={styles.categoryText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />

              {/* Moods & Events section */}
              <Text style={styles.subheader}>Moods & Events</Text>

              <FlatList
                data={moods}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingBottom: 50 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryCard}
                    onPress={() => router.push(`/explore/${item.id}`)}
                  >
                    <Image source={{ uri: item.image }} style={styles.categoryImage} />
                    <Text style={styles.categoryText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
          </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </KeyboardSafeWrapper>
  );
}

// Explore screen styling: 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  subheader: {
    fontSize: 20,
    fontWeight: 'bold', 
    color: '#5c5c9a', 
    textAlign: 'center', 
    marginBottom: 10 
  },
  searchContainer: {
    backgroundColor: '#f5f5fc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
  },
  resultCount: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 10,
    marginLeft: 5,
  },
  cancelText: {
    color: '#5c5c9a',
    fontSize: 16,
    marginLeft: 10,
  },
  topButtons: {
    flexDirection: 'row',
  },
  topCategoryCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    marginLeft: 15,
  },
  categoryCard: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 5,
  },
  categoryText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  availableDrinksText: {
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 15,
  },
  drinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  drinkImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  drinkText: {
    fontSize: 18,
    fontWeight: '500',
    flexShrink: 1,
  },
  placeholderBox: {
    width: 60,
    height: 60,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginBottom: 5,
  },
});
