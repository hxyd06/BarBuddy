import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'react-native';

interface BusinessListing {
  id: string;
  name: string;
  description: string;
  location: string;
  phone: string;
  website: string;
  hours: string;
  imageURL: string;
  createdAt: string;
  ownerId: string;
}

export default function YourListingsScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserListings();
  }, []);

  const fetchUserListings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to view your listings.");
        router.back();
        return;
      }

      const q = query(
        collection(db, "businesses"),
        where("ownerId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const userListings: BusinessListing[] = [];

      querySnapshot.forEach((doc) => {
        userListings.push({
          id: doc.id,
          ...doc.data(),
        } as BusinessListing);
      });

      setListings(userListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      Alert.alert("Error", "Could not load your listings.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditListing = (listingId: string) => {
    router.push(`/business/edit?id=${listingId}`);
  };

  const handleDeleteListing = (listingId: string, listingName: string) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${listingName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteListing(listingId),
        },
      ]
    );
  };

  const deleteListing = async (listingId: string) => {
    try {
      await deleteDoc(doc(db, "businesses", listingId));
      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
      Alert.alert("Success", "Listing deleted successfully.");
    } catch (error) {
      console.error("Error deleting listing:", error);
      Alert.alert("Error", "Could not delete listing.");
    }
  };

  const renderListingItem = ({ item }: { item: BusinessListing }) => (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        {item.imageURL ? (
          <Image source={{ uri: item.imageURL }} style={styles.listingImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="storefront" size={40} color="#ccc" />
          </View>
        )}

        <View style={styles.listingInfo}>
          <Text style={styles.listingName}>{item.name}</Text>
          <Text style={styles.listingLocation}>{item.location}</Text>
          <Text style={styles.listingDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditListing(item.id)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteListing(item.id, item.name)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar visible */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#5c5c99" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Listings</Text>
        <TouchableOpacity
          onPress={() => router.push("/business/newlisting")}
          style={styles.addIcon}
        >
          <Ionicons name="add" size={24} color="#5c5c99" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5c5c99" />
          <Text style={styles.loadingText}>Loading your listings...</Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Listings Yet</Text>
          <Text style={styles.emptyDescription}>
            You haven't created any business listings yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backIcon: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5c5c99",
    flex: 1,
    textAlign: "center",
  },
  addIcon: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5c5c99",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  listContainer: {
    padding: 20,
  },
  listingCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listingHeader: {
    flexDirection: "row",
    marginBottom: 15,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  listingInfo: {
    flex: 1,
    justifyContent: "center",
  },
  listingName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  listingLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 14,
    color: "#888",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
    gap: 5,
  },
  editButton: {
    backgroundColor: "#5c5c99",
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
