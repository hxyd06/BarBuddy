import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export const unstable_settings = {
    headerShown: false,
  };

export default function CategoryDrinksScreen() {
  const { category } = useLocalSearchParams();
  const router = useRouter();
  const [cocktails, setCocktails] = useState<any[]>([]);
  const [categoryImage, setCategoryImage] = useState<string>('');

  useEffect(() => {
    if (category) {
      fetchCocktails();
      fetchCategoryImage();
    }
  }, [category]);

  const fetchCocktails = async () => {
    try {
      const q = query(collection(db, 'cocktails'), where('categories', 'array-contains', capitalizeFirstLetter(category as string)));
      const querySnapshot = await getDocs(q);
      const drinksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCocktails(drinksData);
    } catch (error) {
      console.error('Error fetching cocktails:', error);
    }
  };

  const fetchCategoryImage = async () => {
    try {
      const docRef = doc(db, 'categories', capitalizeFirstLetter(category as string));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategoryImage(data.image);
      }
    } catch (error) {
      console.error('Error fetching category image:', error);
    }
  };

  const capitalizeFirstLetter = (str: string | undefined) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View>
        {categoryImage ? (
          <Image source={{ uri: categoryImage }} style={styles.headerImage} />
        ) : (
          <View style={[styles.headerImage, { backgroundColor: '#ddd' }]} />
        )}

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Title on Image */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{capitalizeFirstLetter(category as string)}</Text>
          <Text style={styles.subtitle}>{cocktails.length} Results</Text>
        </View>
      </View>

      {/* Drink List */}
      <FlatList
        data={cocktails}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.cardImage} />
            ) : (
              <View style={styles.placeholder} />
            )}
            <View style={styles.info}>
              <Text style={styles.drinkName}>{item.name}</Text>
              {item.rating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

/** 🛠 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerImage: {
    width: '100%',
    height: 180,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 30,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#eee',
    marginTop: 5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drinkName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontWeight: 'bold',
  },
});