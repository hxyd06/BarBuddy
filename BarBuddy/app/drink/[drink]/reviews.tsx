import {
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/firebase/firebaseConfig';
import {
  collection, doc, setDoc, getDocs, addDoc, deleteDoc,
  query, where, Timestamp, onSnapshot, getDoc
} from 'firebase/firestore';

// Interfaces for reviews, replies, and user profiles.
interface Review {
  id?: string;
  uid: string;
  username: string;
  text: string;
  rating: number;
  drinkId: string;
  drinkName: string;
  createdAt: Timestamp;
}

interface Reply {
  id?: string;
  uid: string;
  username: string;
  text: string;
  createdAt: Timestamp;
}

interface UserProfile {
  photoURL?: string;
  username?: string;
}

// Main ReviewsScreen component to handle reviews, replies, and user interactions.
export default function ReviewsScreen() {
  // Get the drink information from the query parameters.
  const { drink } = useLocalSearchParams<{ drink: string }>();
  const router = useRouter(); // For navigation (back button)
  const scrollViewRef = useRef<ScrollView>(null); // To manage scrolling behavior
  const inputRef = useRef<TextInput>(null); // To focus on reply input when needed

  // State variables to handle reviews, replies, user profiles, and UI states.
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [reviewText, setReviewText] = useState(''); // For inputting new review text
  const [rating, setRating] = useState(0); // For setting the review rating
  const [reviews, setReviews] = useState<Review[]>([]); // For storing the reviews
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null); // To track if a review is being edited
  const [replyText, setReplyText] = useState(''); // For inputting reply text
  const [activeThread, setActiveThread] = useState<string | null>(null); // For managing which thread is open
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // For identifying which review is being replied to
  const [replies, setReplies] = useState<Record<string, Reply[]>>({}); // For storing replies to reviews
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null); // To track if a reply is being edited

  const drinkId = drink?.toLowerCase().replace(/\s+/g, ''); // Format drink ID
  const currentUser = auth.currentUser; // Get the current logged-in user

  // Effect to load reviews data whenever the drinkId changes.
  useEffect(() => {
    if (!drinkId) return;

    const q = query(collection(db, 'cocktails', drinkId, 'reviews'));
    const unsubscribeReviews = onSnapshot(q, async snapshot => {
      const liveReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(liveReviews); // Update reviews state when data changes
    });

    return () => unsubscribeReviews(); // Cleanup when component unmounts or drinkId changes
  }, [drinkId]);

  // Effect to load replies for reviews and fetch user profiles.
  useEffect(() => {
    if (!drinkId) return;

    const unsubscribes: (() => void)[] = [];
    const allReplyUIDs = new Set<string>();

    // For each review, subscribe to its replies.
    reviews.forEach(review => {
      const repliesRef = collection(db, 'cocktails', drinkId, 'reviews', review.id!, 'replies');
      const unsubscribeReplies = onSnapshot(repliesRef, snapshot => {
        const replyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reply));
        setReplies(prev => {
          const updated = { ...prev, [review.id!]: replyList };

          // Collect UIDs for fetching user profiles of reviewers and reply authors.
          replyList.forEach(reply => allReplyUIDs.add(reply.uid));

          // Fetch profiles for all involved users
          const uidsToFetch = new Set<string>([...reviews.map(r => r.uid), ...allReplyUIDs]);
          fetchUserProfiles(Array.from(uidsToFetch));

          return updated;
        });
      });
      unsubscribes.push(unsubscribeReplies); // Store unsubscribe function for cleanup
    });

    return () => unsubscribes.forEach(unsub => unsub()); // Cleanup when component unmounts or reviews change
  }, [drinkId, reviews]);

  // Function to fetch user profiles from Firestore based on a list of UIDs.
  const fetchUserProfiles = async (uids: string[]) => {
    const profileMap: Record<string, UserProfile> = {};
    await Promise.all(
      uids.map(async uid => {
        if (!userProfiles[uid]) { // Avoid fetching already stored profiles
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            profileMap[uid] = { photoURL: data.photoURL, username: data.username };
          }
        }
      })
    );
    setUserProfiles(prev => ({ ...prev, ...profileMap })); // Update the state with the fetched profiles
  };

  // Function to submit a reply to a specific review.
  const submitReply = async (reviewId: string) => {
    const user = auth.currentUser;  
    if (!user || !drinkId || !replyText.trim()) return;

    const replyData: Reply = {
      uid: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      text: replyText.trim(),
      createdAt: Timestamp.now(),
    };

    const nestedRef = collection(db, 'cocktails', drinkId, 'reviews', reviewId, 'replies');

    try {
      if (editingReplyId) {
        await setDoc(doc(nestedRef, editingReplyId), replyData, { merge: true });

        const allRepliesQuery = query(
          collection(db, 'allReplies'),
          where('userId', '==', user.uid),
          where('drinkId', '==', drinkId),
          where('reviewId', '==', reviewId),
          where('nestedReplyId', '==', editingReplyId)
        );
        const snapshot = await getDocs(allRepliesQuery);
        for (const docSnap of snapshot.docs) {
          await setDoc(doc(db, 'allReplies', docSnap.id), {
            ...replyData,
            userId: user.uid,
            drinkId,
            drinkName: drink,
            reviewId,
            comment: replyData.text,
            nestedReplyId: editingReplyId,
          }, { merge: true });
        }

        setEditingReplyId(null);
      } else {
        const addedReplyRef = await addDoc(nestedRef, replyData);
        await addDoc(collection(db, 'allReplies'), {
          ...replyData,
          userId: user.uid,
          drinkId,
          drinkName: drink,
          reviewId,
          comment: replyData.text,
          nestedReplyId: addedReplyRef.id,
        });
      }

      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  // Function to submit a new review or update an existing review.
  const submitReview = async () => { 
    const user = auth.currentUser;
    if (!user || !drinkId || rating === 0 || !reviewText.trim()) return;

    const reviewData: Review = {
      uid: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      text: reviewText.trim(),
      rating,
      drinkId,
      drinkName: drink,
      createdAt: Timestamp.now(),
    };

    try {
      if (editingReviewId) { // If editing an existing review
        await setDoc(doc(db, 'cocktails', drinkId, 'reviews', editingReviewId), reviewData, { merge: true });
        const allReviewsQuery = query(collection(db, 'allReviews'), where('userId', '==', user.uid), where('drinkId', '==', drinkId));
        const snapshot = await getDocs(allReviewsQuery);
        for (const docSnap of snapshot.docs) {
          await setDoc(doc(db, 'allReviews', docSnap.id), { ...reviewData, userId: user.uid, comment: reviewData.text }, { merge: true });
        }
        setEditingReviewId(null); // Clear the editing state
      } else { // If submitting a new review
        await addDoc(collection(db, 'cocktails', drinkId, 'reviews'), reviewData);
        await addDoc(collection(db, 'allReviews'), { ...reviewData, userId: user.uid, comment: reviewData.text });
      }
      setReviewText(''); // Clear the review input field
      setRating(0); // Reset the rating
    } catch (error) {
      console.error('Error submitting review:', error); // Log any errors during review submission
    }
  };

  // Function to delete a review from Firestore.
  const deleteReview = async (reviewId: string, userId: string) => {
    try {
      await deleteDoc(doc(db, 'cocktails', drinkId, 'reviews', reviewId));
      const allReviewsQuery = query(collection(db, 'allReviews'), where('userId', '==', userId), where('drinkId', '==', drinkId));
      const snapshot = await getDocs(allReviewsQuery);
      snapshot.forEach(docSnap => deleteDoc(doc(db, 'allReviews', docSnap.id))); // Delete associated entries from allReviews
    } catch (error) {
      console.error('Error deleting review:', error); // Log any errors during review deletion
    }
  };

  //Function to delete a reply from Firestore.
  const deleteReply = async (reviewId: string, replyId: string) => {
    try {
      await deleteDoc(doc(db, 'cocktails', drinkId, 'reviews', reviewId, 'replies', replyId));
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  // Function to render each review card, including replies and actions.
  const renderReviewCard = (item: Review) => (
    <View key={item.id} style={styles.reviewCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {userProfiles[item.uid]?.photoURL ? (
          <Image source={{ uri: userProfiles[item.uid]?.photoURL }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
        ) : (
          <Ionicons name="person-circle-outline" size={32} color="#aaa" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.reviewName}>{userProfiles[item.uid]?.username || item.username}</Text>
      </View>
      <Text style={styles.reviewRating}>Rating: {item.rating}/5</Text>
      <Text style={styles.reviewText}>{item.text}</Text>

      {auth.currentUser?.uid === item.uid && (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => { setReviewText(item.text); setRating(item.rating); setEditingReviewId(item.id!); }}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteReview(item.id!, item.uid)}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity testID={`toggle-replies-${item.id}`} onPress={() => setActiveThread(activeThread === item.id ? null : item.id!)}>
        <View style={styles.repliesContainer}>
          <Ionicons 
            name={activeThread === item.id ? 'chevron-up-outline' : 'chevron-down-outline'} 
            size={20} 
            color="#5c5c99" 
            style={styles.arrowIcon} 
          />
          <Text style={styles.repliesText}>
            {replies[item.id!]?.length || 0} {replies[item.id!]?.length === 1 ? 'Reply' : 'Replies'}
          </Text>
        </View>
      </TouchableOpacity>

      {activeThread === item.id && (
        <View style={{ marginTop: 10 }}>
          {replies[item.id!]?.map(reply => (
            <View key={reply.id ?? `${reply.uid}-${reply.text}`} style={styles.replyCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {userProfiles[reply.uid]?.photoURL ? (
                  <Image source={{ uri: userProfiles[reply.uid].photoURL }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                ) : (
                  <Ionicons name="person-circle-outline" size={28} color="#aaa" style={{ marginRight: 8 }} />
                )}
                <Text style={{ fontWeight: 'bold' }}>{userProfiles[reply.uid]?.username || reply.username}</Text>
              </View>
              <Text style={{ marginVertical: 4 }}>{reply.text}</Text>
              {auth.currentUser?.uid === reply.uid && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity 
                    testID="edit-reply-button" 
                    onPress={() => { setReplyText(reply.text); setReplyingTo(item.id!); setEditingReplyId(reply.id!); }}
                  >
                    <Text style={{ color: '#5c5c99', fontWeight: 'bold', marginRight: 16 }}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    testID="delete-reply-button" 
                    onPress={() => deleteReply(item.id!, reply.id!)}
                  >
                    <Text style={{ color: 'red', fontWeight: 'bold' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          <TextInput
            testID="reply-input"
            ref={inputRef}
            value={replyText}
            onChangeText={setReplyText}
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
            placeholder="Write a reply..."
            style={styles.input}
            multiline
          />
          <TouchableOpacity testID="submit-reply-button" onPress={() => submitReply(item.id!)} style={styles.submitButton}>
            <Text style={styles.submitText}>Submit Reply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const userReview = reviews.find(r => r.uid === currentUser?.uid);
  const otherReviews = reviews.filter(r => r.uid !== currentUser?.uid);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 50 }
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formWrapper}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={28} color="#f5c518" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={reviewText} onChangeText={setReviewText} placeholder="Write a review..." style={styles.input} multiline />
            <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
              <Text style={styles.submitText}>Submit Review</Text>
            </TouchableOpacity>
            {userReview && (
              <>
                <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>You posted:</Text>
                {renderReviewCard(userReview)}
              </>
            )}
            {otherReviews.length > 0 && (
              <>
                <Text style={{ fontWeight: 'bold', marginBottom: 6, marginTop: 12 }}>Others posted:</Text>
                {otherReviews.map(item => renderReviewCard(item))}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles for the ReviewsScreen component
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formWrapper: {
    paddingBottom: 20,
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
    backgroundColor: '#f5f5fc',
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
  replyCard: {
    backgroundColor: '#f5f5fc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    marginLeft: 20,
  },
  repliesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  arrowIcon: {
    marginRight: 8,
    alignSelf: 'center',
  },
  repliesText: {
    color: '#5c5c99',
  },
});
