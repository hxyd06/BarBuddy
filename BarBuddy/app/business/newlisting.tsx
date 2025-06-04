import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from 'react-native';

export default function NewListingScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Please log in to submit a listing.");
      return;
    }

    if (!name || !description || !location) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setIsUploading(true);

    try {
      let imageURL = "";
      const docRef = await addDoc(collection(db, "businesses"), {
        name,
        description,
        location,
        phone,
        website,
        hours,
        imageURL: "",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      if (imageUri) {
        imageURL = await uploadImage(imageUri, docRef.id);

        await updateDoc(docRef, { imageURL: imageURL });
      }

      Alert.alert("Success", "Your business listing was submitted.");
      router.back();
    } catch (error) {
      console.error("Error submitting listing:", error);
      Alert.alert("Submission Error", "Could not save listing.");
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Please enable camera roll access in settings!");
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

  const uploadImage = async (uri: string, documentId: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const filename = `businessImages/${documentId}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(
        "Image Upload Error",
        "Could not upload image. Please try again."
      );
      return "";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>

        {/* Status bar visible */}
	      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backIcon}
            >
              <Ionicons name="arrow-back" size={24} color="#5c5c99" />
            </TouchableOpacity>
            <Text style={styles.title}>New Business Listing</Text>
          </View>

          <TextInput
            placeholder="Business Name*"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Description*"
            style={styles.input}
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            placeholder="Location*"
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />
          <TextInput
            placeholder="Phone"
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            placeholder="Website"
            style={styles.input}
            keyboardType="url"
            value={website}
            onChangeText={setWebsite}
          />
          <TextInput
            placeholder="Opening Hours"
            style={styles.input}
            value={hours}
            onChangeText={setHours}
          />

          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>Business Photo</Text>

            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.selectedImage}
                />
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={styles.changeImageButton}
                  >
                    <Ionicons name="image" size={20} color="#5c5c99" />
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setImageUri("")}
                    style={styles.removeImageButton}
                  >
                    <Ionicons name="trash" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
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
                <Text style={styles.imagePlaceholderSubtext}>
                  Tap to select from photo library
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isUploading}
            style={[styles.submitButton, isUploading && { opacity: 0.6 }]}
          >
            <Text style={styles.submitText}>
              {isUploading ? "Uploading..." : "Submit Listing"}
            </Text>
          </TouchableOpacity>

          {isUploading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5c5c99" />
              <Text style={styles.loadingText}>
                {imageUri
                  ? "Uploading image and saving listing..."
                  : "Saving listing..."}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    paddingBottom: 50,
  },
  headerRow: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    height: 40,
  },
  backIcon: {
    position: "absolute",
    left: 0,
    padding: 4,
  },
  title: {
    fontSize: 24,
    color: "#5c5c99",
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f5f5fc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    color: "#5c5c99",
    marginBottom: 8,
    fontWeight: "600",
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
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: "#5c5c99",
    marginTop: 8,
    fontWeight: "500",
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    textAlign: "center",
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5fc",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  changeImageText: {
    color: "#5c5c99",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  removeImageButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#5c5c99",
    textAlign: "center",
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
});