import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig'; 
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

// Category page for adding ingredients
export default function CategoryPage() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const categoryStr = Array.isArray(category) ? category[0] : category;

  // State management
  const [ingredients, setIngredients] = useState<any[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch ingredients when category changes
  useEffect(() => {
    if (category) {
      fetchIngredients(categoryStr); 
    }
  }, [category]);

  // Fetch ingredients from Firestore based on category
  const fetchIngredients = async (category: string) => {
    try {
      setLoading(true);
      const ingredientsRef = collection(db, 'ingredients_master');
      const q = query(ingredientsRef, where('category', '==', category));
      const querySnapshot = await getDocs(q);
      const ingredientsData = querySnapshot.docs.map((doc) => doc.data());
      setIngredients(ingredientsData);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    } finally {
      setLoading(false); 
    }
  };

  // Add selected ingredient to user's on-hand list
  const handleAddIngredient = async (ingredientName: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingIngredients = userSnap.data().onHandIngredients || [];

      if (!existingIngredients.includes(ingredientName)) {
        await updateDoc(userRef, {
          onHandIngredients: arrayUnion(ingredientName),
        });
        router.replace('/settings/onhand');
      }
    }
  };

  // Render screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="light-content" backgroundColor="#5c5c99" />

      {/* Header with screen title and back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{category}</Text>
      </View>

      <View style={styles.scrollContent}>
        {/* Ingredient list or loading indicator */}
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <FlatList
            data={ingredients}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.ingredientCard}
                onPress={() => handleAddIngredient(item.name)}
              >
                <Text style={styles.ingredientText}>{item.name}</Text> 
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Styling for add-ingredients categories in settings screen:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#5c5c99',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    marginTop: 10,
    marginBottom: 10,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#888',
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 15,
    backgroundColor: '#f5f5fc',
    padding: 10,
    borderRadius: 10,
  },
  ingredientImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 18,
    fontWeight: '500',
    flexShrink: 1,
  },
});
