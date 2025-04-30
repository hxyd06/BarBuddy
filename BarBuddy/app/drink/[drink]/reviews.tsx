import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, doc, setDoc, getDocs, addDoc, deleteDoc, query, where, Timestamp, onSnapshot } from 'firebase/firestore';

export default function ReviewsScreen() {
  const { drink } = useLocalSearchParams();
  const router = useRouter();

  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const drinkId = (drink as string)?.toLowerCase().replace(/\s+/g, '');

  useEffect(() => {
      if (!drinkId) return;
    
      const q = query(collection(db, 'cocktails', drinkId, 'reviews'));
      const unsubscribe = onSnapshot(q, snapshot => {
        const liveReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(liveReviews);
      });
    
      return () => unsubscribe();
    }, [drinkId]);

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
          // ✅ 1. Update in cocktail subcollection
          await setDoc(
            doc(db, 'cocktails', drinkId, 'reviews', editingReviewId),
            reviewData,
            { merge: true }
          );
    
          // ✅ 2. Find and update in allReviews
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
          // Add new
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
    

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>Reviews for {drink}</Text>

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

      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewName}>{item.username}</Text>
            <Text style={styles.reviewRating}>Rating: {item.rating}/5</Text>
            <Text style={styles.reviewText}>{item.text}</Text>

            {auth.currentUser?.uid === item.uid && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => {
                    setReviewText(item.text);
                    setRating(item.rating);
                    setEditingReviewId(item.id);
                  }}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    try {
                      // Delete from drink-specific reviews
                      await deleteDoc(doc(db, 'cocktails', drinkId, 'reviews', item.id));

                      // Delete from allReviews where uid and drinkId match
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
                  }}
                >
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 10,
    backgroundColor: '#5c5c99',
    borderRadius: 20,
    padding: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
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
    marginBottom: 4,
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
