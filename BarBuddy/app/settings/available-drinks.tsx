import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

//Create interfaces for ingredients and cocktail objects
interface Ingredient {
  name: string;
  measure: string;
}
interface Cocktail {
  id: string;
  name: string;
  ingredients: Ingredient[];
}
//Available Drinks Screen
export default function AvailableDrinksScreen() {
  const router = useRouter(); //Router navigation
  const [availableDrinks, setAvailableDrinks] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);

  //Fetch ingredients from the cocktail db
  const fetchIngredients = async (drinkName: string): Promise<Ingredient[]> => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${drinkName}`);
      const data = await response.json();

      if (data.drinks && data.drinks.length > 0) {
        const cocktail = data.drinks[0];

        //Set the ingredients name and measure to the object fields
        const ingredientsList: Ingredient[] = [];
        for (let i = 1; i <= 15; i++) {
          const ingredientName = cocktail[`strIngredient${i}`];
          const ingredientMeasure = cocktail[`strMeasure${i}`];
          if (ingredientName) {
            ingredientsList.push({
              name: ingredientName,
              measure: ingredientMeasure,
            });
          }
        }
        //Return the list of ingredients for a drink
        return ingredientsList;
      } else {
        console.error('No drink found');
        return [];
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      return [];
    }
  };

  //Find drinks that match
  useEffect(() => {
    const findMatchingDrinks = async () => {
        //Check user auth
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        //Get the user's onHandIngredients array
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        if (!userData || !userData.onHandIngredients) {
          console.error('No onHandIngredients found for user');
          setAvailableDrinks([]);
          return;
        }
        const onHand: string[] = userData.onHandIngredients;
        //Get the cocktail ingredients
        const cocktailsSnapshot = await getDocs(collection(db, 'cocktails'));
        const matchingCocktails: Cocktail[] = [];
        for (const docSnap of cocktailsSnapshot.docs) {
          const cocktail = docSnap.data();
          if (!cocktail.ingredients) {
            console.error('No ingredients found for cocktail: ', cocktail.name);
            continue;
          }
          const ingredientsMap = cocktail.ingredients;
          const requiredIngredients = Object.values(ingredientsMap).map((item: any) => item.name);
          //Compare the user's onHandIngredients with the all cocktail ingredients
          const canMake = requiredIngredients.every((ing: string) =>
            onHand.includes(ing)
          );
          //Get all cocktails that can be made
          if (canMake) {
            const ingredients = await fetchIngredients(cocktail.name);
            matchingCocktails.push({
              id: docSnap.id,
              name: cocktail.name,
              ingredients: ingredients,
            });
          }
        }
        //Set available drinks to a map
        setAvailableDrinks(matchingCocktails);
      } catch (error) {
        console.error('Error fetching available drinks:', error);
      } finally {
        setLoading(false);
      }
    };
    findMatchingDrinks();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Available Drinks</Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}>
        <Ionicons name="arrow-back" size={24} color="#5c5c99" />
      </TouchableOpacity>
      <Text style={styles.emptyText}>Below are the drinks you have ALL of the ingredients to make.</Text>

      {/* Available Drink List */}
      {loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : availableDrinks.length === 0 ? (
        <Text style={styles.emptyText}>No drinks you can make yet.</Text>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 20 }}
          data={availableDrinks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
                {/* Go to recipe if drink is pressed */}
            <TouchableOpacity onPress={() => router.push(`/drink/${encodeURIComponent(item.name)}`)}>
              {/* Show drink name, ingredients and measure */}
              <Text style={styles.drinkName}>{item.name}</Text>
              <FlatList
                data={item.ingredients}
                keyExtractor={(ingredient) => ingredient.name}
                renderItem={({ item: ingredient }) => (
                  <Text>{ingredient.name} - {ingredient.measure}</Text>
                )}
              />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

//Stylesheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#5c5c99',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: {
    backgroundColor: '#f5f5fc',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  drinkName: { fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#888' },
});