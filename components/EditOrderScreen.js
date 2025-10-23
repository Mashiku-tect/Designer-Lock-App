import React, { useState, useEffect,useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from './Config';
import Toast from 'react-native-toast-message';
import PhoneInput from 'react-native-phone-number-input';

export default function EditOrderScreen({ route, navigation }) {
  const { order, onGoBack } = route.params;
  
  // Function to remove +255 prefix from phone number
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    // Remove "+255" prefix if present
    return phoneNumber.replace(/^\+255/, '');
  };

  const [formData, setFormData] = useState({
    clientName: order.clientname || '',
    contactNumber: formatPhoneNumber(order.clientphonenumber) || '', // Apply formatting here
    designTitle: order.designtitle || '',
    price: order.price ? order.price.toString() : '',
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState(order.files || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const phoneInputRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'Edit Order',
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ marginLeft: 15 }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleUpdateOrder = async () => {
    if (isSubmitting) return;

    if (!formData.clientName || !formData.designTitle || !formData.price) {
      Toast.show({
        type: 'error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    if (!phoneInputRef.current?.isValidNumber(formData.contactNumber)) {
      Toast.show({
        type: 'error',
        text2: 'Invalid phone number',
      });
      return;
    }

    if(formData.price < 500){
      Toast.show({
        type: 'info',
        text2: 'Price Must Be At Least 500',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({
          type: 'error',
          text2: 'You must be logged in to edit an order',
        });
        setIsSubmitting(false);
        return;
      }

      const formDataWithFiles = new FormData();
      formDataWithFiles.append('clientname', formData.clientName);
      formDataWithFiles.append('clientphonenumber', formData.contactNumber);
      formDataWithFiles.append('designtitle', formData.designTitle);
      formDataWithFiles.append('price', formData.price);

      // Append new files
      uploadedFiles.forEach((file) => {
        formDataWithFiles.append(`files`, {
          uri: file.uri,
          type: file.mimeType || file.type || 'image/jpeg',
          name: file.name || file.fileName || file.uri.split('/').pop(),
        });
      });

      // Using axios instead of fetch
      const response = await axios.put(
        `${BASE_URL}/api/orders/${order.product_id}`,
        formDataWithFiles,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        Toast.show({
          type: 'success',
          text2: 'Order updated successfully',
        });
        onGoBack && onGoBack(); // Refresh dashboard data
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text2: `Failed to update order: ${response.data.message}`,
        });
      }
    } catch (error) {
      // Handle axios error response
      const errorMessage = error.response?.data?.message 
        ? `Failed to update order: ${error.response.data.message}`
        : 'An error occurred. Please try again';
      
      Toast.show({
        type: 'error',
        text2: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async () => {
    try {
      let result;
      if (Platform.OS === 'web') {
        // Web: allow both image and video files
        result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'video/*'],
          copyToCacheDirectory: false,
          multiple: true,
        });

        if (result.type === 'success' && result.assets) {
          const validFiles = result.assets.filter(
            file =>
              file.mimeType.startsWith('image/') ||
              file.mimeType.startsWith('video/')
          );
          setUploadedFiles(prev => [...prev, ...validFiles]);
        }
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Toast.show({
            type: 'info',
            text2: 'We need access to your media library to upload files.',
          });
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All, // ✅ allow both images and videos
          allowsEditing: false,
          allowsMultipleSelection: true,
          quality: 1,
        });

        if (!result.canceled && result.assets) {
          const validFiles = result.assets.filter(asset => {
            const isImage =
              asset.uri.endsWith('.png') ||
              asset.uri.endsWith('.jpg') ||
              asset.uri.endsWith('.jpeg');
            const isVideo =
              asset.uri.endsWith('.mp4') ||
              asset.uri.endsWith('.mov') ||
              asset.uri.endsWith('.avi');
            return isImage || isVideo;
          });
          setUploadedFiles(prev => [...prev, ...validFiles]);
        }
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text2: 'Error uploading files. Please try again',
      });
    }
  };

  const removeFile = (index, isExisting = false) => {
    if (isExisting) {
      // Mark existing file for deletion (you might want to implement this on backend)
      setExistingFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const renderFileItem = (file, index, isExisting = false) => {
    const fileName = isExisting
      ? file.filename || file.path?.split('/').pop()
      : file.name || file.fileName || file.uri.split('/').pop();

    const fileUri = isExisting
      ? { uri: `${BASE_URL}/${file.path?.replace(/\\/g, '/')}` }
      : { uri: file.uri };

    const isVideo =
      fileUri.uri?.endsWith('.mp4') ||
      fileUri.uri?.endsWith('.mov') ||
      fileUri.uri?.endsWith('.avi');

    return (
      <View
        key={`file-${index}-${isExisting ? 'existing' : 'new'}`}
        style={styles.fileItem}
      >
        <Ionicons
          name={isVideo ? 'videocam' : 'image'}
          size={20}
          color={isVideo ? '#ff9500' : '#4a6bff'}
        />
        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
          {fileName}
        </Text>
        <TouchableOpacity
          onPress={() => removeFile(index, isExisting)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color="#ff4a4a" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerIcon}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Edit Order</Text>
        </View>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Client Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Client Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Client Name"
              placeholderTextColor="#999"
              value={formData.clientName}
              onChangeText={(text) => setFormData({...formData, clientName: text})}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contact Number *</Text>
            <PhoneInput
              ref={phoneInputRef}
              defaultValue={formData.contactNumber}
              defaultCode="TZ"
              layout="first"
              containerStyle={styles.phoneInputContainer}
              textContainerStyle={styles.phoneTextContainer}
              textInputStyle={styles.phoneTextInput}
              codeTextStyle={styles.phoneCodeText}
              flagButtonStyle={styles.phoneFlagButton}
              textInputProps={{
                placeholder: 'Enter phone number',
                placeholderTextColor: '#999',
                keyboardType: 'phone-pad',
                returnKeyType: 'next',
              }}
              onChangeFormattedText={(text) =>
                setFormData({ ...formData, contactNumber: text })
              }
            />
          </View>
        </View>

        {/* Design Details Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Design Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Design Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Business Card Design"
              placeholderTextColor="#999"
              value={formData.designTitle}
              onChangeText={(text) => setFormData({...formData, designTitle: text})}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Price (TZS) *</Text>
            <TextInput
              style={styles.input}
              placeholder="50,000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(text) => setFormData({...formData, price: text})}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Design Files</Text>
          
          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <View style={styles.uploadedFilesContainer}>
              <Text style={styles.subSectionLabel}>Current Files:</Text>
              {existingFiles.map((file, index) => renderFileItem(file, index, true))}
            </View>
          )}

          {/* Upload New Files */}
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUpload}
            activeOpacity={0.7}
          >
            <View style={styles.uploadButtonContent}>
              <Ionicons name="cloud-upload" size={28} color="#4a6bff" />
              <Text style={styles.uploadButtonText}>Upload Additional Files</Text>
              <Text style={styles.uploadSubtext}>PNG,JPG or MP4 only (max 10 files)</Text>
            </View>
          </TouchableOpacity>

          {/* Display newly uploaded files */}
          {uploadedFiles.length > 0 && (
            <View style={styles.uploadedFilesContainer}>
              <Text style={styles.subSectionLabel}>New Files:</Text>
              {uploadedFiles.map((file, index) => renderFileItem(file, index, false))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Update Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!formData.clientName || !formData.designTitle || !formData.price) && styles.disabledButton
          ]}
          onPress={handleUpdateOrder}
          disabled={!formData.clientName || !formData.designTitle || !formData.price || isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Updating...' : 'Update Order'}
          </Text>
          <Ionicons name="checkmark-circle" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6bff',
  },
  headerIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    fontSize: 16,
    color: '#333',
  },
  // Phone Input Styles
  phoneInputContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    height: 52,
  },
  phoneTextContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    height: 50,
  },
  phoneTextInput: {
    height: 50,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
  },
  phoneCodeText: {
    fontSize: 16,
    color: '#333',
  },
  phoneFlagButton: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: '#e1e1e1',
    marginRight: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#e1e1e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    width: '100%',
  },
  uploadButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#4a6bff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  uploadSubtext: {
    color: '#999',
    fontSize: 12,
  },
  uploadedFilesContainer: {
    marginTop: 15,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    color: '#555',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#4a6bff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4a6bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
});