// ThemeToggle.js
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from './ThemeContext';

const ThemeToggle = ({ size = 24, style }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.toggleButton, style]} 
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Icon 
        name={isDarkMode ? "wb-sunny" : "nights-stay"} 
        size={size} 
        color={isDarkMode ? "#FFD60A" : colors.primary} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});

export default ThemeToggle;