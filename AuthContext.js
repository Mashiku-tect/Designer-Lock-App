import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        if (token) {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp && decoded.exp > currentTime) {
            // ✅ Token is still valid
            setUserToken(token);
          } else {
            // ❌ Token expired
            await AsyncStorage.removeItem('userToken');
            setUserToken(null);
          }
        } else {
          setUserToken(null); // ❌ No token found
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const login = async (token) => {
    await AsyncStorage.setItem('userToken', token);
    setUserToken(token);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
