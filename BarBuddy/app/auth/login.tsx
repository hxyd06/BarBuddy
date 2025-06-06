import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { auth, db } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { StatusBar } from 'react-native';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle new account creation
  const signUp = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        createdAt: new Date(),
        savedRecipes: [],
        onHandIngredients: [],
        preferences: {},
      });
      Alert.alert('Account created!');
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
    }
  };

  // Handle user login
  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Wait for Firebase to confirm user is signed in
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsubscribe(); // Stop listening once authenticated
          router.replace('/(tabs)/home');
        }
      });
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    }
  };

  // Render login form
  return (
    <View style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Image
      source={require('../../assets/icons/BarBuddy-icon.png')}
      style={styles.icon}
      resizeMode="contain"
      />
      <Text style={styles.title}>BarBuddy</Text>
      <Text style={styles.subtitle}>Your pocket mixologist</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor='#888'
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor='#888'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title="Login" onPress={signIn} />

      <Text style={{ textAlign: 'center', marginVertical: 5 }}>or</Text>

      {/* Link to sign up page */}
      <TouchableOpacity onPress={() => router.push('/auth/signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles for login screen: 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
    icon: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 10,
    tintColor: '#5c5c99',
  },
  title: {
    fontSize: 40,
    color: '#5c5c99',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 0,
  },
  subtitle: { 
    color: '#5c5c99', 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f5f5fc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10
  },
  link: {
    color: '#5c5c99',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});
