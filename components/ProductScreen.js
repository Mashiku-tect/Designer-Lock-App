import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Dimensions, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  StatusBar, 
  Modal, 
  TextInput,
  Animated
} from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [mediaLoading, setMediaLoading] = useState({}); // Track individual media loading
  const [mediaErrors, setMediaErrors] = useState({}); // Track media loading errors
  const videoRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Combined data fetching to prevent double rendering
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch price and product ID first
        const priceResponse = await axios.get(`${BASE_URL}/api/price/${orderReference}`);
        setPrice(priceResponse.data.price);
        const productId = priceResponse.data.productid;
        setProductId(productId);

        // Then check payment status with the product ID
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          const paymentResponse = await axios.post(
            `${BASE_URL}/api/checkpayment`, 
            { productid: productId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setIsPaid(paymentResponse.data.hasPaid);
        }

        // Fade in animation when data is ready
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

      } catch (error) {
        console.error('Failed to fetch data:', error);
        let errorMessage = 'Failed to load product details';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please check your connection.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (!error.response) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderReference) {
      fetchAllData();
    }
  }, [orderReference]);

  // Validate phone number format
  const validatePhoneNumber = (number) => {
    const cleanedNumber = number.trim();
    
    if (!cleanedNumber.startsWith('255')) {
      return 'Phone number must start with 255';
    }
    
    if (cleanedNumber.length !== 12) {
      return 'Phone number must be 12 digits (255 followed by 9 digits)';
    }
    
    const digitsAfterPrefix = cleanedNumber.substring(3);
    if (!/^\d+$/.test(digitsAfterPrefix)) {
      return 'Phone number must contain only digits after 255';
    }
    
    const operatorCode = digitsAfterPrefix.substring(0, 2);
    const validOperatorCodes = ['61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '72', '73', '74', '75', '76', '77', '78', '79'];
    
    if (!validOperatorCodes.includes(operatorCode)) {
      return 'Invalid Tanzanian phone number format';
    }
    
    return '';
  };

  // Handle phone number input change
  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(text);
    if (phoneError) setPhoneError('');
    
    if (text.length === 1 && !text.startsWith('255')) {
      if (text === '0') {
        setPhoneNumber('255');
      }
    }
  };

  // Handle media load start
  const handleMediaLoadStart = (index) => {
    setMediaLoading(prev => ({ ...prev, [index]: true }));
    setMediaErrors(prev => ({ ...prev, [index]: false }));
  };

  // Handle media load end
  const handleMediaLoadEnd = (index) => {
    setMediaLoading(prev => ({ ...prev, [index]: false }));
  };

  // Handle media error
  const handleMediaError = (index, error) => {
    console.error(`Media loading error at index ${index}:`, error);
    setMediaLoading(prev => ({ ...prev, [index]: false }));
    setMediaErrors(prev => ({ ...prev, [index]: true }));
  };

  // Fetch Images By Product ID
  const fetchImagesByProductId = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return [];
    
    try {
      const response = await axios.get(
        `${BASE_URL}/api/images/${productid}`, 
        { headers: { Authorization: `Bearer ${token}` } }
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
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please login to make payment'
        });
        return;
      }

      const response = await axios.post(`${BASE_URL}/api/pay`, {
        productid,
        amount: price,
        phoneNumber: phoneNumber.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message
        });
        navigation.navigate('PaymentProcessingScreen');
      }
    } catch (err) {
      let errorMessage = 'Something went wrong. Try again later.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.request) {
        errorMessage = 'No response from server. Check your internet connection.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: errorMessage
      });
    } finally {
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

      let successCount = 0;
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
          successCount++;
        } catch (singleError) {
          console.error("Failed to download/save image:", singleError);
        }
      }

      if (successCount > 0) {
        Alert.alert(
          'Download Complete', 
          `${successCount} out of ${images.length} media file(s) downloaded successfully.`
        );
      } else {
        Alert.alert('Download Failed', 'Could not download any files. Please try again.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Download Error', 'Could not download images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render skeleton loader for media
  const renderMediaSkeleton = () => (
    <View style={styles.mediaSkeleton}>
      <ActivityIndicator size="large" color="#4a6bff" />
      <Text style={styles.skeletonText}>Loading media...</Text>
    </View>
  );

  // Render media error state
  const renderMediaError = () => (
    <View style={styles.mediaError}>
      <Ionicons name="warning" size={48} color="#ff6b6b" />
      <Text style={styles.errorText}>Failed to load media</Text>
      <Text style={styles.errorSubtext}>Please check your connection</Text>
    </View>
  );

  // Render each image with watermark overlay
  const renderItem = ({ item, index }) => {
    const fileUri = item.image?.uri || `${BASE_URL}/${item.path}`;
    const isVideo = item.fileType === 'video' || fileUri.match(/\.(mp4|mov|avi|mkv)$/i);
    const isLoading = mediaLoading[index];
    const hasError = mediaErrors[index];

    return (
      <View style={styles.imageWrapper}>
        {isVideo ? (
          <View style={styles.videoContainer}>
            <Video
              ref={(ref) => (videoRefs.current[index] = ref)}
              source={{ uri: fileUri }}
              style={styles.image}
              resizeMode="cover"
              shouldPlay={currentIndex === index}
              isLooping
              useNativeControls={false}
              onLoadStart={() => handleMediaLoadStart(index)}
              onLoad={() => handleMediaLoadEnd(index)}
              onError={(error) => handleMediaError(index, error)}
            />
            {isLoading && renderMediaSkeleton()}
            {hasError && renderMediaError()}
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: fileUri }}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={() => handleMediaLoadStart(index)}
              onLoadEnd={() => handleMediaLoadEnd(index)}
              onError={(error) => handleMediaError(index, error)}
            />
            {isLoading && renderMediaSkeleton()}
            {hasError && renderMediaError()}
          </View>
        )}

        {/* Watermark overlay if not paid */}
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

  // Render loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#4a6bff" />
          <Text style={styles.loadingTitle}>Loading Product</Text>
          <Text style={styles.loadingSubtitle}>Please wait...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Image Carousel */}
      <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={products}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          keyExtractor={(item, index) => `${item.id}_${index}`}
          showsHorizontalScrollIndicator={false}
          onScroll={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          initialNumToRender={1}
          maxToRenderPerBatch={3}
          windowSize={3}
        />
        
        {/* Image counter */}
        <View style={styles.imageCounter}>
          <Text style={styles.counterText}>{currentIndex + 1}/{products.length}</Text>
        </View>

        {/* Pagination dots */}
        {products.length > 1 && (
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
        )}
      </Animated.View>

      {/* Product Info */}
      <Animated.View style={[styles.infoContainer, { opacity: fadeAnim }]}>
        <View style={styles.statusBadge}>
          <Ionicons 
            name={isPaid ? "checkmark-circle" : "lock-closed"} 
            size={16} 
            color={isPaid ? "#2ecc71" : "#e74c3c"} 
          />
          <Text style={[styles.statusText, { color: isPaid ? "#2ecc71" : "#e74c3c" }]}>
            {isPaid ? "Purchased" : "Locked"}
          </Text>
        </View>

        <Text style={styles.productTitle}>Premium Collection</Text>
        <Text style={styles.productDescription}>
          {products.length} high-quality media file(s) available for download
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price:</Text>
          <View style={styles.priceWrapper}>
            <Text style={styles.price}>{price} TZS</Text>
            {!isPaid && (
              <Text style={styles.originalPrice}>{parseInt(price) + 500} TZS</Text>
            )}
          </View>
        </View>
        
        <View style={styles.chargesNote}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.chargesText}>
            {isPaid ? "You have full access to download all media" : "Processing charges will be added"}
          </Text>
        </View>
      </Animated.View>

      {/* Action Button */}
      <Animated.View style={[styles.actionContainer, { opacity: fadeAnim }]}>
        {!isPaid ? (
          <TouchableOpacity 
            style={[styles.payButton, isProcessing && styles.disabledButton]} 
            onPress={initiatePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.payButtonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="lock-open" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Unlock All Media</Text>
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
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.downloadButtonText}>Preparing Downloads...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Download All ({products.length})</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Phone Number Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={phoneModalVisible}
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Phone Number</Text>
              <TouchableOpacity 
                onPress={() => setPhoneModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>We'll send a payment request to this number</Text>
            
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <TextInput
                style={[styles.phoneInput, phoneError && styles.phoneInputError]}
                placeholder="255712345678"
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
                  Format: 255 followed by 9 digits
                </Text>
              )}
            </View>
            
            <View style={styles.paymentSummary}>
              <Text style={styles.summaryTitle}>Payment Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product Price</Text>
                <Text style={styles.summaryValue}>{price} TZS</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Processing Fee</Text>
                <Text style={styles.summaryValue}>500 TZS</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{parseInt(price) + 500} TZS</Text>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPhoneModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, (phoneError || !phoneNumber) && styles.disabledConfirmButton]}
                onPress={handlePayment}
                disabled={!!phoneError || !phoneNumber}
              >
                <Text style={styles.confirmButtonText}>
                  Pay {parseInt(price) + 500} TZS
                </Text>
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
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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
    marginTop: 0,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4a6bff',
  },
  placeholder: {
    width: 36,
  },
  carouselContainer: {
    height: height * 0.45,
    position: 'relative',
    backgroundColor: '#000',
  },
  imageWrapper: {
    width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  mediaSkeleton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  skeletonText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  mediaError: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
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
    fontSize: 90,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
  priceWrapper: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2ecc71',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  chargesNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  chargesText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  phoneInputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  phoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  phoneInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  phoneInputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 8,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  paymentSummary: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2ecc71',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledConfirmButton: {
    backgroundColor: '#cccccc',
  },
});