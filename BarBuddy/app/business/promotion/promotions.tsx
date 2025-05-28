import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { collection, getDocs, doc, getDoc, deleteDoc, orderBy, query, where, Timestamp } from "firebase/firestore";
import { db, auth } from "@/firebase/firebaseConfig";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PromotionsScreen() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
    fetchUserRole();
    fetchPromotions();
  }, []);

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

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const now = Timestamp.now();
      const promoQuery = query(
        collection(db, "promotions"),
        where("startDate", "<=", now),
        where("endDate", ">=", now),
        orderBy("startDate", "desc")
      );
      const promoSnap = await getDocs(promoQuery);

      const promosWithBusiness = await Promise.all(
        promoSnap.docs.map(async (promoDoc) => {
          const promoData = promoDoc.data();
          let businessData = null;

          if (
            promoData.businessId &&
            typeof promoData.businessId === "string"
          ) {
            try {
              const businessRef = doc(db, "businesses", promoData.businessId);
              const businessDoc = await getDoc(businessRef);
              if (businessDoc.exists()) {
                businessData = businessDoc.data();
              }
            } catch (err) {
              console.warn(
                "Could not load business for promo:",
                promoDoc.id,
                err
              );
            }
          }

          return {
            id: promoDoc.id,
            ...promoData,
            business: businessData,
          };
        })
      );

      setPromotions(promosWithBusiness);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = (promoId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this promotion?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "promotions", promoId));
              setPromotions((prev) =>
                prev.filter((item) => item.id !== promoId)
              );
            } catch (error) {
              console.error("Error deleting promotion:", error);
            }
          },
        },
      ]
    );
  };

  const renderPromotion = ({ item }: { item: any }) => {
    const isOwner = currentUserId && item.ownerId === currentUserId;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/business/promotion/[id]",
              params: { id: item.id },
            })
          }
          disabled={!item.businessId}
        >
          {item.imageURL && (
            <Image
              source={{ uri: item.imageURL }}
              style={styles.businessImage}
            />
          )}
          <Text style={styles.name}>{item.title}</Text>
          <Text style={styles.subText}>{item.description}</Text>
          {item.business?.name && (
            <Text style={styles.subText}>From: {item.business.name}</Text>
          )}
          {item.business?.location && (
            <Text style={styles.subText}>{item.business.location}</Text>
          )}
        </TouchableOpacity>

        {isOwner && (
          <View style={styles.managementButtons}>
            <TouchableOpacity
              testID="editButton"
              onPress={() =>
                router.push({
                  pathname: "/business/promotion/editpromotions",
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="deleteButton"
              onPress={() => handleDeletePromotion(item.id)}
            >
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          testID="backButton"
          onPress={() => router.back()}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={24} color="#5c5c99" />
        </TouchableOpacity>

        <Text style={styles.title}>Promotions</Text>

        {userRole === "business" && (
          <TouchableOpacity
            testID="addButton"
            onPress={() => router.push("/business/promotion/newpromotion")}
            style={styles.addButton}
          >
            <Ionicons name="add-outline" size={24} color="#5c5c99" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#5c5c99"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={promotions}
          keyExtractor={(item) => item.id}
          renderItem={renderPromotion}
          contentContainerStyle={styles.listContent}
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
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 20,
    height: 60,
  },
  backIcon: {
    position: "absolute",
    left: 20,
  },
  addButton: {
    position: "absolute",
    right: 20,
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
  subText: {
    fontSize: 14,
    color: "#555",
  },
  listContent: {
    padding: 20,
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
});
