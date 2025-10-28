import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // or your preferred icon library
import { useTheme } from './ThemeContext'; 
import ThemeToggle from './ThemeToggle';

const { width, height } = Dimensions.get('window');

const PaymentProcessingScreen = ({ navigation }) => {
  const spinValue = new Animated.Value(0);
  const pulseValue = new Animated.Value(1);
   const { colors, isDarkMode } = useTheme(); // Add this line
          const styles = createStyles(colors, isDarkMode);

  useEffect(() => {
    // Spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing animation for background
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulse = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <Animated.View style={[styles.backgroundCircle, { transform: [{ scale: pulse }] }]} />
      
      <View style={styles.content}>
        {/* Animated Loading Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync" size={80} color="#6366f1" />
          </Animated.View>
          
          {/* Checkmark that will appear when payment is successful */}
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
        </View>

        {/* Main Message */}
        <Text style={styles.title}>Processing Your Payment</Text>
        
        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, styles.dot1]} />
          <Animated.View style={[styles.dot, styles.dot2]} />
          <Animated.View style={[styles.dot, styles.dot3]} />
        </View>

        {/* Information Text */}
        <View style={styles.messageContainer}>
          <View style={styles.messageRow}>
            <Ionicons name="phone-portrait-outline" size={20} color="#6b7280" />
            <Text style={styles.messageText}>
              You will receive an SMS shortly about the payment details
            </Text>
          </View>
          
          <View style={styles.messageRow}>
            <Ionicons name="download-outline" size={20} color="#6b7280" />
            <Text style={styles.messageText}>
              You can download the media files once the payment is successful
            </Text>
          </View>
        </View>

        {/* Estimated Time */}
        <View style={styles.timeEstimate}>
          <Text style={styles.timeText}>⏱️ Usually takes 30-60 seconds</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Back to Safety</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.primaryButtonText}>Go To Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundCircle: {
    position: 'absolute',
    top: -height * 0.3,
    right: -width * 0.2,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: colors.isDarkMode 
      ? 'rgba(99, 102, 241, 0.08)' 
      : 'rgba(99, 102, 241, 0.05)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successIcon: {
    position: 'absolute',
    opacity: 0, // Hidden initially, show when payment succeeds
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  messageContainer: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  timeEstimate: {
    backgroundColor: colors.isDarkMode 
      ? 'rgba(99, 102, 241, 0.15)' 
      : 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  timeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginLeft: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

// Add animations for dots
const dotAnimation = () => {
  const animatedValue = new Animated.Value(0);
  
  Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  ).start();

  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
};

// Apply animations to dots (you would need to create refs for each dot)
// This is a simplified version - in a real app, you'd manage these animations properly

export default PaymentProcessingScreen;