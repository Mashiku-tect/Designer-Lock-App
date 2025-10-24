import React, { useState, useEffect,useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import BASE_URL from './Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const ProductScreen = ({ route, navigation }) => {
  const { products = [], orderReference } = route.params || {};
  const [isPaid, setIsPaid] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [price, setPrice] = useState(null);
  const [productid, setProductId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const videoRefs = useRef([]);

  // Validate phone number format
  const validatePhoneNumber = (number) => {
    const cleanedNumber = number.trim();
    
    // Check if it starts with 255
    if (!cleanedNumber.startsWith('255')) {
      return 'Phone number must start with 255';
    }
    
    // Check total length (255 + 9 digits = 12 characters)
    if (cleanedNumber.length !== 12) {
      return 'Phone number must be 12 digits (255 followed by 9 digits)';
    }
    
    // Check if all characters after 255 are digits
    const digitsAfterPrefix = cleanedNumber.substring(3);
    if (!/^\d+$/.test(digitsAfterPrefix)) {
      return 'Phone number must contain only digits after 255';
    }
    
    // Check if the digits after 255 are valid (should be 9 digits starting with 6-9)
    const operatorCode = digitsAfterPrefix.substring(0, 2);
    const validOperatorCodes = ['61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '72', '73', '74', '75', '76', '77', '78', '79'];
    
    if (!validOperatorCodes.includes(operatorCode)) {
      return 'Invalid Tanzanian phone number format';
    }
    
    return ''; // No error
  };

  // Handle phone number input change
  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(text);
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
    
    // Auto-format: ensure it starts with 255
    if (text.length === 1 && !text.startsWith('255')) {
      if (text === '0') {
        setPhoneNumber('255');
      }
    }
  };

  // Fetch product price on components mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/price/${orderReference}`);
        setPrice(response.data.price);
        setProductId(response.data.productid);
      } catch (error) {
        console.error('Failed to fetch price:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, [orderReference]);

  // Fetch payment status 
  useEffect(() => {
    const FetchPaymentStatus = async () => {
      try {
        if (!productid) return;
        setLoading(true);
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.log("No token found");
          return;
        }
        const response = await axios.post(`${BASE_URL}/api/checkpayment`, 
          { productid },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response.data.hasPaid) {
          setIsPaid(true);
        }
      } catch (error) {
        if (error.response?.data?.error) {
          Alert.alert("Error", error.response.data.error);
        } else {
          console.error("Error checking payment:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    FetchPaymentStatus();
  }, [productid]);

  // Fetch Images By Product ID
  const fetchImagesByProductId = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      console.log("No token");
      return [];
    }
    try {
      const response = await axios.get(
        `${BASE_URL}/api/images/${productid}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.images || [];
    } catch (err) {
      console.error("Error fetching image list:", err);
      return [];
    }
  };

  // Show phone number modal before payment
  const initiatePayment = () => {
    setPhoneModalVisible(true);
    setPhoneError('');
    setPhoneNumber('');
  };

  // Handle payment for ALL images
  const handlePayment = async () => {
    // Validate phone number format before proceeding
    const validationError = validatePhoneNumber(phoneNumber);
    if (validationError) {
      setPhoneError(validationError);
      return;
    }

    setPhoneModalVisible(false);
    setIsProcessing(true);
    
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No token");
        return;
      }
      const response = await axios.post(`${BASE_URL}/api/pay`, {
        productid,
        amount: price,
        phoneNumber: phoneNumber.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {

        
        Toast.show({
                 type: 'success',
                 text2: response.data.message
               });
               navigation.navigate('PaymentProcessingScreen')
      } 
    }  catch (err) {
  //console.error('Payment request failed');

  if (err.response) {
    Toast.show({
                 type: 'error',
                 text2: err.response?.data?.message
               });
  } else if (err.request) {
    // The request was made but no response was received
      Toast.show({
                 type: 'error',
                 text2: 'No response from server. Check your internet connection.'
               });
   

   
  } else {
    // // Something else happened in setting up the request
    // console.error('Error Message:', err.message);

    // Alert.alert('Error', err.message);
     Toast.show({
                 type: 'error',
                 text2: 'Something went Wrong,Try Again Later'
               });
  }

 // console.error('Full Error:', err);
}
 finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!isPaid) {
      Alert.alert('Payment Required', 'You need to complete payment first.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access storage is required to download images');
        return;
      }

      const images = await fetchImagesByProductId();
      if (images.length === 0) {
        Alert.alert('No images', 'No images found for this product');
        return;
      }

      for (let img of images) {
        try {
          const fileName = img.title ? img.title : `image_${img.id}`;
          const image_url = `${BASE_URL}/${img.path}`;
          const extension = image_url.match(/\.(\w+)(?:\?|$)/);
const fileExt = extension ? extension[1] : 'jpg';
const safeFileName = `${fileName}.${fileExt}`;

          const fileUri = FileSystem.documentDirectory + safeFileName;
          const downloadResult = await FileSystem.downloadAsync(image_url, fileUri);
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

          const album = await MediaLibrary.getAlbumAsync("Downloads");
          if (album == null) {
            await MediaLibrary.createAlbumAsync("Downloads", asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
        } catch (singleError) {
          console.error("Failed to download/save image:", singleError);
        }
      }

      Alert.alert('Download Complete', 'All Media(s) have been downloaded successfully.');
    } catch (err) {
      console.error(err);
      Alert.alert('Download Error', 'Could not download images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render each image with watermark overlay
const renderItem = ({ item,index }) => {
  const fileUri = item.image?.uri || `${BASE_URL}/${item.path}`;
  const isVideo =
    item.fileType === 'video' ||
    fileUri.match(/\.(mp4|mov|avi|mkv)$/i);

  return (
    <View style={styles.imageWrapper}>
      {isVideo ? (
        <Video
        ref={(ref) => (videoRefs.current[index] = ref)}
          source={{ uri: fileUri }}
          style={styles.image}
          resizeMode="cover"
           shouldPlay ={currentIndex === index}// 👈 auto-play when visible
          isLooping // 👈 loop continuously
          useNativeControls={true}
          
        />
      ) : (
        <Image
          source={{ uri: fileUri }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* 🔒 Add watermark overlay if not paid */}
      {!isPaid && (
        <View style={styles.watermarkContainer}>
          <View style={styles.watermark}>
            <Ionicons name="lock-closed" size={24} color="#fff" />
            <Text style={styles.watermarkText}>PREVIEW</Text>
          </View>
        </View>
      )}
    </View>
  );
};


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={products}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
          onScroll={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
        />
        
        {/* Image counter */}
        <View style={styles.imageCounter}>
          <Text style={styles.counterText}>{currentIndex + 1}/{products.length}</Text>
        </View>

        {/* Pagination dots */}
        <View style={styles.dots}>
          {products.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot
              ]}
            />
          ))}
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.productTitle}>Product Collection</Text>
        <Text style={styles.productDescription}>
          {products.length} media file(s) (images/videos) available for download after purchase
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price:</Text>
          <Text style={styles.price}>{price}</Text>
        </View>
        
        {/* Processing charges message */}
        <View style={styles.chargesNote}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.chargesText}>Processing charges will be added</Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {!isPaid ? (
          <TouchableOpacity 
            style={[styles.payButton, isProcessing && styles.disabledButton]} 
            onPress={initiatePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="refresh" size={20} color="#fff" style={styles.spinning} />
                <Text style={styles.payButtonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="lock-open" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Unlock All Medias</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.downloadButton, isProcessing && styles.disabledButton]} 
            onPress={handleDownloadAll}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="refresh" size={20} color="#fff" style={styles.spinning} />
                <Text style={styles.downloadButtonText}>Preparing Downloads...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Download All</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Phone Number Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={phoneModalVisible}
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Phone Number</Text>
            <Text style={styles.modalSubtitle}>We need your phone number to process the payment</Text>
            
            <TextInput
              style={[styles.phoneInput, phoneError && styles.phoneInputError]}
              placeholder="e.g., 255712345678"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              autoFocus={true}
              maxLength={12}
            />
            
            {phoneError ? (
              <Text style={styles.errorText}>
                <Ionicons name="warning" size={14} color="#ff3b30" /> {phoneError}
              </Text>
            ) : (
              <Text style={styles.helperText}>
                Format: 255 followed by 9 digits (e.g., 255712345678)
              </Text>
            )}
            
            <Text style={styles.chargesNoteModal}>
              <Ionicons name="information-circle" size={16} color="#666" />
              Processing charges will be added to your payment
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPhoneModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, phoneError && styles.disabledConfirmButton]}
                onPress={handlePayment}
                disabled={!!phoneError}
              >
                <Text style={styles.confirmButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProductScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#fff',
    marginTop:22,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4a6bff',
  },
  placeholder: {
    width: 36,
  },
  carouselContainer: {
    height: height * 0.45,
    position: 'relative',
  },
  imageWrapper: {
    width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  watermarkText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    margin: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2ecc71',
  },
  chargesNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  chargesText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  payButton: {
    backgroundColor: '#3498db',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  downloadButton: {
    backgroundColor: '#2ecc71',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spinning: {
    transform: [{ rotate: '0deg' }],
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  phoneInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  chargesNoteModal: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
   phoneInputError: {
    borderColor: '#ff3b30',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  disabledConfirmButton: {
    backgroundColor: '#cccccc',
  },
});