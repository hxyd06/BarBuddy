import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

// Disable default header
export const unstable_settings = {
  headerShown: false,
};

// Screen to display user's saved cocktail recipes
export default function SavedDrinksScreen() {
  const router = useRouter();
  const [drinks, setDrinks] = useState<any[]>([]);

  // Fetch saved drinks from Firestore
  const fetchSavedDrinks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const snapshot = await getDocs(collection(db, 'users', user.uid, 'savedRecipes'));
      const saved = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDrinks(saved);
    } catch (error) {
      console.error('Error fetching saved drinks:', error);
    }
  };

  // Remove a drink from saved recipes
  const handleUnsave = async (id: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'savedRecipes', id));
      setDrinks(prev => prev.filter(drink => drink.id !== id));
    } catch (error) {
      console.error('Error unsaving drink:', error);
    }
  };

  // Re-fetch saved drinks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSavedDrinks();
    }, [])
  );

  // Render saved drinks list
  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="light-content" backgroundColor="#5c5c99" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Recipes</Text>
      </View>

      {/* Drink cards list */}
      <FlatList
        data={drinks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Tap to view drink detail */}
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => router.push(`/drink/${encodeURIComponent(item.name)}`)}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
              ) : (
                <View style={styles.placeholder} />
              )}
              <View style={styles.info}>
                <Text style={styles.drinkName}>{item.name}</Text>
              </View>
            </TouchableOpacity>

            {/* Bookmark icon to unsave */}
            <TouchableOpacity onPress={() => handleUnsave(item.id)}>
              <Ionicons name="bookmark" size={24} color="#5c5c99" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ padding: 10 }}
      />
    </SafeAreaView>
  );
}

// Styles for saved drinks screen:
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
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
  },
  drinkName: {
    fontSize: 16,
    fontWeight: '600',
  },
});
