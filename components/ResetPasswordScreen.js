// screens/ResetPasswordScreen.js
import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import axios from "axios";

export default function ResetPasswordScreen({ route }) {
  const [password, setPassword] = useState("");
  const { token } = route.params; // Deep link token

  const handleReset = async () => {
    try {
      await axios.post(`http://localhost:5000/api/auth/reset/${token}`, { password });
      Alert.alert("Success", "Password reset successfully!");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter new password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Reset Password" onPress={handleReset} />
    </View>
  );
}
