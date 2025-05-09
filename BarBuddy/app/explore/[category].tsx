import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMoodTags } from '@/utils/moodTagger';

export const unstable_settings = {
  headerShown: false,
};

export default function CategoryDrinksScreen() {
  const { category } = useLocalSearchParams();
  const router = useRouter();
  const [cocktails, setCocktails] = useState<any[]>([]);
  const [categoryImage, setCategoryImage] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');

  // Fetch drinks and category/mood info when screen loads
  useEffect(() => {
    if (category) {
      fetchData();
    }
  }, [category]);

  // Retrieve matching cocktails from Firestore
  const fetchData = async () => {
    if (!category) return;

    try {
      const categoryRef = doc(db, 'categories', category as string);
      const categorySnap = await getDoc(categoryRef);
      const allCocktailsSnap = await getDocs(collection(db, 'cocktails'));

      const allDrinksWithRatings = await Promise.all(
        allCocktailsSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const reviewsSnap = await getDocs(collection(db, 'cocktails', docSnap.id, 'reviews'));

          let avgRating = null;
          if (!reviewsSnap.empty) {
            const total = reviewsSnap.docs.reduce((acc, curr) => acc + (curr.data().rating || 0), 0);
            avgRating = total / reviewsSnap.size;
          }

          return {
            id: docSnap.id,
            category: data.category || '',
            ...data,
            rating: avgRating,
          };
        })
      );

      if (categorySnap.exists()) {
        // Category-based filtering
        const catData = categorySnap.data();
        setCategoryName(catData.name);
        setCategoryImage(catData.image || '');

        const filtered = allDrinksWithRatings.filter(drink => drink.category === catData.name);
        setCocktails(filtered);
      } else {
        // Mood-based filtering
        const moodId = category as string;
        setCategoryName(formatMoodName(moodId));
        setCategoryImage(getMoodImage(moodId));

        const filtered = allDrinksWithRatings.filter(drink => getMoodTags(drink).includes(moodId));
        setCocktails(filtered);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Render category/mood screen content
  return (
    <View style={styles.container}>
      {/* Header image and overlay */}
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

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Title and results count */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{categoryName}</Text>
          <Text style={styles.subtitle}>{cocktails.length} Results</Text>
        </View>
      </View>

      {/* List of matching cocktails */}
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

// Format readable mood names from IDs
function formatMoodName(id: string) {
  const map: Record<string, string> = {
    party: 'Party',
    date_night: 'Date Night',
    chill: 'Chill',
    summer: 'Summer',
    winter: 'Winter',
    brunch: 'Brunch',
    wedding: 'Wedding',
  };
  return map[id] || id;
}

// Get mood image by ID
function getMoodImage(id: string) {
  const map: Record<string, string> = {
    party: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fparty.jpg?alt=media&token=ca8e8cb5-ea32-43d9-8756-ec38dde72ac7',
    date_night: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fdatenight.jpg?alt=media&token=64b56afb-684f-41b2-89cc-b37792637498',
    chill: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fchill.jpg?alt=media&token=a50dfda9-2680-46df-be37-c0a1e420986c',
    summer: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fsummer.jpg?alt=media&token=626c0932-2f80-4bd6-aa5f-ccc140404037',
    winter: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fwinter.jpg?alt=media&token=0603c9b3-9675-40e3-92c8-1a93f9933e40',
    brunch: 'https://firebasestorage.googleapis.com/v0/b/barbuddy-fc0b7.firebasestorage.app/o/mood-event-images%2Fbrunch.jpg?alt=media&token=59f4cca2-f766-4d67-91de-731c569647cb',
  };
  return map[id] || '';
}

// Styles for explore drinks categories screen: 
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
