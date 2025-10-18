import React, { useState } from "react";
import { View, Button, StyleSheet, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";

export default function VideoUploadScreen() {
  const [videoUri, setVideoUri] = useState(null);

  // Function to pick a video
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

  return (
    <View style={styles.container}>
      <Button title="Select Video from Gallery" onPress={pickVideo} />

      {videoUri ? (
        <View style={styles.videoContainer}>
          <Text style={styles.info}>Selected Video:</Text>
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
  video: {
    width: "100%",
    height: 300,
    backgroundColor: "#000",
  },
  info: {
    marginVertical: 10,
    fontSize: 16,
    color: "#333",
  },
});
