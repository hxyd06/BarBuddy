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
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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

  const generateRandomTip = async () => {
    try {
      const prompt = 'Give me a short, clever 1–2 sentence tip for making better cocktails.';
      const result = await model.generateContent(prompt);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchUsername(), generateRandomTip(), fetchSavedDrinks()]).finally(() => {
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
              <Text style={styles.tipTitle}>Tip of the Day:</Text>
            </View>
            <Text style={styles.tipText}>{randomTip}</Text>
          </View>
        )}

        {savedDrinks.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedHeader}>Your Recent Saved Drinks</Text>
            <FlatList
              data={savedDrinks}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.drinkCard}
                  onPress={() => router.push(`/drink/${encodeURIComponent(item.name)}`)}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.drinkImage} />
                  ) : (
                    <View style={styles.placeholder} />
                  )}
                  <Text style={styles.drinkName}>{item.name}</Text>
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
  drinkCard: {
    marginRight: 12,
    alignItems: 'center',
    width: 100,
  },
  drinkImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  drinkName: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
});
