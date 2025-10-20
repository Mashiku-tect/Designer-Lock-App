import React, { useState } from "react";
import { View, Button, StyleSheet, Text, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";

export default function VideoUploadScreen() {
  const [videoUri, setVideoUri] = useState(null);
  const [hasPaid, setHasPaid] = useState(false); // false = unpaid, true = paid

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const togglePaymentStatus = () => setHasPaid(!hasPaid);

  return (
    <View style={styles.container}>
      <Button title="Select Video from Gallery" onPress={pickVideo} />

      {videoUri ? (
        <View style={styles.videoContainer}>
          <Text style={styles.info}>Selected Video:</Text>

          <View style={styles.videoWrapper}>
            <Video
              source={{ uri: videoUri }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="contain"
              shouldPlay
              useNativeControls
              style={styles.video}
            />

            {/* Watermark overlay (only if unpaid) */}
            {!hasPaid && (
              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>UNPAID VERSION</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.payButton, hasPaid && { backgroundColor: "green" }]}
            onPress={togglePaymentStatus}
          >
            <Text style={styles.payButtonText}>
              {hasPaid ? "Paid ✅" : "Mark as Paid 💰"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.info}>No video selected yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
  },
  videoContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    height: 300,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  watermark: {
    position: "absolute",
    top: "45%",
    left: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 8,
  },
  watermarkText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  info: {
    marginVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  payButton: {
    marginTop: 15,
    backgroundColor: "#ff9900",
    padding: 10,
    borderRadius: 8,
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
