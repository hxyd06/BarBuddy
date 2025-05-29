import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  imageURL: string;
  ownerId: string;
}

export default function YourPromotionsScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPromotions();
  }, []);

  const fetchUserPromotions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to view your promotions.");
        router.back();
        return;
      }

      const q = query(
        collection(db, "promotions"),
        where("ownerId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const userPromotions: Promotion[] = [];

      querySnapshot.forEach((docSnap) => {
        userPromotions.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Promotion);
      });

      setPromotions(userPromotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      Alert.alert("Error", "Could not load your promotions.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPromotion = (promoId: string) => {
    router.push(`/business/promotion/editpromotions?id=${promoId}`);
  };

  const handleDeletePromotion = (promoId: string, title: string) => {
    Alert.alert(
      "Delete Promotion",
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletePromotion(promoId),
        },
      ]
    );
  };

  const deletePromotion = async (promoId: string) => {
    try {
      await deleteDoc(doc(db, "promotions", promoId));
      setPromotions((prev) => prev.filter((promo) => promo.id !== promoId));
      Alert.alert("Success", "Promotion deleted successfully.");
    } catch (error) {
      console.error("Error deleting promotion:", error);
      Alert.alert("Error", "Could not delete promotion.");
    }
  };

  const formatDate = (timestamp: any) =>
    timestamp?.seconds ? new Date(timestamp.seconds * 1000).toLocaleDateString() : "N/A";

  const renderPromotionItem = ({ item }: { item: Promotion }) => (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        {item.imageURL ? (
          <Image source={{ uri: item.imageURL }} style={styles.listingImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="pricetag" size={40} color="#ccc" />
          </View>
        )}

        <View style={styles.listingInfo}>
          <Text style={styles.listingName}>{item.title}</Text>
          <Text style={styles.listingDescription} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.listingLocation}>From: {formatDate(item.startDate)} To: {formatDate(item.endDate)}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditPromotion(item.id)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePromotion(item.id, item.title)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#5c5c99" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Promotions</Text>
        <TouchableOpacity
          onPress={() => router.push("/business/promotion/newpromotion")}
          style={styles.addIcon}
        >
          <Ionicons name="add" size={24} color="#5c5c99" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5c5c99" />
          <Text style={styles.loadingText}>Loading your promotions...</Text>
        </View>
      ) : promotions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Promotions Yet</Text>
          <Text style={styles.emptyDescription}>
            You haven't created any promotions yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={promotions}
          renderItem={renderPromotionItem}
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
