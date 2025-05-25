import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function BusinessDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchBusiness = async () => {
      try {
        const docRef = doc(db, "businesses", id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setBusiness(snap.data());
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
});
