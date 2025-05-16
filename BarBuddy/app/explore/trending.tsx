import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

//Trending Drinks Screen
export default function TrendingDrinksScreen() {
    type Cocktail = {
    name: string;
    image: string;
    views: number;
    };

  const router = useRouter(); //Router navigation
  const [loading, setLoading] = useState(true);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);

  //Fetch all drinks
    useEffect(() => {
  const fetchDrinks = async () => {
    try {
      const cocktailsSnapshot = await getDocs(collection(db, 'cocktails'));
      const cocktailsData = cocktailsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        //Fetch name, image, viewcount
        return {
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
}, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('../explore')}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Trending Drinks</Text>
      </View>

      {loading ? (
  <Text style={styles.emptyText}>Loading...</Text>
) : cocktails.length === 0 ? (
  <Text style={styles.emptyText}>No trending drinks found.</Text>
) : (
    //Drink list
  <FlatList
    data={cocktails.sort((a, b) => b.views - a.views)} //Sort by views
    keyExtractor={(item, index) => index.toString()}
    contentContainerStyle={{ padding: 20 }}
    renderItem={({ item }) => (
  <TouchableOpacity style={styles.drinkCard} onPress={() => router.push(`/drink/${encodeURIComponent(item.name)}`)}>
    <Image source={{ uri: item.image }} style={styles.drinkImage}/>
    <View style={{ flex: 1 }}>
      <Text style={styles.drinkName}>{item.name}</Text>
      <View style={styles.viewRow}>
        <Ionicons name="eye-outline" size={16} color="#555" style={{ marginRight: 4 }} />
        <Text style={styles.viewsText}>{item.views}</Text>
      </View>
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#f5f5fc',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
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
  drinkCard: {
    backgroundColor: '#f5f5fc',
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
},
drinkImage: {
  width: 60,
  height: 60,
  borderRadius: 8,
  marginRight: 12,
},
viewRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},
viewsText: {
  fontSize: 14,
  color: '#555',
},
});