import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function PromotionDetail() {
  const { id } = useLocalSearchParams();
  const promoId = id as string;
  const router = useRouter();

  const [promotion, setPromotion] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promoDoc = await getDoc(doc(db, "promotions", promoId));
        if (promoDoc.exists()) {
          const promoData = promoDoc.data();
          setPromotion(promoData);

          if (promoData.businessId) {
            const bizDoc = await getDoc(
              doc(db, "businesses", promoData.businessId)
            );
            if (bizDoc.exists()) {
              setBusiness(bizDoc.data());
            }
          }
        }
      } catch (error) {
        console.error("Error fetching promotion or business:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [promoId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!promotion) {
    return (
      <View style={styles.center}>
        <Text>Promotion not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <View>
          {promotion.imageURL ? (
            <Image
              source={{ uri: promotion.imageURL }}
              style={styles.headerImage}
            />
          ) : (
            <View style={[styles.headerImage, { backgroundColor: "#ddd" }]} />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradientOverlay}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{promotion.title}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {promotion.description && (
            <Text style={styles.descriptionText}>{promotion.description}</Text>
          )}

          {promotion.startDate && promotion.endDate && (
            <Text style={styles.dateText}>
              {new Date(
                promotion.startDate.seconds * 1000
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(promotion.endDate.seconds * 1000).toLocaleDateString()}
            </Text>
          )}

          <Text style={styles.sectionHeader}>Find us here</Text>

          {business ? (
            <TouchableOpacity
              style={styles.businessCard}
              onPress={() =>
                router.push({
                  pathname: "/business/[id]",
                  params: { id: promotion.businessId },
                })
              }
            >
              <View style={styles.businessRow}>
                <Ionicons
                  name="storefront"
                  size={22}
                  color="#5c5c99"
                  style={styles.storefrontIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.businessLabel}>{business.name}</Text>
                  {business.location && (
                    <Text style={styles.businessLocation}>
                      {business.location}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5c5c99" />
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.businessLabel}>Business not found.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 30,
    zIndex: 10,
  },
  headerImage: {
    width: "100%",
    height: 350,
    resizeMode: "cover",
  },
  gradientOverlay: {
    position: "absolute",
    width: "100%",
    height: 350,
  },
  titleContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  descriptionText: {
    fontStyle: "italic",
    fontSize: 16,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#5c5c99",
  },
  businessCard: {
    backgroundColor: "#f5f5fc",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  businessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  businessLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5c5c99",
  },
  businessLocation: {
    fontSize: 14,
    color: "#555",
  },
  storefrontIcon: {
    marginRight: 12,
  },
});
