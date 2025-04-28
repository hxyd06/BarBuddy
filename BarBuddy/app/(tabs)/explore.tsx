import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function ExploreScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
        <Text style={styles.header}>Explore Categories</Text>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => router.push(`/explore/${item.id}`)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.categoryImage} />
              ) : (
                <View style={styles.placeholderBox} />
              )}
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryCard: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 5,
  },
  placeholderBox: {
    width: '100%',
    height: 120,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginBottom: 5,
  },
  categoryText: {
    fontWeight: '500',
    textAlign: 'center',
  },
});
