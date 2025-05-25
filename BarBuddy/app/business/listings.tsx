import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { collection, getDocs, doc, getDoc, deleteDoc, orderBy, query } from "firebase/firestore";
import { db, auth } from "@/firebase/firebaseConfig";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Listings() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [userRole, setUserRole] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    fetchListings(sortOrder);
    fetchUserRole();
  }, [sortOrder]);

  const fetchUserRole = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role || "");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchListings = async (order: "newest" | "oldest") => {
    setLoading(true);
    try {
      const businessQuery = query(
        collection(db, "businesses"),
        orderBy("createdAt", order === "newest" ? "desc" : "asc")
      );
      const snapshot = await getDocs(businessQuery);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBusinesses(data);
    } catch (error) {
      console.error("Error fetching business listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this listing?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "businesses", listingId));
              setBusinesses((prev) =>
                prev.filter((item) => item.id !== listingId)
              );
            } catch (error) {
              console.error("Error deleting listing:", error);
            }
          },
        },
      ]
    );
  };

  const renderListing = ({ item }: { item: any }) => {
    const isOwner = auth.currentUser?.uid === item.ownerId;
    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/business/[id]", params: { id: item.id } })
          }
        >
          {item.imageURL ? (
            <Image
              source={{ uri: item.imageURL }}
              style={styles.businessImage}
            />
          ) : null}
          <Text style={styles.name}>{item.name}</Text>
          {item.location && (
            <Text style={styles.listingSubText}>{item.location}</Text>
          )}
          {item.hours && (
            <Text style={styles.listingSubText}>{item.hours}</Text>
          )}
        </TouchableOpacity>
        {isOwner && (
          <View style={styles.managementButtons}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/business/edit",
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={24} color="#5c5c99" />
        </TouchableOpacity>
        <Text style={styles.title}>Business Listings</Text>
        {userRole === "business" && (
          <TouchableOpacity
            onPress={() => router.push("/business/newlisting")}
            style={styles.plusIcon}
          >
            <Ionicons name="add" size={28} color="#5c5c99" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortByText}>Sort by:</Text>
        <TouchableOpacity
          onPress={() => setSortOrder("newest")}
          style={styles.sortButton}
        >
          <Text
            style={
              sortOrder === "newest" ? styles.enabledText : styles.sortText
            }
          >
            Newest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortOrder("oldest")}
          style={styles.sortButton}
        >
          <Text
            style={
              sortOrder === "oldest" ? styles.enabledText : styles.sortText
            }
          >
            Oldest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5c5c99" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={businesses}
        keyExtractor={(item) => item.id}
        renderItem={renderListing}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 20,
  },
  headerRow: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    height: 40,
  },
  backIcon: {
    position: "absolute",
    left: 0,
  },
  plusIcon: {
    position: "absolute",
    right: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5c5c99",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f5f5fc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  businessImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  listingSubText: {
    fontSize: 14,
    color: "#555",
  },
  managementButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  editButton: {
    color: "#5c5c99",
    fontWeight: "bold",
    marginRight: 16,
  },
  deleteButton: {
    color: "red",
    fontWeight: "bold",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sortByText: {
    marginRight: 10,
    fontWeight: "500",
    color: "#5c5c99",
  },
  sortButton: {
    marginRight: 10,
  },
  sortText: {
    color: "#5c5c99",
  },
  enabledText: {
    color: "#000",
    fontWeight: "bold",
  },
});