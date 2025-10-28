import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image,Alert,ActivityIndicator,ToastAndroid, } from 'react-native';
import { useTheme } from './ThemeContext'; 
import ThemeToggle from './ThemeToggle';
import BASE_URL from './Config';
import axios from 'axios';
import Toast from 'react-native-toast-message';
export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

      const { colors, isDarkMode } = useTheme(); // Add this line
        const styles = createStyles(colors, isDarkMode);

   const handleSendResetLink = async () => {
  if (!email) return;

  setLoading(true);
  try {
    const response = await axios.post(`${BASE_URL}/api/forgot-password`, { email });

    // Axios automatically throws an error for non-2xx responses,
    // so if we’re here, it means success
    if (Platform.OS === 'android') {
      ToastAndroid.show(response.data.message || 'Reset link sent to your email', ToastAndroid.LONG);
    }
    else{
      Toast.show({
        type: 'success',
        text2: response.data.message || 'Reset link sent to your email',
      });
    }
   // Alert.alert('Success', response.data.message || 'Reset link sent to your email');
    navigation.navigate('Login');
  } catch (error) {
    //console.error('❌ Forgot password error:', error);

    // Handle various error cases
    if (error.response) {
      // Server responded with an error status
      if (Platform.OS === 'android') {
        ToastAndroid.show(error.response.data.message || 'Something went wrong. Please try again.', ToastAndroid.LONG);
      }
      else{
        Toast.show({
          type: 'error',
          text2: error.response.data.message || 'Something went wrong. Please try again.',
        });
      }
      //Alert.alert('Error', error.response.data.message || 'Something went wrong. Please try again.');
    } else if (error.request) {
      // No response from server
      if (Platform.OS === 'android') {
        ToastAndroid.show('Unable to reach the server. Please try again later.', ToastAndroid.LONG);
      }
      else{
        Toast.show({
          type: 'error',
          text2: 'Unable to reach the server. Please try again later.',
        });
      }
      //Alert.alert('Network Error', 'Unable to reach the server. Please try again later.');
    } else {
      // Something else went wrong
      if (Platform.OS === 'android') {
        ToastAndroid.show( 'An unexpected error occurred.', ToastAndroid.LONG);
      }
      else{
        Toast.show({
          type: 'error',
          text2: 'An unexpected error occurred.',
        });
      }
      //Alert.alert('Error', error.message);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header with Logo */}
        <Image 
          source={require('../assets/lock.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        
        {/* Title and Description */}
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password
        </Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Submit Button */}
       <TouchableOpacity 
          style={[styles.button, (!email || loading) && styles.buttonDisabled]}
          disabled={!email || loading}
          onPress={handleSendResetLink}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login Link - Now with proper spacing */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backLinkText}>
              <Text style={{fontWeight: '600'}}>←</Text> Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  input: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.gray400,
    shadowColor: 'transparent',
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  bottomContainer: {
    marginTop: 25,
    alignItems: 'center', 
    paddingHorizontal: 20, 
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 5, 
  },
});