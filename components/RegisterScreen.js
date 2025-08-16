import React,{ useState } from 'react';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import FlashMessage, { showMessage } from 'react-native-flash-message';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [firstname, setFirstName] = useState('');
const [lastname, setLastName] = useState('');
const [email, setEmail] = useState('');
const [phonenumber, setPhone] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

const handleRegister = async () => {
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

try {
  const res = await axios.post('https://1a4f66175ccc.ngrok-free.app/api/register', {
    firstname,
    lastname,
    email,
    phonenumber,
    password
  });

  // Alert success message from server
  //alert(res.data.message);
   Toast.show({
    type: 'success',
    text2: res.data.message,
  });
  navigation.navigate('Login');

} catch (error) {
 
    const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';

  Toast.show({
    type: 'error',
    text2: errorMessage,
  });
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

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#999"
               value={phonenumber}
              onChangeText={setPhone}
              keyboardType="phone-pad"
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

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
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

          {/* Spacer to avoid cutting off content */}
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
  footerText: {
    color: '#666',
    fontSize: 13,
  },
  footerLink: {
    color: '#4a6bff',
    fontSize: 13,
    fontWeight: '600',
  },
});
