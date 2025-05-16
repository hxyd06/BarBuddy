import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { model, db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, updateDoc, increment } from 'firebase/firestore';
import { auth } from '@/firebase/firebaseConfig';

// Drink detail screen component
export default function DrinkDetailScreen() {
  const { drink } = useLocalSearchParams();
  const router = useRouter();

  // Local state
  const [drinkData, setDrinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [hasBadIngredient, setHasBadIngredient] = useState(false);
  const [aiTip, setAiTip] = useState<string>('');

  // Fetch drink data and metadata
  useEffect(() => {
    if (drink) {
      fetchDrinkDetails(decodeURIComponent(drink as string));
    }
  }, [drink]);

  // Retrieve drink details, reviews, and AI description
  const fetchDrinkDetails = async (drinkName: string) => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${drinkName}`);
      const data = await response.json();

      if (data.drinks && data.drinks.length > 0) {
        const cocktail = data.drinks[0];
        setDrinkData(cocktail);

        setDrinkData(cocktail);

      // Increment drink view count
      const incrementViews = async (drinkName: string) => {
        try {
          const cocktailRef = doc(db, 'cocktails', drinkName);
          await updateDoc(cocktailRef, { views: increment(1) });
        } catch (error) {
          console.error('Error incrementing views.', error);
        }
      };
      await incrementViews(cocktail.strDrink.toLowerCase().replace(/\s+/g, ''));


        // Fetch average rating from reviews subcollection
        const reviewsRef = collection(db, 'cocktails', cocktail.strDrink.toLowerCase().replace(/\s+/g, ''), 'reviews');
        const reviewSnap = await getDocs(reviewsRef);
        if (!reviewSnap.empty) {
          const total = reviewSnap.docs.reduce((sum, doc) => sum + (doc.data().rating || 0), 0);
          setAverageRating(total / reviewSnap.size);
        }

        // Check if drink is saved
        if (auth.currentUser) {
          const savedRef = doc(db, 'users', auth.currentUser.uid, 'savedRecipes', cocktail.strDrink.toLowerCase().replace(/\s+/g, ''));
          const savedSnap = await getDoc(savedRef);
          setIsSaved(savedSnap.exists());
        }

        // Get or generate AI description
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

        // Get or generate AI tip
        if (existingData.tip) {
          setAiTip(existingData.tip);
        } else {
          const ingredients = Array.from({ length: 15 }, (_, i) => cocktail[`strIngredient${i + 1}`])
            .filter(Boolean)
            .join(', ');
          const tipPrompt = `Give a short, clever 1–2 sentence serving or preparation tip for a cocktail called "${cocktail.strDrink}" made with these ingredients: ${ingredients}.`;

          const tipResult = await model.generateContent(tipPrompt);
          const tip = tipResult.response.text().trim();

          if (tip) {
            setAiTip(tip);
            await setDoc(drinkDocRef, { tip }, { merge: true });
          } else {
            console.error('No tip returned from Gemini.');
          }
        }
      } else {
        setDrinkData(null);
      }
    } catch (error) {
      console.log('Error fetching drink details:');
    } finally {
      setLoading(false);
    }
  };

  // Save or unsave drink to user's saved recipes
  const handleSaveDrink = async () => {
    const user = auth.currentUser;
    if (!user || !drinkData) return;

    const recipeId = drinkData.strDrink.toLowerCase().replace(/\s+/g, '');
    const recipeRef = doc(db, 'users', user.uid, 'savedRecipes', recipeId);

    try {
      if (isSaved) {
        await deleteDoc(recipeRef);
        setIsSaved(false);
      } else {
        const recipeData = {
          name: drinkData.strDrink,
          image: drinkData.strDrinkThumb,
          ingredients: Array.from({ length: 15 }, (_, i) => ({
            ingredient: drinkData[`strIngredient${i + 1}`],
            measure: drinkData[`strMeasure${i + 1}`],
          })).filter((item) => item.ingredient),
          instructions: drinkData.strInstructions,
          savedAt: new Date(),
        };
        await setDoc(recipeRef, recipeData);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling saved recipe:', error);
    }
  };
  
  const handleShareDrink = async () => { 
    // if no drink data, return empty
    if (!drinkData) return;
    try {
      // format the ingredients and measurements for readability
      const formattedIngredients = Array.from({ length: 15 }, (_, i) => ({
        ingredient: drinkData[`strIngredient${i + 1}`],
        measure: drinkData[`strMeasure${i + 1}`],
      }))
      .filter((item) => item.ingredient)
      .map((item) => `• ${item.measure || ''} ${item.ingredient}`)
      .join('\n');
      // format the share message
      const shareMessage = `Here's a recipe from BarBuddy!\n\n`+
                          `🍹 ${drinkData.strDrink} 🍹\n\n` +
                          `${aiDescription ? aiDescription + '\n\n' : ''}` +
                          `Ingredients:\n${formattedIngredients}\n\n` +
                          `Instructions:\n${drinkData.strInstructions}`;
      
      //share the message                    
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error('Error sharing drink:', error);
    }
  };

  // Check ingredients against user preferences
  useEffect(() => {
    const checkIngredients = async () => {
      if (!drinkData || !auth.currentUser) return;

      try {
        const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const preferences = userSnap.data()?.preferences || {};
        const requiredPrefs = Object.entries(preferences)
          .filter(([_, val]) => val === true)
          .map(([key]) => key);

        const ingredients = Array.from({ length: 15 }, (_, i) => drinkData[`strIngredient${i + 1}`])
          .filter(Boolean)
          .map((ing) => ing.trim().toLowerCase());

        for (const ingName of ingredients) {
          const ingSnap = await getDoc(doc(db, 'ingredients_master', ingName));
          const ingPrefsStr = ingSnap.data()?.preferences || '';
          const ingPrefs = ingPrefsStr.split(' ');
          const matchesAll = requiredPrefs.every((pref) => ingPrefs.includes(pref));
          if (!matchesAll) {
            setHasBadIngredient(true);
            return;
          }
        }

        setHasBadIngredient(false);
      } catch (error) {
        console.error('Error checking ingredient preferences:', error);
        setHasBadIngredient(false);
      }
    };

    checkIngredients();
  }, [drinkData]);

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

      {/* Drink details screen header */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Save button and View Saved button */}
        <View style={styles.saveWrapper}>
          {isSaved && (
            <TouchableOpacity style={styles.viewSavedButton} onPress={() => router.push('/settings/saved')}>
              <Text style={styles.viewSavedText}>View Saved</Text>
            </TouchableOpacity>
          )}
          <View style={styles.actionButtonsColumn}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSaveDrink}>
              <Ionicons name={isSaved ? 'checkmark' : 'bookmark-outline'} size={28} color="white" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleShareDrink}>
              <Ionicons name="share-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Drink immage and rating */}
        <View>
          {drinkData.strDrinkThumb ? (
            <Image source={{ uri: drinkData.strDrinkThumb }} style={styles.headerImage} />
          ) : (
            <View style={[styles.headerImage, { backgroundColor: '#ddd' }]} />
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay} />
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{drinkData.strDrink}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
        
        {/* Drink description generated by AI */}
        {aiDescription && (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{aiDescription}</Text>
          </View>
        )}

        {/* Dietry preference warning */}
        {hasBadIngredient && (
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>
              This drink may contain ingredients that don't match your preferences.
            </Text>
          </View>
        )}

        {/* Displays the drinks ingredients */}
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
        
        {/* Tips badge generated by AI */}
        {aiTip && (
          <View style={styles.tipBadge}>
            <View style={styles.tipInner}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb-outline" size={24} color="#292966" style={{ marginRight: 6 }} />
                <Text style={styles.tipTitle}>Tips:</Text>
              </View>
              <Text style={styles.tipText}>{aiTip}</Text>
            </View>
          </View>
        )}

        {/* Review button */}
        <View style={styles.reviewsSection}>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => router.push(`/drink/${drink}/reviews`)}>
            <Text style={styles.reviewButtonText}>View Reviews</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Styles for Drink details screen:
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerImage: { width: '100%', height: 400, resizeMode: 'cover' },
  gradientOverlay: { position: 'absolute', width: '100%', height: 400 },
  backButton: {
    height: 40,
    width: 40,
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 30,
    zIndex: 10,
  },
  actionButton: {
    height: 40,
    width: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 30,
    marginBottom: 5,
  },
  actionButtonsColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  saveWrapper: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  viewSavedButton: {
    height: 40,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  viewSavedText: { color: '#FFF', fontWeight: 'bold' },
  titleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  heading: { fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  text: { fontSize: 16, marginBottom: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  descriptionBox: { paddingHorizontal: 16, paddingTop: 30 },
  descriptionText: { fontStyle: 'italic', fontSize: 16 },
  reviewsSection: { alignItems: 'center', marginTop: 30 },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5c5c99',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  tipBadge: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#CCCCFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A3A3CC',
  },
  tipInner: {
    paddingHorizontal: 12, // match this to `tipBadge` padding
  },
  tipText: {
    color: '#292966',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'left',
    flexShrink: 1,
    lineHeight: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    color: '#292966',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 18,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  ratingText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
});