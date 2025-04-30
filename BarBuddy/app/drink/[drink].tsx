import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { model, db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function DrinkDetailScreen() {
  const { drink } = useLocalSearchParams();
  const router = useRouter();
  const [drinkData, setDrinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiDescription, setAiDescription] = useState<string>('');

  useEffect(() => {
    if (drink) {
      fetchDrinkDetails(decodeURIComponent(drink as string));
    }
  }, [drink]);

  const fetchDrinkDetails = async (drinkName: string) => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${drinkName}`);
      const data = await response.json();

      if (data.drinks && data.drinks.length > 0) {
        const cocktail = data.drinks[0];
        setDrinkData(cocktail);

        const drinkDocRef = doc(db, 'cocktails', cocktail.strDrink.toLowerCase().replace(/\s+/g, ''));
        const drinkSnap = await getDoc(drinkDocRef);
        const existingData = drinkSnap.exists() ? drinkSnap.data() : {};

        if (existingData.description) {
          setAiDescription(existingData.description);
        } else {
          const prompt = `Write a short, fun 2-sentence description for a cocktail called "${cocktail.strDrink}".`;

          const result = await model.generateContent(prompt);
          const description = result.response.text().trim();

          if (description) {
            setAiDescription(description);
            await setDoc(drinkDocRef, { description }, { merge: true });
          } else {
            console.error('No description returned from Gemini.');
          }
        }
      } else {
        setDrinkData(null);
      }
    } catch (error) {
      console.error('Error fetching drink details or AI description:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!drinkData) {
    return (
      <View style={styles.center}>
        <Text>No details found for this drink.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
      <TouchableOpacity style={styles.saveButton} onPress={() => console.log('Save tapped')}>
              <Ionicons name="bookmark-outline" size={28} color="white" />
            </TouchableOpacity>
        <View>
          {drinkData.strDrinkThumb ? (
            <Image source={{ uri: drinkData.strDrinkThumb }} style={styles.headerImage} />
          ) : (
            <View style={[styles.headerImage, { backgroundColor: '#ddd' }]} />
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay} />
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{drinkData.strDrink}</Text>
          </View>
        </View>

        
        {aiDescription && (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{aiDescription}</Text>
          </View>
        )}

       
        <View style={styles.content}>
          <Text style={styles.heading}>Ingredients</Text>
          {Array.from({ length: 15 }, (_, i) => i + 1)
            .map((num) => ({
              ingredient: drinkData[`strIngredient${num}`],
              measure: drinkData[`strMeasure${num}`],
            }))
            .filter((item) => item.ingredient)
            .map((item, idx) => (
              <Text key={idx} style={styles.text}>
                • {item.measure ?? ''} {item.ingredient ?? ''}
              </Text>
            ))}

          <Text style={styles.heading}>Instructions</Text>
          <Text style={styles.text}>{drinkData.strInstructions}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: 400,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 30,
    zIndex: 10,
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 30,
    zIndex: 10,
  },  
  titleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionBox: {
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  descriptionText: {
    fontStyle: 'italic',
    fontSize: 16,
  },
});
