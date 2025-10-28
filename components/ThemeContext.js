// ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // If no saved preference, use system theme
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    try {
      await AsyncStorage.setItem('app_theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (theme) => {
    const newTheme = theme === 'dark';
    setIsDarkMode(newTheme);
    
    try {
      await AsyncStorage.setItem('app_theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    setTheme,
    isLoading,
    colors: isDarkMode ? darkColors : lightColors
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Color schemes
export const lightColors = {
  // Primary
  primary: '#4a6bff',
  primaryLight: '#6c8cff',
  primaryDark: '#3a5bed',
  
  // Background
  background: '#FFFFFF',
  surface: '#F8F8F8',
  card: '#FFFFFF',
  
  // Text
  text: '#1D1D1F',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  
  // Borders
  border: '#F0F0F0',
  borderLight: '#E0E0E0',
  
  // Status
  success: '#2ecc71',
  error: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  
  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#f8f9fa',
  gray100: '#e9ecef',
  gray200: '#dee2e6',
  gray300: '#ced4da',
  gray400: '#adb5bd',
  gray500: '#6c757d',
  gray600: '#495057',
  gray700: '#343a40',
  gray800: '#212529',
  gray900: '#121416',
};

export const darkColors = {
  // Primary
  primary: '#6c8cff',
  primaryLight: '#8caaff',
  primaryDark: '#4a6bff',
  
  // Background
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2D2D2D',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#888888',
  textInverse: '#1D1D1F',
  
  // Borders
  border: '#333333',
  borderLight: '#444444',
  
  // Status
  success: '#27ae60',
  error: '#c0392b',
  warning: '#d35400',
  info: '#2980b9',
  
  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#1a1a1a',
  gray100: '#2d2d2d',
  gray200: '#404040',
  gray300: '#525252',
  gray400: '#666666',
  gray500: '#7a7a7a',
  gray600: '#8e8e8e',
  gray700: '#a3a3a3',
  gray800: '#b7b7b7',
  gray900: '#cccccc',
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};