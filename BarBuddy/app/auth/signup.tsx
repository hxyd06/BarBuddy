import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { auth, db } from '@/firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSignUp = async () => {
    let hasError = false;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) return;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        createdAt: new Date(),
        savedRecipes: [],
        preferences: {},
      });
      Alert.alert('Account created!', 'You are now logged in.');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerBlock}>
        {/* Top text */}
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.text}>Please enter a valid email and a password with at least 6 characters.</Text>

        {/* Inputs */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />
        {emailError !== '' && <Text style={styles.errorText}>{emailError}</Text>}

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {passwordError !== '' && <Text style={styles.errorText}>{passwordError}</Text>}

        {/* Buttons */}
        <Button title="Sign Up" onPress={handleSignUp} />

        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBlock: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: { 
    fontSize: 32, 
    color: '#5c5c99', 
    fontWeight: 'bold', 
    textAlign: 'center',
    marginBottom: 10,
  },
  text: { 
    color: '#5c5c99', 
    fontWeight: 'normal', 
    textAlign: 'center', 
    marginBottom: 20,
  },
  input: { 
    backgroundColor: '#f5f5fc', 
    padding: 12, 
    marginBottom: 10, 
    borderRadius: 10, 
    width: '100%',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  link: { 
    color: '#5c5c99', 
    marginTop: 15, 
    textAlign: 'center', 
    fontWeight: '500' 
  },
});
