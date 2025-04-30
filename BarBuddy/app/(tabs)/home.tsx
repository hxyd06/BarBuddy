import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState('');

  const fetchUserName = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.username && data.username.trim() !== '') {
        setDisplayName(data.username);
      } else {
        const emailName = user.email?.split('@')[0] || 'User';
        setDisplayName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserName();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {displayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5c5c99',
  },
});
