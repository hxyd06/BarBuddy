import React, { useState } from 'react';
import { Text, View, StyleSheet, Image, Button, TouchableOpacity, Switch } from 'react-native';

export default function SettingsScreen() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleSwitch = () => setIsDarkMode(previousState => !previousState);
  return (
    <View style={styles.container}>
    <Image source={require('../../assets/images/react-logo.png')} style={styles.profileImage} />
    <Text style={styles.nameText}>User Name</Text>
    <Text style={styles.emailText}>useremail@gmail.com</Text>
    <Button title="Edit Profile" onPress={() => alert('Test')} />
    <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.squareButton} onPress={() => alert('test')}>
        <Text style={styles.buttonText}>Favourites List</Text>
      </TouchableOpacity>
    <TouchableOpacity style={styles.squareButton} onPress={() => alert('test')}>
        <Text style={styles.buttonText}>On-Hand Ingredients</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.themeSwitchContainer}>
        <Text style={[styles.themeText, { color: isDarkMode ? '#000' : '#fff' }]}>(not working yet) Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleSwitch}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#25292e',
    },
  nameText: {
    color: '#fff',
    fontSize: 30,
  },
  emailText: {
    color: '#fff',
    fontSize: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 20,
  },
  themeSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 30,
  },
  themeText: {
    fontSize: 18,
    marginRight: 10,
    justifyContent: 'flex-start',
  },
});
