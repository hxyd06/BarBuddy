import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function ExploreScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [drinks, setDrinks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchDrinks();
  }, []);

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

  const filteredDrinks = drinks.filter((drink) =>
    drink.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSearching = searchQuery.length > 0;
  const dataToRender = isSearching ? filteredDrinks : categories;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
        <Text style={styles.header}>Explore Categories</Text>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search for drinks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={dataToRender}
          keyExtractor={(item) => item.id}
          numColumns={isSearching ? 1 : 2}
          key={isSearching ? 'drinks' : 'categories'} // 🔥 force remount when numColumns changes
          columnWrapperStyle={!isSearching ? { justifyContent: 'space-between' } : undefined}
          contentContainerStyle={{
            paddingBottom: 20,
            flexGrow: 1,
            justifyContent: dataToRender.length === 0 ? 'center' : undefined,
            alignItems: dataToRender.length === 0 ? 'center' : undefined,
          }}
          ListEmptyComponent={isSearching ? (
            <Text style={{ fontSize: 16, color: 'gray', marginTop: 20 }}>
              0 drinks found
            </Text>
          ) : null}
          renderItem={({ item }) => (
            isSearching ? (
              <TouchableOpacity
                style={styles.drinkCard}
                onPress={() => {}}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.drinkImage} />
                ) : (
                  <View style={styles.placeholderBox} />
                )}
                <Text style={styles.drinkText}>{item.name}</Text>
              </TouchableOpacity>
            ) : (
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
            )
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
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
  categoryPlaceholder: { // ✨ New: placeholder for category boxes
    width: '100%',
    height: 120,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginBottom: 5,
  },
});
