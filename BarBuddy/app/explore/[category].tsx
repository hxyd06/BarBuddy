import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const unstable_settings = {
  headerShown: false,
};

export default function CategoryDrinksScreen() {
  const { category } = useLocalSearchParams();
  const router = useRouter();
  const [cocktails, setCocktails] = useState<any[]>([]);
  const [categoryImage, setCategoryImage] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>(''); // holds real category name like "Coffee / Tea"

  // First fetch category name + image using the category ID (e.g. "coffeeandtea")
  const fetchCategoryData = async () => {
    try {
      const docRef = doc(db, 'categories', category as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategoryName(data.name); // use the real name in drink queries
        setCategoryImage(data.image || '');
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    }
  };

  // Then fetch cocktails based on the real category name
  const fetchCocktails = async () => {
    if (!categoryName) return;
    try {
      const q = query(
        collection(db, 'cocktails'),
        where('category', '==', categoryName)
      );
      const querySnapshot = await getDocs(q);
  
      const drinksWithRatings = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const reviewsSnapshot = await getDocs(collection(db, 'cocktails', docSnap.id, 'reviews'));
  
          let avgRating = null;
          if (!reviewsSnapshot.empty) {
            const total = reviewsSnapshot.docs.reduce((acc, curr) => acc + (curr.data().rating || 0), 0);
            avgRating = total / reviewsSnapshot.size;
          }
  
          return {
            id: docSnap.id,
            ...data,
            rating: avgRating,
          };
        })
      );
  
      setCocktails(drinksWithRatings);
    } catch (error) {
      console.error('Error fetching cocktails:', error);
    }
  };

  useEffect(() => {
    if (category) {
      fetchCategoryData(); // this sets categoryName, which triggers fetchCocktails()
    }
  }, [category]);

  useEffect(() => {
    if (categoryName) {
      fetchCocktails();
    }
  }, [categoryName]);

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View>
        {categoryImage ? (
          <Image source={{ uri: categoryImage }} style={styles.headerImage} />
        ) : (
          <View style={[styles.headerImage, { backgroundColor: '#ddd' }]} />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Title on Image */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{categoryName}</Text>
          <Text style={styles.subtitle}>{cocktails.length} Results</Text>
        </View>
      </View>

      {/* Drink List */}
      <FlatList
        data={cocktails}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/drink/${encodeURIComponent(item.name)}`)}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.cardImage} />
            ) : (
              <View style={styles.placeholder} />
            )}
            <View style={styles.info}>
              <Text style={styles.drinkName}>{item.name}</Text>
              <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{(item.rating ?? 0).toFixed(1)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  headerImage: {
    width: '100%',
    height: 180,
  },
  backButton: {
    height: 40,
    width: 40,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5fc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
