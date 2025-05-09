// Imports: UI, navigation, icons, Firebase
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import {
  collection, doc, setDoc, getDocs, addDoc, deleteDoc,
  query, where, Timestamp, onSnapshot, getDoc
} from 'firebase/firestore';

// Reviews screen for a specific drink
export default function ReviewsScreen() {
  const { drink } = useLocalSearchParams();
  const router = useRouter();

  // Local state
  const [userProfiles, setUserProfiles] = useState<Record<string, { photoURL?: string; username?: string }>>({});
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const drinkId = (drink as string)?.toLowerCase().replace(/\s+/g, '');
  const currentUser = auth.currentUser;

  // Realtime listener for reviews on this drink
  useEffect(() => {
    if (!drinkId) return;

    const q = query(collection(db, 'cocktails', drinkId, 'reviews'));
    const unsubscribe = onSnapshot(q, async snapshot => {
      const liveReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(liveReviews);
      await fetchUserProfiles(liveReviews);
    });

    return () => unsubscribe();
  }, [drinkId]);

  // Load profile pictures and usernames for review authors
  const fetchUserProfiles = async (reviews: any[]) => {
    const uids = [...new Set(reviews.map(r => r.uid))];
    const profileMap: Record<string, { photoURL?: string; username?: string }> = {};

    for (const uid of uids) {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        profileMap[uid] = {
          photoURL: data.photoURL,
          username: data.username,
        };
      }
    }

    setUserProfiles(profileMap);
  };

  // Submit or update a review
  const submitReview = async () => {
    const user = auth.currentUser;
    if (!user || !drinkId || rating === 0 || !reviewText.trim()) return;

    const reviewData = {
      uid: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      text: reviewText.trim(),
      rating,
      drinkId,
      drinkName: drink,
      createdAt: Timestamp.now(),
    };

    try {
      if (editingReviewId) {
        // Update existing review
        await setDoc(doc(db, 'cocktails', drinkId, 'reviews', editingReviewId), reviewData, { merge: true });

        const allReviewsQuery = query(
          collection(db, 'allReviews'),
          where('userId', '==', user.uid),
          where('drinkId', '==', drinkId)
        );
        const snapshot = await getDocs(allReviewsQuery);

        for (const docSnap of snapshot.docs) {
          await setDoc(doc(db, 'allReviews', docSnap.id), {
            ...reviewData,
            userId: user.uid,
            comment: reviewData.text,
          }, { merge: true });
        }

        setEditingReviewId(null);
      } else {
        // Add new review
        await addDoc(collection(db, 'cocktails', drinkId, 'reviews'), reviewData);
        await addDoc(collection(db, 'allReviews'), {
          ...reviewData,
          userId: user.uid,
          comment: reviewData.text,
        });
      }

      setReviewText('');
      setRating(0);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  // Render a single review card
  const renderReviewCard = (item: any) => (
    <View style={styles.reviewCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {userProfiles[item.uid]?.photoURL ? (
          <Image
            source={{ uri: userProfiles[item.uid]?.photoURL }}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
          />
        ) : (
          <Ionicons name="person-circle-outline" size={32} color="#aaa" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.reviewName}>
          {userProfiles[item.uid]?.username || item.username}
        </Text>
      </View>
      <Text style={styles.reviewRating}>Rating: {item.rating}/5</Text>
      <Text style={styles.reviewText}>{item.text}</Text>

      {/* Edit/Delete actions if current user authored this review */}
      {auth.currentUser?.uid === item.uid && (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => {
            setReviewText(item.text);
            setRating(item.rating);
            setEditingReviewId(item.id);
          }}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={async () => {
            try {
              await deleteDoc(doc(db, 'cocktails', drinkId, 'reviews', item.id));
              const allReviewsQuery = query(
                collection(db, 'allReviews'),
                where('userId', '==', item.uid),
                where('drinkId', '==', drinkId)
              );
              const snapshot = await getDocs(allReviewsQuery);
              snapshot.forEach(docSnap => {
                deleteDoc(doc(db, 'allReviews', docSnap.id));
              });
            } catch (error) {
              console.error('Error deleting review:', error);
            }
          }}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Filter user review separately from others
  const userReview = reviews.find(r => r.uid === currentUser?.uid);
  const otherReviews = reviews.filter(r => r.uid !== currentUser?.uid);

  // Render review form and list
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
      </View>

      {/* Review form */}
      <View style={{ padding: 20 }}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} onPress={() => setRating(i)}>
              <Ionicons
                name={i <= rating ? 'star' : 'star-outline'}
                size={28}
                color="#f5c518"
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="Write a review..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
          <Text style={styles.submitText}>Submit Review</Text>
        </TouchableOpacity>

        {/* User's own review */}
        {userReview && (
          <>
            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>You posted:</Text>
            {renderReviewCard(userReview)}
          </>
        )}

        {/* Other users' reviews */}
        {otherReviews.length > 0 && (
          <>
            <Text style={{ fontWeight: 'bold', marginBottom: 6, marginTop: 12 }}>Others posted:</Text>
            <FlatList
              data={otherReviews}
              keyExtractor={item => item.id}
              renderItem={({ item }) => renderReviewCard(item)}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#5c5c99',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reviewCard: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewName: {
    fontWeight: 'bold',
  },
  reviewRating: {
    marginBottom: 4,
    color: '#777',
  },
  reviewText: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: {
    color: '#5c5c99',
    fontWeight: 'bold',
    marginRight: 16,
  },
  deleteButton: {
    color: 'red',
    fontWeight: 'bold',
  },
});
