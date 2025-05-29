import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function BusinessDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchBusiness = async () => {
      try {
        const docRef = doc(db, "businesses", id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setBusiness(snap.data());
          fetchPromotions(id as string);
        } else {
          setBusiness(null);
        }
      } catch (err) {
        console.error("Error fetching business:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  const fetchPromotions = async (businessId: string) => {
    try {
      const promoQuery = query(
        collection(db, "promotions"),
        where("businessId", "==", businessId)
      );
      const promoSnap = await getDocs(promoQuery);
      const promoList = promoSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPromotions(promoList);
    } catch (err) {
      console.error("Error fetching promotions for business:", err);
    }
  };

  const handleWebsitePress = (website: string) => {
    let url = website;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.center}>
        <Text>Business not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <View>
          {business.imageURL ? (
            <Image
              source={{ uri: business.imageURL }}
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
            <Text style={styles.titleText}>{business.name}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {business.description && (
            <Text style={styles.descriptionText}>{business.description}</Text>
          )}

          <Text style={styles.heading}>Contact Us</Text>

          {business.hours && (
            <View style={styles.contactItem}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#5c5c99"
                style={styles.contactIcon}
              />
              <Text style={styles.text}>{business.hours}</Text>
            </View>
          )}

          {business.location && (
            <View style={styles.contactItem}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#5c5c99"
                style={styles.contactIcon}
              />
              <Text style={styles.text}>{business.location}</Text>
            </View>
          )}

          {business.phone && (
            <View style={styles.contactItem}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#5c5c99"
                style={styles.contactIcon}
              />
              <Text style={styles.text}>{business.phone}</Text>
            </View>
          )}

          {business.website && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleWebsitePress(business.website)}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color="#5c5c99"
                style={styles.contactIcon}
              />
              <Text style={[styles.text, styles.linkText]}>
                {business.website}
              </Text>
            </TouchableOpacity>
          )}
          {promotions.length > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text style={styles.heading}>Current Promotions</Text>
              {promotions.map((promo) => (
                <TouchableOpacity
                  key={promo.id}
                  style={styles.promotionCard}
                  onPress={() =>
                    router.push({
                      pathname: "/business/promotion/[id]",
                      params: { id: promo.id },
                    })
                  }
                >
                  <View style={styles.promotionImageContainer}>
                    {promo.imageURL ? (
                      <Image
                        source={{ uri: promo.imageURL }}
                        style={styles.promotionImage}
                      />
                    ) : (
                      <Ionicons
                        name="pricetag"
                        size={28}
                        color="#999"
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promotionTitle}>{promo.title}</Text>
                    <Text style={styles.promotionDesc}>{promo.description}</Text>
                    {promo.startDate && promo.endDate && (
                      <Text style={styles.promotionDates}>
                        {new Date(
                          promo.startDate.seconds * 1000
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          promo.endDate.seconds * 1000
                        ).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// copied styling from drink/index.tsx
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
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  contactIcon: {
    marginRight: 12,
    width: 20,
  },
  text: {
    fontSize: 16,
    flex: 1,
  },
  linkText: {
    color: "#5c5c99",
    textDecorationLine: "underline",
  },
  descriptionText: {
    fontStyle: "italic",
    fontSize: 16,
    marginBottom: 16,
  },
   promotionCard: {
    flexDirection: "row",
    backgroundColor: "#f5f5fc",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  promotionImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  promotionImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  promotionDesc: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  promotionDates: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});