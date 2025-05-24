import React, { useEffect, useState } from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,ActivityIndicator,Image,} from 'react-native';
import { collection, getDocs, doc, getDoc, orderBy, query } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


export default function Listings() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const router = useRouter();

  useEffect(() => {
    fetchListings(sortOrder);
    checkRole();
  }, [sortOrder]);

  const fetchListings = async (order: 'newest' | 'oldest') => {
    setLoading(true);
    try {
      const businessQuery = query(
        collection(db, 'businesses'),
        orderBy('createdAt', order === 'newest' ? 'desc' : 'asc')
      );
      const snapshot = await getDocs(businessQuery);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBusinesses(data);
    } catch (error) {
      console.error('Error fetching business listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRole = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const role = userDoc.data()?.role;
    if (role === 'business') {
      setIsBusiness(true);
    }
  };

  const handleNewListing = () => {
    router.push('/business/newlisting');
  };

  const renderListing = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.imageURL ? (
        <Image source={{ uri: item.imageURL }} style={styles.businessImage} />
      ) : null}
      <Text style={styles.name}>{item.name}</Text>
      {item.location && <Text style={styles.location}>{item.location}</Text>}
      {item.hours && <Text style={styles.hours}>{item.hours}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#5c5c99" />
        </TouchableOpacity>
        <Text style={styles.title}>Business Listings</Text>
        {isBusiness && (
          <TouchableOpacity onPress={handleNewListing} style={styles.plusIcon}>
            <Ionicons name="add-circle" size={28} color="#5c5c99" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sortRow}>
        <Text style={styles.sortByText}>Sort by:</Text>
        <TouchableOpacity style={[styles.sortButton, sortOrder === 'newest' && styles.enabled]} onPress={() => setSortOrder('newest')}>
          <Text style={[styles.sortText, sortOrder === 'newest' && styles.enabledText]}>Newest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sortButton, sortOrder === 'oldest' && styles.enabled]} onPress={() => setSortOrder('oldest')}>
          <Text style={[styles.sortText, sortOrder === 'oldest' && styles.enabledText]}>Oldest</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#5c5c99" />
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => item.id}
          renderItem={renderListing}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  headerRow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    height: 40,
  },
  backIcon: {
    position: 'absolute',
    left: 0,
  },
  plusIcon: {
    position: 'absolute',
    right: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5c5c99',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f5f5fc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  businessImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  hours: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  sortButton: {
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5c5c99',
    backgroundColor: '#fff',
  },
  enabled: {
    backgroundColor: '#5c5c99',
  },
  enabledText: {
    color: '#fff',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortByText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5c5c99',
    marginRight: 8,
  },
  sortText: {
    color: '#5c5c99',
    fontWeight: '500',
  },
});