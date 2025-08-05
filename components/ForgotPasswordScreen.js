import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

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
          style={[styles.button, !email && styles.buttonDisabled]}
          disabled={!email}
          onPress={() => navigation.navigate('PasswordResetSent')}
        >
          <Text style={styles.buttonText}>Send Reset Link</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 10, // Added some padding to prevent text clipping
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4a6bff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#4a6bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    shadowColor: 'transparent',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomContainer: {
    marginTop: 25,
    alignItems: 'center', 
    paddingHorizontal: 20, 
  },
  backLinkText: {
    color: '#4a6bff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 5, 
  },
});