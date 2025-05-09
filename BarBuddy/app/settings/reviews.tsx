import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

// Screen to display all reviews submitted by the current user
export default function UserReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const router = useRouter();

  // Fetch user's reviews on mount
  useEffect(() => {
    const fetchUserReviews = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const reviewQuery = query(collection(db, 'allReviews'), where('userId', '==', user.uid));
        const snapshot = await getDocs(reviewQuery);
        const reviewList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(reviewList);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchUserReviews();
  }, []);

  // Render list of user's reviews
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Reviews</Text>
      </View>

      {/* Reviews list or empty fallback */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/drink/${encodeURIComponent(item.drinkName)}`)}
          >
            <Text style={styles.drinkName}>{item.drinkName}</Text>
            <Text style={styles.rating}>Rating: {item.rating}/5</Text>
            <Text style={styles.comment}>{item.comment}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No reviews found.</Text>}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
}

// Styles for saved reviews screen: 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#5c5c99',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: { 
    marginRight: 10 
  },

  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff' 
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
  rating: { 
    marginTop: 4 
  },

  comment: { 
    marginTop: 6, 
    color: '#555' 
  },

  emptyText: { 
    textAlign: 'center', 
    marginTop: 30, 
    color: '#888' 
  },
});
