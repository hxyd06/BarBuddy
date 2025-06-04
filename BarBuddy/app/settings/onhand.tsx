import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';

export default function OnHandScreen() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setIngredients(data.onHandIngredients || []);
        }
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  const handleRemoveIngredient = async (ingredientToRemove: string) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) return;

      const data = userSnap.data();
      const updatedIngredients = (data.onHandIngredients || []).filter(
        (ing: string) => ing !== ingredientToRemove
      );

      await updateDoc(userDocRef, { onHandIngredients: updatedIngredients });
      setIngredients(updatedIngredients);
    } catch (error) {
      console.error('Failed to remove ingredient:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="light-content" backgroundColor="#5c5c99" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>On-Hand Ingredients</Text>
        <TouchableOpacity onPress={() => router.push('/settings/add-ingredient')} style={styles.addButton}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : ingredients.length === 0 ? (
          <Text style={styles.emptyText}>No ingredients added yet.</Text>
        ) : (
         <FlatList
  contentContainerStyle={{ padding: 20 }}
  data={loading ? [] : ingredients}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <View style={styles.cardRow}>
      <Text style={styles.drinkName}>{item}</Text>
      <TouchableOpacity onPress={() => handleRemoveIngredient(item)}>
        <Ionicons name="trash" size={20} color="#e63946" />
      </TouchableOpacity>
    </View>
  )}
  ListHeaderComponent={
    <TouchableOpacity onPress={() => router.push('/settings/available-drinks')}>
      <Text style={styles.button}>View Drinks I Can Make</Text>
    </TouchableOpacity>
  }
  ListEmptyComponent={
    <Text style={styles.emptyText}>
      {loading ? 'Loading...' : 'No ingredients added yet.'}
    </Text>
  }
/>

        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#5c5c99',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
  button: {
    backgroundColor: '#5c5c99',
    padding: 32,
    margin: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
    color: '#fff',
  },
  cardRow: {
    backgroundColor: '#f5f5fc',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drinkName: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 30, 
    color: '#888' 
  },
});
