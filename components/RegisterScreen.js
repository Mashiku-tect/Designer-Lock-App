import React, { useState, useRef } from 'react';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import BASE_URL from './Config';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// Import phone number input
import PhoneInput from 'react-native-phone-number-input';

export default function RegisterScreen({ navigation }) {
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phonenumber, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  const phoneInput = useRef(null);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text2: 'Passwords do not match' });
      return;
    }

    // ✅ Validate phone number
    const isValid = phoneInput.current?.isValidNumber(phonenumber);
    if (!isValid) {
      Toast.show({ type: 'error', text2: 'Invalid phone number' });
      return;
    }

    try {
      setIsLoading(true); // 👈 start loading
      const res = await axios.post(`${BASE_URL}/api/register`, {
        firstname,
        lastname,
        email,
        phonenumber,
        password,
      });

      Toast.show({
        type: 'success',
        text2: res.data.message,
      });
      navigation.navigate('Login');
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        'Registration failed. Please try again.';

      Toast.show({
        type: 'error',
        text2: errorMessage,
      });
    }
    finally {
      setIsLoading(false); // 👈 stop loading (success or error)
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          {/* Header */}
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Join DesignLock to get started</Text>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#999"
              value={firstname}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#999"
              value={lastname}
              onChangeText={setLastName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            {/* Phone number input */}
            <PhoneInput
              ref={phoneInput}
              defaultValue={phonenumber}
              defaultCode="TZ"   // 🇹🇿 Change to your default country
              layout="first"
              containerStyle={styles.phoneContainer}
              textContainerStyle={styles.phoneTextContainer}
              textInputProps={{
                placeholderTextColor: '#999',
              }}
              onChangeFormattedText={(text) => {
                setPhone(text);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {/* Register button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={isLoading} // disable while loading
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By registering, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Already Signed Up ? Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: '100%',
  },
  innerContainer: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  phoneContainer: {
    width: '100%',
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 2,
  },
  phoneTextContainer: {
    paddingVertical: 0,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  registerButton: {
    backgroundColor: '#4a6bff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#4a6bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  termsContainer: {
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  termsText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    color: '#4a6bff',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  footerLink: {
    color: '#4a6bff',
    fontSize: 13,
    fontWeight: '600',
  },
});
