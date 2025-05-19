import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [drinks] = useState<any[]>([]);
  const router = useRouter();

  const handleRandomDrink = () => {
    if (drinks.length === 0) return;

    const randomIndex = Math.floor(Math.random() * drinks.length);
    const randomDrink = drinks[randomIndex];

    router.push(`/drink/${encodeURIComponent(randomDrink.name)}`);
    console.log(randomDrink.name);
  };

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>BarBuddy</Text>
          </View>
          <TouchableOpacity style={styles.randomButton} onPress={handleRandomDrink}>
            <Text style={styles.randomButtonText}>Surprise Me</Text>
          </TouchableOpacity>
          <View style={styles.quickAccess}>
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => router.push('/settings/saved')}>
              <Text style={styles.quickAccessText}>Saved Drinks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => router.push('/settings/onhand')}>
              <Text style={styles.quickAccessText}>On-Hand Ingredients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => router.push('/explore/trending')}>
              <Text style={styles.quickAccessText}>Trending</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  randomButton: {
    backgroundColor: '#5c5c99',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  randomButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5c5c9a',
    marginBottom: 10,
    textAlign: 'center',
  },
  quickAccess: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickAccessCard: {
    backgroundColor: '#f5f5fc',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  quickAccessText: {
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5c5c9a',
    textAlign: 'center',
    marginBottom: 4,
  },
});
