import { View, Text, StyleSheet, RefreshControl, Platform, FlatList, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { db, auth, model } from '@/firebase/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LearningHubCard from '@/components/LearningHubCard';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from 'react-native-reanimated-carousel';
import { StatusBar } from 'react-native';

export default function HomeScreen() {
  type Cocktail = {
    name: string;
    image: string;
    views: number;
  };

  //Declare state variables
  const [username, setUsername] = useState<string | null>(null);
  const [randomTip, setRandomTip] = useState<string>('');
  const [savedDrinks, setSavedDrinks] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [drinks, setDrinks] = useState<any[]>([]);
  const [randomTopDrink, setRandomTopDrink] = useState<Cocktail | null>(null);
  const [top5Drinks, setTop5Drinks] = useState<Cocktail[]>([]);

  //Define window width as a constant for styling
  const { width } = Dimensions.get('window');

  //Fetch username
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

  //Fetch drinks from database
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

  //Generates the Bar Hack using Vertex AI
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

  //Get top 5 trending drinks
  const topTrendingDrinks = async () => {
    try {
      const cocktailsSnapshot = await getDocs(collection(db, 'cocktails'));
      const cocktailsData = cocktailsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          name: data.name,
          image: data.image,
          views: data.views,
        };
      });
      const sortedDrinks = cocktailsData.sort((a, b) => b.views - a.views);
      const top5 = sortedDrinks.slice(0, 5);
      setTop5Drinks(top5);
      setRandomTopDrink(top5[Math.floor(Math.random() * top5.length)]);
    } catch (error) {
      console.error('Error fetching trending drinks:', error);
    }
  };

  //Fetch user's saved drinks
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

  //Fetch recent reviews
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

  //Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchUsername(),
      generateRandomTip(),
      topTrendingDrinks(),
      fetchSavedDrinks(),
      fetchRecentReviews(),
      fetchDrinks()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, []);
  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header elements */}
      <View style={styles.header}>
        { /* BarBuddy Icon and Name */ }
        <Image
          source={require('../../assets/icons/BarBuddy-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.screenTitle}>BarBuddy</Text>
      </View>
      {/* Scrollable elements */}
      <ScrollView
        /* Swipe down to refresh */
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome message */}
        {username && (
          <Text style={styles.welcomeText}>Welcome, {username}</Text>
        )}

        { /* Carousel of top 5 trending drinks */ }
        <Carousel
          width={width}
          height={300}
          autoPlay={true} 
          autoPlayInterval={10000}
          data={top5Drinks}
          renderItem={({ item }: { item: Cocktail }) => (
            <TouchableOpacity
              onPress={() => router.push(`../drink/${encodeURIComponent(item.name)}`)}
              style={styles.trendingContainer}
            >
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.image }} style={styles.bannerImage} />
            </View>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
            />
              <View style={styles.bannerContent}>
                <Text style={styles.trendingLabel}>Trending Drink</Text>
                <Text style={styles.trendingName}>{item.name}</Text>

                <View style={styles.viewsContainer}>
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text style={styles.viewsText}>{item.views} views</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Business Listings and Promotions buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.halfButton} onPress={() => router.push('../business/listings')}>
            <Text style={styles.businessButtonText}>Find Businesses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.halfButton} onPress={() => router.push('/business/promotion/promotions')}>
            <Text style={styles.businessButtonText}>Promotions</Text>
          </TouchableOpacity>
        </View>
        
        {/* Random Drink Tip card */}
        {randomTip && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={24} color="#292966" style={{ marginRight: 6 }} />
              <Text style={styles.tipTitle}>Bar Hack</Text>
            </View>
            <Text style={styles.tipText}>{randomTip}</Text>
          </View>
        )}

        {/* Horizontal list of the last 10 drinks the user has saved */}
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

        {/* Horizontal list of most recent Reviews */}
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
                      <Image source={{ uri: item.photoURL }} style={styles.profilePicture} />
                    ) : (
                      <View style={[styles.profilePicture, { backgroundColor: '#ccc' }]} />
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

        {/* Learning Hub Card - Found in Componenets folder*/}
        <LearningHubCard />

      </ScrollView>
    </SafeAreaView>
  );
}

//Stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  scrollContent: {
    paddingTop: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingLeft: 10,
    marginBottom: 10,
  },
  icon: {
    width: 36,
    height: 36,
    marginRight: 10,
    tintColor: '#5c5c99',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5c5c9a',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5c5c9a',
    textAlign: 'center',
    marginBottom: 20,
  },
  trendingContainer: {
    height: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  imageWrapper: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'relative',
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
  trendingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  viewsText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  halfButton: {
    backgroundColor: '#5c5c99',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  businessButton: {
    backgroundColor: '#5c5c99',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  businessButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500'
  },
  tipCard: {
    marginTop: 20,                      
    marginHorizontal: 10,
    backgroundColor: '#CCCCFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A3A3CC',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 18,
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
    margin: 10,
  },
  savedSection: {
    marginTop: 20,
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
    width: 100,
  },
  drinkImageSmall: {
    width: 100,
    height: 100,
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
    width: 100,
    height: 100,
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
    width: 240,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicture: {
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
});