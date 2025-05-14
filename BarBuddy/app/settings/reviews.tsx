import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

// Screen to display all reviews and replies submitted by the current user
export default function UserReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'replies'>('reviews');
  const router = useRouter();

  const fetchUserReviews = async (user: any) => {
    try {
      const reviewQuery = query(collection(db, 'allReviews'), where('userId', '==', user.uid));
      const snapshot = await getDocs(reviewQuery);
      const reviewList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewList);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchUserReplies = async (user: any) => {
    try {
      const replyQuery = query(collection(db, 'allReplies'), where('userId', '==', user.uid));
      const snapshot = await getDocs(replyQuery);
      const replyListWithUsernames = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const data = docSnap.data();
          let repliedToUser = 'a user';

          // Try to fetch the username from the original review the reply is attached to
          if (data.drinkId && data.reviewId) {
            const reviewRef = doc(db, 'cocktails', data.drinkId, 'reviews', data.reviewId);
            const reviewSnap = await getDoc(reviewRef);
            if (reviewSnap.exists()) {
              const reviewData = reviewSnap.data();
              const userProfileRef = doc(db, 'users', reviewData.uid);
              const userProfileSnap = await getDoc(userProfileRef);
              if (userProfileSnap.exists()) {
                repliedToUser = userProfileSnap.data().username || reviewData.username || 'a user';
              } else {
                repliedToUser = reviewData.username || 'a user';
              }
            }
          }

          return {
            id: docSnap.id,
            ...data,
            repliedToUser,
          };
        })
      );
      setReplies(replyListWithUsernames);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (user) {
        fetchUserReviews(user);
        fetchUserReplies(user);
      } else {
        const unsubscribe = auth.onAuthStateChanged(authUser => {
          if (authUser) {
            fetchUserReviews(authUser);
            fetchUserReplies(authUser);
          }
        });
        return () => unsubscribe();
      }
    }, [])
  );

  const renderReviewItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/drink/${encodeURIComponent(item.drinkName)}`)}
    >
      <Text style={styles.drinkName}>{item.drinkName}</Text>
      <Text style={styles.rating}>Rating: {item.rating}/5</Text>
      <Text style={styles.comment}>{item.comment}</Text>
    </TouchableOpacity>
  );

  const renderReplyItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/drink/${encodeURIComponent(item.drinkName)}`)}
    >
      <Text style={styles.drinkName}>{item.drinkName}</Text>
      <Text style={styles.rating}>Reply to {item.repliedToUser}</Text>
      <Text style={styles.comment}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Reviews</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setActiveTab('reviews')} style={[styles.tabButton, activeTab === 'reviews' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('replies')} style={[styles.tabButton, activeTab === 'replies' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'replies' && styles.activeTabText]}>Replies</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'reviews' ? reviews : replies}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'reviews' ? renderReviewItem : renderReplyItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab} found.</Text>}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
}

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
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ececff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5c5c99',
  },
  activeTabText: {
    color: '#5c5c99',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f5f5fc',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  drinkName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  rating: {
    marginTop: 4,
  },
  comment: {
    marginTop: 6,
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#888',
  },
});