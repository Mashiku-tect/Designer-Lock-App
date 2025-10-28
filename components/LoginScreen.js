import React, { useState,useContext } from 'react';
import { AuthContext } from '../AuthContext';
import Toast from 'react-native-toast-message';

import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
  Alert,ToastAndroid
} from 'react-native';
import axios from 'axios';
import BASE_URL from './Config';
import { useTheme } from './ThemeContext'; 
import ThemeToggle from './ThemeToggle';


export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

    const { colors, isDarkMode } = useTheme(); // Add this line
      const styles = createStyles(colors, isDarkMode);
  

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/login`, {
        email,
        password,
      });
    
if (res.data.success) {
  const message = res.data.message;

  if (Platform.OS === 'android') {
    // 🔹 Use Android native toast
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // 🔹 Use your fallback toast (react-native-toast-message)
    Toast.show({
      type: 'success',
      text2: message,
    });
  }

  await login(res.data.token);
}
     
     
      
    } catch (error) {
       const errorMessage = error.response?.data?.message || 'Something went wrong';
       if(Platform.OS === 'android'){
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
       }else{
      Toast.show({
          type: 'error',
          text2: errorMessage,
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <Image
            source={require('../assets/lock.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to DesignLock</Text>
          <Text style={styles.subtitle}>Please sign in to continue</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email or Phone"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Don't have an account ? Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
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
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 15,
    fontSize: 16,
    color: colors.text,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
