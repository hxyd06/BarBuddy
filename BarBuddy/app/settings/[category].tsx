import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig'; 
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

//Category page for add ingredients
export default function CategoryPage() {
  const router = useRouter(); //Navigation
  const { category } = useLocalSearchParams();
  const categoryStr = Array.isArray(category) ? category[0] : category;
  const [ingredients, setIngredients] = useState<any[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);

  //Fetch ingredients by category
  useEffect(() => {
    if (category) {
      fetchIngredients(categoryStr); 
    }
  }, [category]);

  const fetchIngredients = async (category: string) => {
    try {
      setLoading(true);

      //Get ingredients from the database matching the relevant category
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

  //Function to add an ingredient to user's list
  const handleAddIngredient = async (ingredientName: string) => {
    const user = auth.currentUser;
    if (!user) return; //If no user, return
  
    //Locate user in database
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    //Check user's current ingredient list
    if (userSnap.exists()) {
      const existingIngredients = userSnap.data().onHandIngredients || [];
      //Add ingredient (only if not already added)
      if (!existingIngredients.includes(ingredientName)) {
        await updateDoc(userRef, {
          onHandIngredients: arrayUnion(ingredientName),
        });
        router.replace('/settings/onhand'); //Go back to list
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{category}</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : ( /* Set loading text */
        <FlatList
          data={ingredients}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
  style={styles.ingredientCard}
  onPress={() => handleAddIngredient(item.name)} /* Add the ingredient if pressed */
>
  <Text style={styles.ingredientText}>{item.name}</Text> 
</TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

//Stylesheet
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