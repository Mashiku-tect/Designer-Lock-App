// ThemeSettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ThemeSettingsScreen = ({ navigation }) => {
  const { isDarkMode, setTheme, colors } = useTheme();

  const themeOptions = [
    {
      id: 'light',
      title: 'Light Mode',
      description: 'Use light theme',
      icon: 'wb-sunny',
      isSelected: !isDarkMode,
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      description: 'Use dark theme',
      icon: 'nights-stay',
      isSelected: isDarkMode,
    },
    {
      id: 'auto',
      title: 'Auto',
      description: 'Follow system settings',
      icon: 'brightness-auto',
      isSelected: false, // You can implement auto detection
    },
  ];

  const handleThemeSelect = (themeId) => {
    if (themeId === 'auto') {
      // Implement system theme detection
      // For now, we'll use light as default for auto
      setTheme('light');
    } else {
      setTheme(themeId);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appearance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <Text style={styles.sectionDescription}>
            Choose how the app looks
          </Text>

          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                option.isSelected && styles.optionCardSelected
              ]}
              onPress={() => handleThemeSelect(option.id)}
            >
              <View style={styles.optionLeft}>
                <Icon 
                  name={option.icon} 
                  size={24} 
                  color={option.isSelected ? colors.primary : colors.textSecondary} 
                />
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionTitle,
                    option.isSelected && styles.optionTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              
              {option.isSelected && (
                <Icon name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        
        
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  previewCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  previewContent: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

export default ThemeSettingsScreen;