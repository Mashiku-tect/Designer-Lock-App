// App.js
import React, { useContext } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import DashboardScreen from './components/DashboardScreen';
import NewOrderScreen from './components/NewOrderScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import DesignersScreen from './components/DesignersScreen';
import ChatScreen from './components/ChatScreen';
import ProductScreen from './components/ProductScreen';
import ProfileScreen from './components/ProfileScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import * as Linking from 'expo-linking';

import { AuthProvider, AuthContext } from './AuthContext';

const Stack = createStackNavigator();

// Linking config
const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      ResetPassword: 'reset/:token', // e.g., myapp://reset/abc123
      ForgotPassword: 'forgot',
      Login: 'login',
      Register: 'register',
      // Add other screens if you want them accessible via deep link
    },
  },
};

// Auth stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

// App (protected) stack
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="NewOrder" component={NewOrderScreen} />
    <Stack.Screen name="DesignersScreen" component={DesignersScreen} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="ChatScreen" component={ChatScreen} />
    <Stack.Screen name="Product" component={ProductScreen} />
  </Stack.Navigator>
);

// Root navigation
const RootNavigation = () => {
  const { userToken, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a6bff" />
      </View>
    );
  }

  return userToken ? <AppStack /> : <AuthStack />;
};

// App entry point
export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer linking={linking}>
        <RootNavigation />
      </NavigationContainer>
      <Toast />
    </AuthProvider>
  );
}
