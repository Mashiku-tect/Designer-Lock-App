import React, { useState,useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Alert,ToastAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import BASE_URL from './Config';
import Toast from 'react-native-toast-message';
import { Video } from 'expo-av';
import axios from 'axios';
import PhoneInput from 'react-native-phone-number-input';
import { useTheme } from './ThemeContext'; 
import ThemeToggle from './ThemeToggle';

export default function NewOrderScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme(); // Add this line
  const [formData, setFormData] = useState({
    clientName: '',
    contactNumber: '',
    designTitle: '',
    price: '',
  
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productId, setProductId] = useState(null); // New state for product ID
  const phoneInput = useRef(null);
  const styles = createStyles(colors, isDarkMode);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formData.clientName || !formData.designTitle || !formData.price || !formData.contactNumber) {
     // Alert.alert('Required Fields', 'Please fill in all required fields');
     if(Platform.OS==='android'){
      ToastAndroid.show('Please fill in all required fields', ToastAndroid.SHORT);
      return;
     }
     else{
 Toast.show({
         type: 'error',
         text2: 'Please fill in all required fields',
       });
      return;
     }
    
    }
    //Validate Phone Number
    if (!phoneInput.current?.isValidNumber(formData.contactNumber)) {
      if(Platform.OS==='android'){
        ToastAndroid.show('Invalid phone number', ToastAndroid.SHORT);
        return;
       }
       else{
  Toast.show({
    type: 'error',
    text2: 'Invalid phone number',
  });
  return;
}

}


    if(formData.price<1000){
      if(Platform.OS==='android'){
        ToastAndroid.show('Price Must Be At least 1000', ToastAndroid.SHORT);
        return;
       }else{

      
      Toast.show({
         type: 'info',
         text2: 'Price Must Be At least 1000',
       });
       return;
        }
    }

    setIsSubmitting(true);

    try {
      // 🔐 Get the token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        //Alert.alert('Unauthorized', 'You must be logged in to create an order.');
        Toast.show({
         type: 'error',
         text2: 'You must be logged in to create an order',
       });
        setIsSubmitting(false);
        return;
      }

      const formDataWithFiles = new FormData();
      formDataWithFiles.append('clientname', formData.clientName);
      formDataWithFiles.append('clientphonenumber', formData.contactNumber);
      formDataWithFiles.append('designtitle', formData.designTitle);
      formDataWithFiles.append('price', formData.price);
    

      uploadedFiles.forEach((file) => {
        formDataWithFiles.append(`files`, {
          uri: file.uri,
          type: file.mimeType || file.type || 'image/jpeg',
          name: file.name || file.fileName || file.uri.split('/').pop(),
        });
      });

      const response = await axios.post(`${BASE_URL}/api/orders/`, formDataWithFiles, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`,
  },
});

// No need for response.json()
const data = response.data;
//console.log("Returned Data",data);

if (response.data.success) {
  setProductId(data.productId); // Store the product ID
} 

    } catch (error) {
       const errorMessage =error.response?.data?.message ||'Something Went Wrong';
        
        if(Platform.OS==='android'){
          ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
          return;
         }
         else{
Toast.show({
         type: 'error',
         text2: errorMessage,
       });
         }
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (productId) {
      await Clipboard.setStringAsync(productId);
      //Alert.alert('Copied!', 'Product ID has been copied to clipboard');
      if(Platform.OS==='android'){
        ToastAndroid.show('Product ID has been copied to clipboard', ToastAndroid.SHORT);
       }else{
      Toast.show({
               type: 'success',
               text2: 'Product ID has been copied to clipboard',
             });
            }
             navigation.navigate('Dashboard');
    }
  };

  const handleUpload = async () => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      if(Platform.OS==='android'){
        ToastAndroid.show('Permission required: We need access to your gallery', ToastAndroid.SHORT);
        return;
       }
       else{
      Toast.show({
        type: 'info',
        text2: 'Permission required: We need access to your gallery',
      });
      return;
    }
    }

    // ✅ Allow both images and videos
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // both
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const validFiles = result.assets.filter(asset =>
        asset.uri.match(/\.(jpg|jpeg|png|mp4|mov|mkv)$/i)
      );

      // ✅ Add both images and videos
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  } catch (error) {
    console.log('Error uploading files:', error);
    Toast.show({
      type: 'error',
      text2: 'Error uploading files. Please try again',
    });
  }
};


  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    if (productId) {
      // If we have a product ID, clear it and stay on the page
      setProductId(null);
    } else {
      // Otherwise, navigate back
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.headerIcon}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="chevron-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {productId ? 'Order Created' : 'New Designing Order'}
          </Text>
        </View>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        {productId ? (
          // Show product ID after successful creation
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Order Created Successfully!</Text>
            
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.successText}>
                Your order has been created successfully. Please save the Product ID for future reference.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Product ID</Text>
              <View style={styles.productIdContainer}>
                <TextInput
                  style={styles.productIdInput}
                  value={productId}
                  editable={false}
                  selectTextOnFocus={true}
                />
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={copyToClipboard}
                >
                  <Ionicons name="copy" size={20} color="#4a6bff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Tap the copy icon to copy this ID to your clipboard
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Original form content
          <>
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
                  ref={phoneInput}
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
                  onChangeFormattedText={(text) => {
                    setFormData({ ...formData, contactNumber: text });
                  }}
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
              
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleUpload}
                activeOpacity={0.7}
              >
                <View style={styles.uploadButtonContent}>
                  <Ionicons name="cloud-upload" size={28} color="#4a6bff" />
                  <Text style={styles.uploadButtonText}>Upload Design Files</Text>
                  <Text style={styles.uploadSubtext}>PNG or JPG only (max 10 files)</Text>
                </View>
              </TouchableOpacity>

              {/* Display uploaded files */}
              {uploadedFiles.length > 0 && (
                <View style={styles.uploadedFilesContainer}>
     {uploadedFiles.map((file, index) => {
  const isVideo = file.uri.endsWith('.mp4') || file.uri.endsWith('.mov') || file.uri.endsWith('.mkv');
  
  return (
    <View key={`file-${index}`} style={styles.previewItem}>
      {isVideo ? (
        <Video
          source={{ uri: file.uri }}
          style={styles.previewMedia}
          resizeMode="cover"
          useNativeControls={false}
          shouldPlay={false}
        />
      ) : (
        <Image
          source={{ uri: file.uri }}
          style={styles.previewMedia}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.previewActions}>
        <Text style={styles.fileName}>
          {file.name || file.fileName || file.uri.split('/').pop()}
        </Text>
        <TouchableOpacity onPress={() => removeFile(index)}>
          <Ionicons name="close-circle" size={20} color="#ff4a4a" />
        </TouchableOpacity>
      </View>
    </View>
  );
})}

                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Submit Button - Only show when not showing product ID */}
      {!productId && (
        <View style={styles.footer}>
          <TouchableOpacity 
  style={[
    styles.submitButton,
    (
      !formData.clientName || 
      !formData.designTitle || 
      !formData.price || 
      uploadedFiles.length === 0 // ✅ Require at least 1 file
    ) && styles.disabledButton
  ]}
  onPress={handleSubmit}
  disabled={
    !formData.clientName || 
    !formData.designTitle || 
    !formData.price || 
    uploadedFiles.length === 0 || // ✅ Require at least 1 file
    isSubmitting
  }
  activeOpacity={0.7}
>
  <Text style={styles.submitButtonText}>
    {isSubmitting ? 'Creating...' : 'Create Order'}
  </Text>
  <Ionicons name="checkmark-circle" size={22} color="white" />
</TouchableOpacity>

        </View>
      )}
    </View>
  );
}
const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
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
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontSize: 16,
    color: colors.text,
  },
  // Phone Input Styles
  phoneInputContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    color: colors.text,
    backgroundColor: 'transparent',
  },
  phoneCodeText: {
    fontSize: 16,
    color: colors.text,
  },
  phoneFlagButton: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
    marginRight: 8,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.borderLight,
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
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  uploadSubtext: {
    color: colors.textMuted,
    fontSize: 12,
  },
  uploadedFilesContainer: {
    marginTop: 15,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  // New styles for product ID display
  successMessage: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
  },
  successText: {
    textAlign: 'center',
    marginTop: 10,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  productIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  productIdInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: colors.text,
  },
  copyButton: {
    padding: 15,
    backgroundColor: colors.gray100,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 5,
    marginLeft: 5,
  },
  doneButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});