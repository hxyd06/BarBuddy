import { View, Text, StyleSheet, RefreshControl, Platform, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { db, auth, model } from '@/firebase/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [randomTip, setRandomTip] = useState<string>('');
  const [savedDrinks, setSavedDrinks] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [drinks, setDrinks] = useState<any[]>([]);

  const fetchUsername = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username);
        }
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  const fetchDrinks = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'cocktails'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDrinks(data);
  } catch (error) {
    console.error('Error fetching drinks:', error);
  }
};

  const handleRandomDrink = () => {
    if (drinks.length === 0) return;

    const randomIndex = Math.floor(Math.random() * drinks.length);
    const randomDrink = drinks[randomIndex];

    router.push(`/drink/${encodeURIComponent(randomDrink.name)}`);
    console.log(randomDrink.name);
  };

  const generateRandomTip = async () => {
    try {
      const promptIdeas = [
        'Give a clever tip about garnishes that most home bartenders overlook. No more than 3 sentences.',
        'What’s a smart hack to balance sour and sweet in cocktails? Keep it within 3 sentences.',
        'Suggest a cocktail tip involving unexpected ingredients. Limit to 3 sentences.',
        'What’s a quirky technique to make cocktails visually impressive? No longer than 3 sentences.',
        'Give a smart tip for using ice in cocktails creatively. Use no more than 3 sentences.',
        'Offer a creative tip to improve the aroma of a cocktail. Tip should be within 3 sentences.',
        'Provide a tip on how to use bitters more effectively. Keep the response under 3 sentences.',
        'What’s a useful but lesser-known shaking or stirring technique? Max 3 sentences.',
      ];
      const randomPrompt = promptIdeas[Math.floor(Math.random() * promptIdeas.length)];

      const result = await model.generateContent(randomPrompt);
      const tip = result.response.text().trim();
      if (tip) {
        setRandomTip(tip);
      } else {
        console.warn('No tip returned from Gemini.');
      }
    } catch (error) {
      console.error('Error generating tip:', error);
    }
  };

  const fetchSavedDrinks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const snapshot = await getDocs(query(collection(db, 'users', user.uid, 'savedRecipes'), orderBy('savedAt', 'desc'), limit(10)));
      const saved = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedDrinks(saved);
    } catch (error) {
      console.error('Error fetching saved drinks:', error);
    }
  };

  const fetchRecentReviews = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'allReviews'), orderBy('createdAt', 'desc'), limit(10)));
      const reviewPromises = snapshot.docs.map(async (docSnap) => {
        const reviewData = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', reviewData.uid));
        let username = 'Unknown';
        let photoURL = null;
        if (userDoc.exists()) {
          const userData = userDoc.data();
          username = userData.username || reviewData.email?.split('@')[0] || 'Unknown';
          photoURL = userData.photoURL || null;
        } else {
          username = reviewData.email?.split('@')[0] || 'Unknown';
        }
        return { id: docSnap.id, ...reviewData, username, photoURL };
      });
      const reviewsWithUserData = await Promise.all(reviewPromises);
      setRecentReviews(reviewsWithUserData);
    } catch (error) {
      console.error('Error fetching recent reviews:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchUsername(), generateRandomTip(), fetchSavedDrinks(), fetchRecentReviews(), fetchDrinks()]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>BarBuddy</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {username && (
          <Text style={styles.welcomeText}>Welcome, {username}</Text>
        )}

        {randomTip && (
          <View style={styles.tipBadge}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={24} color="#292966" style={{ marginRight: 6 }} />
              <Text style={styles.tipTitle}>Bar Hack</Text>
            </View>
            <Text style={styles.tipText}>{randomTip}</Text>
          </View>
        )}

          <TouchableOpacity style={styles.randomButton} onPress={handleRandomDrink}>
            <Text style={styles.randomButtonText}>Surprise Me</Text>
          </TouchableOpacity>

        {savedDrinks.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedHeader}>Your Recent Saved Drinks</Text>
            <FlatList
              data={[...savedDrinks, { id: 'viewAll', viewAll: true }]}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                item.viewAll ? (
                  <TouchableOpacity
                    style={styles.drinkCardSmall}
                    onPress={() => router.push('/settings/saved')}>
                    <View style={styles.viewAllPlaceholder}> 
                      <Ionicons name="arrow-forward-circle-outline" size={36} color="#5c5c9a" />
                    </View>
                    <Text style={styles.drinkName}>View All</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.drinkCardSmall}
                    onPress={() => router.push(`/drink/${encodeURIComponent(item.name)}`)}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.drinkImageSmall} />
                    ) : (
                      <View style={styles.placeholderSmall} />
                    )}
                    <Text style={styles.drinkName}>{item.name}</Text>
                  </TouchableOpacity>
                )
              )}
            />
          </View>
        )}

        {recentReviews.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedHeader}>Recent Reviews</Text>
            <FlatList
              data={recentReviews}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reviewCard}
                  onPress={() => router.push(`/drink/${encodeURIComponent(item.drinkName)}/reviews`)}>
                  <View style={styles.reviewHeader}>
                    {item.photoURL ? (
                      <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: '#ccc' }]} />
                    )}
                    <Text style={styles.reviewUsername}>{item.username}</Text>
                  </View>
                  <Text style={styles.reviewRating}>Rating: {item.rating} / 5</Text>
                  <Text style={styles.reviewText}>{item.text}</Text>
                  <Text style={styles.reviewDrink}>on "{item.drinkName}"</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  scrollContent: {
    paddingTop: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5c5c9a',
    textAlign: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5c5c9a',
    textAlign: 'center',
  },
  tipBadge: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#CCCCFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A3A3CC',
    width: '100%',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292966',
  },
  tipText: {
    color: '#292966',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'left',
    flexShrink: 1,
    lineHeight: 20,
  },
  savedSection: {
    marginTop: 30,
    width: '100%',
    paddingLeft: 10,
  },
  savedHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#5c5c9a',
  },
  drinkCardSmall: {
    marginRight: 12,
    alignItems: 'center',
    width: 85,
  },
  drinkImageSmall: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  placeholderSmall: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  viewAllPlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: '#f5f5fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drinkName: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#f0f0f9',
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
    width: 220,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  reviewUsername: {
    fontWeight: 'bold',
    color: '#292966',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
  reviewRating: {
    marginTop: 4,
    fontSize: 14,
    color: '#777',
  },
  reviewDrink: {
    marginTop: 4,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  randomButton: {
    backgroundColor: '#5c5c99',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  randomButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
});