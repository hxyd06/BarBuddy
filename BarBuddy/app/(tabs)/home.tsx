import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetchUsername();
  }, []);
  // Fetch username for welcome message
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

  return (
    <SafeAreaView style={styles.container}>
      {/* BarBuddy home screen header*/}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>BarBuddy</Text>
      </View>

      {/* Scroll content*/}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome message */}
        {username && (
          <Text style={styles.welcomeText}>Welcome, {username}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Stylesheet for Home Screen:
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
});
