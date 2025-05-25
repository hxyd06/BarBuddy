import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, Platform, KeyboardAvoidingView, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface EditableFormData {
  name: string;
  description: string;
  location: string;
  phone: string;
  website: string;
  hours: string;
}

export default function EditListingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState("");
  const [originalImageURL, setOriginalImageURL] = useState("");
  const [formData, setFormData] = useState<EditableFormData>({
    name: "",
    description: "",
    location: "",
    phone: "",
    website: "",
    hours: "",
  });

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "businesses", String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || "",
            description: data.description || "",
            location: data.location || "",
            phone: data.phone || "",
            website: data.website || "",
            hours: data.hours || "",
          });
          setImageUri(data.imageURL || "");
          setOriginalImageURL(data.imageURL || "");
        } else {
          Alert.alert("Error", "Listing not found.");
          router.back();
        }
      } catch (error) {
        console.error("Error loading listing:", error);
        Alert.alert("Error", "Could not load listing.");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Enable media access in settings.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `businessImages/${id}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Upload Error", "Could not upload image.");
      return "";
    }
  };

  const handleUpdate = async () => {
    if (!id || !formData.name.trim()) return;
    try {
      let updatedImageURL = originalImageURL;
      if (imageUri && imageUri !== originalImageURL) {
        updatedImageURL = await uploadImage(imageUri);
      }

      const docRef = doc(db, "businesses", String(id));
      await updateDoc(docRef, { ...formData, imageURL: updatedImageURL });

      Alert.alert("Success", "Listing updated successfully.");
      router.back();
    } catch (error) {
      console.error("Error updating listing:", error);
      Alert.alert("Error", "Could not update listing.");
    }
  };

  const editableFields = ["name", "description", "location", "phone", "website", "hours"] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 50}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backIcon}
            >
              <Ionicons name="arrow-back" size={24} color="#5c5c99" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Listing</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#5c5c99" />
          ) : (
            <>
              {editableFields.map((key) => (
                <View key={key} style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <TextInput
                    placeholder={`Enter ${key}`}
                    style={styles.input}
                    value={formData[key]}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, [key]: text }))
                    }
                  />
                </View>
              ))}

              <View style={styles.imageSection}>
                <Text style={styles.imageLabel}>Business Photo</Text>
                {imageUri ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    <TouchableOpacity
                      onPress={pickImage}
                      style={styles.changeImageButton}
                    >
                      <Ionicons name="image" size={20} color="#5c5c99" />
                      <Text style={styles.changeImageText}>Change Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={styles.imagePlaceholder}
                  >
                    <Ionicons name="image" size={40} color="#5c5c99" />
                    <Text style={styles.imagePlaceholderText}>
                      Add Business Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={handleUpdate}
                style={styles.submitButton}
              >
                <Text style={styles.submitText}>Update Listing</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5c5c99",
  },
  fieldContainer: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5c5c99',
    marginBottom: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#5c5c99",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageSection: {
    marginBottom: 15,
    marginTop: 10,
  },
  imageLabel: {
    fontSize: 16,
    color: "#5c5c99",
    marginBottom: 8,
    fontWeight: "600",
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePlaceholder: {
    backgroundColor: "#f5f5fc",
    borderRadius: 8,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    marginBottom: 10,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: "#5c5c99",
    marginTop: 8,
    fontWeight: "500",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  changeImageText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#5c5c99",
    fontWeight: "500",
  },
});