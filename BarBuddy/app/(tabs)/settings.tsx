import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

// Profile & settings screen for user
export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [email, setEmail] = useState('');
  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();

  // Toggle dark mode (not active in UI)
  const toggleSwitch = () => setIsDarkMode(prev => !prev);

  // Load user data from Firestore on mount
  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setEmail(user.email || '');

      const docRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUsername(data.username || '');
        setUsernameInput('');
        setProfileImage(data.photoURL || null);
      }
    };

    loadUserData();
  }, []);

  // Save updated username to Firestore
  const saveUsername = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { username: usernameInput }, { merge: true });
      setUsername(usernameInput);
      setShowUsernameEditor(false);
      setUsernameInput('');
      Alert.alert('Success', 'Username saved!');
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('Error', 'Could not save username.');
    }
  };

  // Pick and upload profile image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const image = result.assets[0];
      const user = auth.currentUser;
      if (!user) return;

      const response = await fetch(image.uri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setProfileImage(downloadURL);
      await setDoc(doc(db, 'users', user.uid), { photoURL: downloadURL }, { merge: true });
    }
  };

  // Handle logout and redirect to login screen
  const handleLogout = async () => {
    try {
      console.log('User before logout:', auth.currentUser);
      await signOut(auth);
      console.log('User after logout:', auth.currentUser);
      setTimeout(() => {
        router.replace('../auth/login');
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Render screen content
  return (
    <View style={styles.container}>
      {/* Profile Image, Username, and Email */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageWrapper}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../../assets/images/default-avatar.png')}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.nameText}>{username || 'User'}</Text>
        <Text style={styles.emailText}>{email}</Text>

        {/* Username Editor */}
        {!showUsernameEditor ? (
          <TouchableOpacity onPress={() => {
            setUsernameInput('');
            setShowUsernameEditor(true);
          }}>
            <Text style={styles.changeUsernameText}>Change Username</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.usernameEditor}>
            <TextInput
              style={styles.usernameInput}
              placeholder="Enter username"
              placeholderTextColor="#aaa"
              value={usernameInput}
              onChangeText={setUsernameInput}
            />
            <View style={styles.usernameButtons}>
              <TouchableOpacity onPress={saveUsername} style={styles.saveButton}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setUsernameInput('');
                  setShowUsernameEditor(false);
                }}
                style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Settings Navigation Buttons */}
      <View style={styles.listSection}>
        <TouchableOpacity style={styles.listItem} onPress={() => router.push('/settings/onhand')}>
          <Ionicons name="list" size={28} color="#5c5c99" style={styles.listIcon} />
          <Text style={styles.listLabel}>On-Hand Ingredients</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem} onPress={() => router.push('/settings/saved')}>
          <Ionicons name="bookmark" size={28} color="#5c5c99" style={styles.listIcon} />
          <Text style={styles.listLabel}>Saved Drinks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem} onPress={() => router.push('/settings/reviews')}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#5c5c99" style={styles.listIcon} />
          <Text style={styles.listLabel}>View Your Reviews</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem} onPress={() => router.push('/settings/preferences')}>
          <Ionicons name="person-circle" size={28} color="#5c5c99" style={styles.listIcon}/>
          <Text style={styles.listLabel}>Edit Preferences</Text>
        </TouchableOpacity>

        {/* Optional: Dark mode toggle (commented out) */}
        {/*
        <TouchableOpacity style={styles.listItem} onPress={toggleSwitch}>
          <Ionicons
            name={isDarkMode ? 'moon' : 'sunny'}
            size={28}
            color="#5c5c99"
            style={styles.listIcon}
          />
          <Text style={styles.listLabel}>
            {isDarkMode ? 'Turn off dark mode' : 'Turn on dark mode'}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleSwitch}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
        */}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

//Style for settings/profile screen: 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  profileImageWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: '#ccc',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    backgroundColor: '#5c5c99',
    padding: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  profileRight: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    color: '#5c5c99',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emailText: {
    color: '#5c5c99',
    fontSize: 16,
    marginBottom: 10,
  },
  changeUsernameText: {
    color: '#5c5c99',
    textDecorationLine: 'underline',
  },
  usernameEditor: {
    marginTop: 6,
  },
  usernameInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#5c5c99',
  },
  usernameButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#5c5c99',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  squareButton: {
    width: 150,
    height: 150,
    backgroundColor: '#61dafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSection: {
    marginTop: 30,
    width: '100%',
    paddingHorizontal: 20,
    gap: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5fc',
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
    height: 56,
  },
  listIcon: {
    marginRight: 16,
  },
  listLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  themeSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  themeText: {
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});