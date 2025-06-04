import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

//Preferences screen
export default function PreferencesScreen() {
  const router = useRouter(); //Router navigation

  //Initialise preferences all false
  const [preferences, setPreferences] = useState({
    dairy: false,
    eggs: false,
    gluten: false,
    vegan: false,
    alcohol: false,
  });

  //Fetch user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const prefData = userData.preferences || {};
        setPreferences({
          dairy: !!prefData.dairy,
          eggs: !!prefData.eggs,
          gluten: !!prefData.gluten,
          vegan: !!prefData.vegan,
          alcohol: !!prefData.alcohol,
        });
      }
    };

    fetchPreferences();
  }, []);

  //Function to toggle preferences in database
  const togglePreference = async (key: keyof typeof preferences, value: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = doc(db, 'users', uid);
    try {
      await updateDoc(userRef, {
        [`preferences.${key}`]: value,
      });
      setPreferences(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error(`Failed to update preference "${key}":`, error);
      Alert.alert("Error", "Failed to update preferences.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="light-content" backgroundColor="#5c5c99" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Dietary Preferences</Text>
      </View>

        {/* Show list of preference options + toggles */}
      <ScrollView>
        {Object.entries(preferences).map(([key, value]) => (
          <View style={styles.card} key={key}>
            <Text style={styles.buttonText}>
              {key.charAt(0).toUpperCase() + key.slice(1)} Free
            </Text>
            <Switch
              style={styles.preferenceSwitch}
              value={value}
              onValueChange={(newValue) => togglePreference(key as keyof typeof preferences, newValue)}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

//Stylesheet
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
    margin: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  preferenceSwitch: {
    marginLeft: 'auto',
  },
});