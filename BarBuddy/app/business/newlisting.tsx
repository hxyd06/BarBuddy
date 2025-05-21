import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

//todo: clickable listings, filtering, admin verification, banner card on home screen?

export default function NewListingScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState('');
  const [imageURL, setImageURL] = useState('');

  const router = useRouter();

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Please log in to submit a listing.');
      return;
    }

    if (!name || !description || !location) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'businesses'), {
        name,
        description,
        location,
        phone,
        website,
        hours,
        category,
        imageURL,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        verified: false,
      });

      Alert.alert('Success', 'Your business listing was submitted.');
      router.back();
    } catch (error) {
      console.error('Error submitting listing:', error);
      Alert.alert('Submission Error', 'Could not save listing.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
              <Ionicons name="arrow-back" size={24} color="#5c5c99" />
            </TouchableOpacity>
            <Text style={styles.title}>New Business Listing</Text>
          </View>

          <TextInput
            placeholder="Business Name*"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Description*"
            style={styles.input}
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            placeholder="Location*"
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />
          <TextInput
            placeholder="Phone"
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            placeholder="Website"
            style={styles.input}
            keyboardType="url"
            value={website}
            onChangeText={setWebsite}
          />
          <TextInput
            placeholder="Opening Hours"
            style={styles.input}
            value={hours}
            onChangeText={setHours}
          />
          <TextInput
            placeholder="Category (e.g. bar, cafe)"
            style={styles.input}
            value={category}
            onChangeText={setCategory}
          />
          <TextInput
            placeholder="Image URL"
            style={styles.input}
            value={imageURL}
            onChangeText={setImageURL}
          />
          <Button title="Submit Listing" onPress={handleSubmit} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 50,
  },
  headerRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 40,
  },
  backIcon: {
    position: 'absolute',
    left: 0,
    padding: 4,
  },
  title: {
    fontSize: 24,
    color: '#5c5c99',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5fc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
});