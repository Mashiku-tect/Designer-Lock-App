// HelpSupportScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Ionicons, MaterialIcons, Feather, Entypo, AntDesign } from '@expo/vector-icons';

const HelpSupportScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();

  const createStyles = (colors, isDarkMode) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 16,
    },
    backButtonText: {
      fontSize: 24,
      color: colors.primary,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginRight: 40, // Balance the back button space
    },
    content: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 30,
    },
    contactButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 30,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    contactButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
    questionContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    question: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    answer: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    additionalSection: {
      marginTop: 30,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    quickLink: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    quickLinkText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    quickLinkIcon: {
      fontSize: 16,
      color: colors.textMuted,
    },
    footer: {
      marginTop: 30,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });

  const styles = createStyles(colors, isDarkMode);

  const handleContactSupport = () => {
    Linking.openURL('mailto:mashikuallen@gmail.com?subject=Help & Support Request&body=Hello, I need help with...');
  };



  const faqData = [
    {
      question: "How to upload designs and create orders?",
      answer: "Go to the 'Create Order' screen, select your design files, fill in the order details, and submit. You can upload multiple files and add specific instructions for the designer."
    },
    {
      question: "What file formats are supported?",
      answer: "We support JPG, PNG, PDF, AI, PSD, SVG, and other common design formats. Maximum file size is 50MB per file."
    },
    {
      question: "How to edit or update an existing order?",
      answer: "Navigate to your orders, tap on the order you want to edit, and use the 'Edit Order' option. You can update files, instructions, or contact information before the designer starts working."
    },
    {
      question: "Payment and billing issues?",
      answer: "Payments are processed securely through our platform. If you encounter issues, check your payment method, ensure sufficient funds, or contact support for transaction disputes."
    },
    {
      question: "How long does order processing take?",
      answer: "Most orders are processed within 24-48 hours. Complex designs may take longer. You'll receive notifications at each stage of the process."
    },
    {
      question: "Can I download my completed designs?",
      answer: "Yes! Once your order is completed, you can download the final designs directly from the order details screen. Files are available for download for 30 days."
    },
    {
      question: "How do I communicate with designers?",
      answer: "Use the built-in chat feature in the order details screen. All communications are logged for quality assurance and reference."
    },
    {
      question: "What if I'm not satisfied with the design?",
      answer: "We offer revision requests. You can request changes within 7 days of delivery. Contact support if you need assistance with the revision process."
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
       <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} /> {/* Spacer for balance */}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Help & Support</Text>
        
        <Text style={styles.description}>
          We're here to help you! If you have any questions or need assistance with the app, 
          please don't hesitate to reach out to our support team.
        </Text>

        {/* Contact Support Button */}
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleContactSupport}
          activeOpacity={0.8}
        >
          <Text style={styles.contactButtonText}>📧 Contact Support</Text>
        </TouchableOpacity>

        {/* Common Questions Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {faqData.map((item, index) => (
          <View key={index} style={styles.questionContainer}>
            <Text style={styles.question}>• {item.question}</Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}

        {/* Quick Links Section */}
        <View style={styles.additionalSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => Linking.openURL('https://mashiku.infinityfreeapp.com/')}
            activeOpacity={0.7}
          >
            <Text>📄</Text>
            <Text style={styles.quickLinkText}>Terms of Service</Text>
            <Text style={styles.quickLinkIcon}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickLink, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL('https://mashiku.infinityfreeapp.com/')}
            activeOpacity={0.7}
          >
            <Text>🔒</Text>
            <Text style={styles.quickLinkText}>Privacy Policy</Text>
            <Text style={styles.quickLinkIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            App Version 1.0.0{"\n"}
            © 2025 Designer Lock. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;