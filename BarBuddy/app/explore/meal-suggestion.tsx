import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, Linking, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { model, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

//Drink Suggestion Page
export default function MealSuggestionScreen() {
    type Cocktail = {
    id: string;
    name: string;
    image: string;
    views: number;
    };

  const router = useRouter(); //Router navigation
  const [loading, setLoading] = useState(true);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);

  const [enteredMeal, setEnteredMeal] = useState('');
  const [suggestedDrink, setSuggestedDrink] = useState('');
  const [isDrinkValid, setIsDrinkValid] = useState<boolean | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<Cocktail | null>(null);


  function buildPrompt(drinks: Cocktail[], meal: string): string {
    const drinkList = drinks.map((drink, i) => `${i + 1}. ${drink.name}`).join('\n');
    return `# Task
You are an expert drink pairing assistant.

Your job is to choose the single best drink from a given list for a given meal. You are STRICTLY limited to the drink options below.

# VITAL Rules
- You may ONLY select one drink from the list below.
- You MUST NOT generate or suggest any drink not in the list.
- You MUST return ONLY the drink name.
- DO NOT include any explanations, justifications, or additional text.
- No matter what, you must suggest a drink from the list. You may not choose to make no suggestion.
- Only suggest one drink.
- You must absolutely confirm without any doubt that the drink you suggest is in the below list.
- Do not include any explanation as to why, just suggest a drink from the list following the constraints.
- Make sure that your recommendation is a cocktail or drink recipe.
- Your recommendation must not simply be an echo of the meal itself.

# Available Drinks
${drinkList}

# Meal
"${meal}"

#Now, check
If the drink you would like to suggest is not in the list, try again.

# Response
(Only include the drink name. Nothing else.)`;
}

    const handleMealSubmit = async () => {
  try {
    Keyboard.dismiss();
    const prompt = buildPrompt(cocktails, enteredMeal);
    const result = await model.generateContent(prompt);
    const drinkName = result.response.text().trim();
    console.log(drinkName);

    const drink = cocktails.find((c) => c.name === drinkName);
    setSuggestedDrink(drinkName);

    if (drink) {
      setIsDrinkValid(true);
      setSelectedDrink(drink); // 👈 Save full drink object
    } else {
      setIsDrinkValid(false);
      setSelectedDrink(null); // clear previous selection
    }
  } catch (error) {
    console.error('Error generating drink suggestion:', error);
  }
};

    //Function to handle random drink
  const handleRandomDrink = () => {
    //Generate random index of drink list
    const randomIndex = Math.floor(Math.random() * cocktails.length);
    const randomDrink = cocktails[randomIndex];

    //Go to drink screen
    router.push(`/drink/${randomDrink.name}`);
  };

  useFocusEffect(
  useCallback(() => {
    const fetchDrinks = async () => {
      setLoading(true);
      try {
        const cocktailsSnapshot = await getDocs(collection(db, 'cocktails'));
        const cocktailsData = cocktailsSnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            image: data.image,
            views: data.views,
          };
        });
        setCocktails(cocktailsData);
      } catch (error) {
        console.error('Error fetching drinks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrinks();
  }, [])
);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('../explore')}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Match a Drink to Meal</Text>
      </View>

      <Text style={styles.descriptionText}>Enter your meal and BarBuddy will suggest an appropriate paired drink.</Text>

    <View style={styles.inputContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}></View>
        <TextInput 
            placeholder="Enter meal here..."
            placeholderTextColor='#888'
            value={enteredMeal}
            onChangeText={setEnteredMeal}
            style={[styles.mealInput, { flex: 1 }]}
            />
            {enteredMeal.length > 0 && (
            <TouchableOpacity onPress={handleMealSubmit}>
                <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
            )}
        </View>
        {isDrinkValid == false && (
        <View>
            <View style={styles.suggestedTextContainer}>
              <Text style={styles.suggestedText}>Suggested Drink:</Text>
              <Text style={styles.suggestedText}>{suggestedDrink}</Text>
            </View>
              <Text style={{ textAlign:'center',  color: '#888', marginBottom: 5 }}>BarBuddy doesn't have a recipe for this drink.</Text>
              <TouchableOpacity style={styles.button} onPress={() => {
                    const query = encodeURIComponent(`${suggestedDrink} recipe`);
                    const url = `https://www.google.com/search?q=${query}`;
                    Linking.openURL(url);
                  }}>
                <Text style={styles.buttonText}>Search The Web</Text>
              </TouchableOpacity>
        </View>
        )}
        {suggestedDrink !== '' && isDrinkValid == true && (
        <View>
     {selectedDrink && (
  <TouchableOpacity
    onPress={() => router.push(`../drink/${encodeURIComponent(selectedDrink.name)}`)}
    style={styles.suggestedContainer}
  >
    <Image source={{ uri: selectedDrink.image }} style={styles.bannerImage} />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.8)']}
      style={styles.gradientOverlay}
    />
    <View style={styles.bannerContent}>
      <Text style={styles.drinkLabel}>Suggested Drink</Text>
      <Text style={styles.drinkName}>{selectedDrink.name}</Text>
      <View style={styles.viewContainer}>
        <Text style={styles.viewText}>View Full Recipe</Text>
      </View>
    </View>
  </TouchableOpacity>
)}
        <View>
        </View>
        </View>        
    )}
    </SafeAreaView>
  );
}

//Stylesheet
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
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
  drinkImage: {
    width: 20,
    height: 20,
    borderRadius: 8,
    marginRight: 12,
},
  button: {
    backgroundColor: '#5c5c99',
    justifyContent: 'flex-end',
    padding: 25,
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  submitText: {
    color: '#5c5c9a',
    fontSize: 16,
    marginLeft: 10,
  },
  descriptionText: { 
    textAlign: 'center', 
    marginTop: 30,
    marginBottom: 30, 
    color: '#888' 
  },
  inputContainer: {
  backgroundColor: '#f5f5fc',
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 8,
  marginHorizontal: 20,
  flexDirection: 'row',
  alignItems: 'center',
},
suggestedTextContainer: {
  backgroundColor: '#f5f5fc',
  margin: 20,
  padding: 20,
},
suggestedContainer: {
  height: 400,
  borderRadius: 16,
  overflow: 'hidden',
  margin: 20,
},
suggestedText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
},
mealInput: {
  flex: 1,
  height: 40,
  paddingHorizontal: 10,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  color: '#888',
},
viewButton: {
    flex: 1,
    justifyContent: 'flex-end',
},
viewsIcon: {
  marginTop: 20,
  marginLeft: 80,
},
bannerImage: {
  width: '100%',
  height: '100%',
  position: 'absolute',
},
gradientOverlay: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  bottom: 0,
  left: 0,
},
bannerContent: {
  position: 'absolute',
  bottom: 20,
  left: 20,
  right: 20,
},
drinkLabel: {
 color: '#fff',
 fontSize: 16,
 fontWeight: '600',
 marginBottom: 4,
},
drinkName: {
 color: '#fff',
 fontSize: 26,
 fontWeight: 'bold',
},
viewContainer: {
 flexDirection: 'row',
 alignItems: 'center',
 marginTop: 6,
},
viewText: {
 color: '#fff',
 fontSize: 14,
},

});