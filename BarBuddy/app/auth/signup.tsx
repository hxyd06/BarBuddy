import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { auth, db } from '@/firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'react-native';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [role, setRole] = useState<'user' | 'business'>('user');

  // Handle signup form submission
  const handleSignUp = async () => {
    let hasError = false;
    setEmailError('');
    setPasswordError('');

    // Basic validation
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

    // Create Firebase user and save to Firestore
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        role,
        createdAt: new Date(),
        savedRecipes: [],
        onHandIngredients: [],
        preferences: {},
      });
      Alert.alert('Account created!', 'You are now logged in.');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
    }
  };

  // Render signup form
  return (
    <View style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.centerBlock}>
        {/* Header */}
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.text}>Please enter a valid email and a password with at least 6 characters.</Text>

        {/* Email Input */}
        <TextInput
          placeholder="Email"
          placeholderTextColor='#888'
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />
        {emailError !== '' && <Text style={styles.errorText}>{emailError}</Text>}

        {/* Password Input */}
        <TextInput
          placeholder="Password"
          placeholderTextColor='#888'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {passwordError !== '' && <Text style={styles.errorText}>{passwordError}</Text>}

        {/* Role Selection */}
        <TouchableOpacity onPress={() => setRole(role === 'user' ? 'business' : 'user')}>
          <Text style={styles.toggleText}>
            Signing up as a <Text style={styles.roleText}>{role}</Text>{'\n'} 
          </Text>

        </TouchableOpacity>
        <Text style={styles.tapText}>(tap to switch)</Text>

        {/* Submit Button */}
        <Button title="Sign Up" onPress={handleSignUp} />

        {/* Link to login screen */}
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles for signup screen:
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
  roleText: {
    color: '#292966',
    
  },
  toggleText: {
    color: '#5c5c99',
    marginBottom: -7,
    fontWeight: '500',
    textAlign: 'center',
  },
  tapText: {
    fontSize: 12,
    color: '#A3A3CC',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 0,
  }
});
