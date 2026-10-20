
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

export default function CropScannerScreen() {
  const [image, setImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(false);

  // Select a crop image from the phone gallery
  const chooseImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to your gallery.");
      return;
    }

    const selected = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!selected.canceled) {
      setImage(selected.assets[0].uri);
      setResult(false);
    }
  };

  // Take a photo using the phone camera
  const takePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to your camera.");
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!photo.canceled) {
      setImage(photo.assets[0].uri);
      setResult(false);
    }
  };

  // Demo scan — connect your ML API here later
  const scanCrop = async () => {
    if (!image) {
      Alert.alert("No image", "Take a photo or select an image first.");
      return;
    }

    setScanning(true);
    setResult(false);

    try {
      // Simulate a short processing delay.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setResult(true);
    } catch (error) {
      Alert.alert("Error", "Unable to process the image.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>🌿 AgriGaurd</Text>
            <Text style={styles.subtitle}>
              Smart crop health assistant
            </Text>
          </View>
          <Text style={styles.headerIcon}>🌱</Text>
        </View>

        <Text style={styles.eyebrow}>CROP HEALTH</Text>
        <Text style={styles.title}>Crop Scanner</Text>
        <Text style={styles.description}>
          Take a clear photo of your crop to help assess
          possible disease symptoms.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Crop image</Text>

          <View style={styles.imageArea}>
            {image ? (
              <Image source={{ uri: image }} style={styles.preview} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.placeholderTitle}>
                  Add a crop photo
                </Text>
                <Text style={styles.placeholderText}>
                  Capture a leaf or choose an existing image.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={takePhoto}
            >
              <Text style={styles.secondaryText}>📸 Take photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={chooseImage}
            >
              <Text style={styles.secondaryText}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.scanButton, !image && styles.disabledButton]}
            onPress={scanCrop}
            disabled={!image || scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.scanButtonText}>
                Analyse crop image →
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Demo mode: disease detection is not connected yet.
          </Text>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Demo scan complete</Text>
            <Text style={styles.resultText}>
              Your image was selected successfully. No disease
              has been identified because the machine-learning
              service has not been connected yet.
            </Text>

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>
                🌱 Preventive tips
              </Text>
              <Text style={styles.resultText}>
                • Inspect both sides of the leaves.
                {"\n"}• Look for unusual spots or discolouration.
                {"\n"}• Record when symptoms first appear.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips for better scans</Text>
          <Text style={styles.infoText}>
            • Use a focused, well-lit image.
          </Text>
          <Text style={styles.infoText}>
            • Photograph affected areas closely.
          </Text>
          <Text style={styles.infoText}>
            • Avoid shadows and blurry photos.
          </Text>
        </View>

        <Text style={styles.footer}>
          CropSafety · Helping farmers protect their crops
        </Text>
      </ScrollView>        
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8F1",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  brand: {
    fontSize: 24,
    fontWeight: "800",
    color: "#205C36",
  },
  subtitle: {
    color: "#718073",
    fontSize: 13,
    marginTop: 5,
  },
  headerIcon: {
    fontSize: 35,
  },
  eyebrow: {
    color: "#548B48",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: "#183D28",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
  },
  description: {
    color: "#6B796D",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2EBDD",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#24462E",
    marginBottom: 14,
  },
  imageArea: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#EDF4E9",
    borderWidth: 1,
    borderColor: "#DCE8D7",
    borderStyle: "dashed",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cameraIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#34583A",
  },
  placeholderText: {
    color: "#7B897B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 7,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F6ED",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE9D7",
    paddingHorizontal: 5,
  },
  secondaryText: {
    color: "#315C39",
    fontSize: 13,
    fontWeight: "700",
  },
  scanButton: {
    height: 52,
    backgroundColor: "#287443",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  disabledButton: {
    backgroundColor: "#91B39A",
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  disclaimer: {
    fontSize: 11,
    color: "#899289",
    textAlign: "center",
    marginTop: 12,
  },
  resultCard: {
    marginTop: 18,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE9D7",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#24462E",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#68766A",
  },
  tipBox: {
    backgroundColor: "#F0F6ED",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#315C39",
    marginBottom: 6,
  },
  infoCard: {
    backgroundColor: "#E9F2E4",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },
  infoTitle: {
    color: "#315C39",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoText: {
    color: "#58705A",
    fontSize: 12,
    lineHeight: 21,
  },
  footer: {
    color: "#879287",
    textAlign: "center",
    fontSize: 11,
    marginTop: 25,
  },
});
