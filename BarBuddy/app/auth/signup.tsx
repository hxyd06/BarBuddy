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

  const handleSignUp = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
  
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        createdAt: new Date(),
        savedRecipes: [],
        onHandIngredients: [], /* Added array for onhand ingredients */
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
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title="Sign Up" onPress={handleSignUp} />

      <TouchableOpacity onPress={() => router.push('/auth/login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20, 
        justifyContent: 'center', 
        backgroundColor: '#fff' 
    },
    title: { 
        fontSize: 32, 
        color: '#5c5c99', 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 30 
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
        fontWeight: '500' 
    },
});