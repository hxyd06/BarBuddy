import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDoc, collection, serverTimestamp, updateDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

export default function NewPromotionScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const fetchBusinesses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const businessQuery = query(
        collection(db, "businesses"),
        where("ownerId", "==", user.uid)
      );
      const snapshot = await getDocs(businessQuery);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBusinesses(data);
      if (data.length > 0) {
        setSelectedBusinessId(data[0].id);
      }
    };
    fetchBusinesses();
  }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Please log in to submit a promotion.");
      return;
    }

    if (!title || !description || !startDate || !endDate || !selectedBusinessId) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setIsUploading(true);

    try {
      let imageURL = "";
      const docRef = await addDoc(collection(db, "promotions"), {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageURL: "",
        ownerId: user.uid,
        businessId: selectedBusinessId,
        createdAt: serverTimestamp(),
      });

      if (imageUri) {
        imageURL = await uploadImage(imageUri, docRef.id);
        await updateDoc(docRef, { imageURL });
      }

      Alert.alert("Success", "Your promotion was submitted.");
      router.back();
    } catch (error) {
      console.error("Error submitting promotion:", error);
      Alert.alert("Submission Error", "Could not save promotion.");
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
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

      const filename = `promotionImages/${documentId}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
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
            <Text style={styles.title}>New Promotion</Text>
          </View>

          <TextInput
            testID="Title"
            placeholder="Promotion Title*"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            testID="Description"
            placeholder="Description*"
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            testID="startDate"
            placeholder="Start Date (YYYY-MM-DD)*"
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            testID="endDate"
            placeholder="End Date (YYYY-MM-DD)*"
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
          />

          <View style={styles.pickerWrapper}>
            <Text style={styles.imageLabel}>Select Business*</Text>
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={selectedBusinessId}
                onValueChange={(itemValue) => setSelectedBusinessId(itemValue)}
              >
                {businesses.map((b) => (
                  <Picker.Item label={b.name} value={b.id} key={b.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>Promotion Photo</Text>
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
                  Add Promotion Photo
                </Text>
                <Text style={styles.imagePlaceholderSubtext}>
                  Tap to select from photo library
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            testID="Submit"
            onPress={handleSubmit}
            disabled={isUploading}
            style={[styles.submitButton, isUploading && { opacity: 0.6 }]}
          >
            <Text style={styles.submitText}>
              {isUploading ? "Uploading..." : "Submit Promotion"}
            </Text>
          </TouchableOpacity>

          {isUploading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5c5c99" />
              <Text style={styles.loadingText}>Saving promotion...</Text>
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
  pickerWrapper: {
    marginBottom: 16,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
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
