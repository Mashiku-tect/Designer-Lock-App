// App.js
import React, { useContext } from "react";
import { StatusBar, ActivityIndicator, View } from "react-native";
import Toast from "react-native-toast-message";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Linking from "expo-linking";

import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import DashboardScreen from "./components/DashboardScreen";
import NewOrderScreen from "./components/NewOrderScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import FeedScreen from "./components/FeedsScreen";
import ChatScreen from "./components/ChatScreen";
import ProductScreen from "./components/ProductScreen";
import ProfileScreen from "./components/ProfileScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import InboxScreen from "./components/InboxScreen";
import EditOrderScreen from "./components/EditOrderScreen";
import FeedProfileScreen from "./components/FeedProfileScreen";
import VideoUploadScreen from "./components/VideoScreen";
import FollowingFollower from './components/followersfollowingscreen';

import { AuthProvider, AuthContext } from "./AuthContext";

// Create stack
const Stack = createStackNavigator();

// ✅ Auto-detect app prefix
const prefix = Linking.createURL("/");

// ✅ Linking configuration
const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      ResetPassword: "reset/:token",
      ForgotPassword: "forgot",
      Login: "login",
      Register: "register",
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

// App stack
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="NewOrder" component={NewOrderScreen} />
    <Stack.Screen name="FeedScreen" component={FeedScreen} />
    <Stack.Screen name="VideoUploadScreen" component={VideoUploadScreen} />
    <Stack.Screen name="FeedProfileScreen" component={FeedProfileScreen} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="ChatScreen" component={ChatScreen} />
    <Stack.Screen name="Product" component={ProductScreen} />
    <Stack.Screen name="Inbox" component={InboxScreen} />
    <Stack.Screen name="EditOrderScreen" component={EditOrderScreen} />
    <Stack.Screen name="followerfollowingscreen" component={FollowingFollower} />

  </Stack.Navigator>
);

// Root Navigation
const RootNavigation = () => {
  const { userToken, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4a6bff" />
      </View>
    );
  }

  return userToken ? <AppStack /> : <AuthStack />;
};

// Main App
export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer
        linking={linking}
        fallback={<ActivityIndicator size="large" color="#4a6bff" />}
      >
        <RootNavigation />
      </NavigationContainer>
      <Toast />
    </AuthProvider>
  );
}
