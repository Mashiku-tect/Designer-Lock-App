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
  Animated,
  ToastAndroid,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import BASE_URL from './Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import { useTheme } from './ThemeContext'; 
import ThemeToggle from './ThemeToggle';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const MOBILE_MONEY_FEES = [
  { min: 100, max: 999, fee: 52 },
  { min: 1000, max: 1999, fee: 72 },
  { min: 2000, max: 2999, fee: 104 },
  { min: 3000, max: 3999, fee: 116 },
  { min: 4000, max: 4999, fee: 168 },
  { min: 5000, max: 6999, fee: 234 },
  { min: 7000, max: 7999, fee: 360 },
  { min: 8000, max: 9999, fee: 430 },
  { min: 10000, max: 14999, fee: 642 },
  { min: 15000, max: 19999, fee: 680 },
  { min: 20000, max: 29999, fee: 700 },
  { min: 30000, max: 39999, fee: 980 },
  { min: 40000, max: 49999, fee: 1038 },
  { min: 50000, max: 99999, fee: 1460 },
  { min: 100000, max: 199999, fee: 1868 },
  { min: 200000, max: 299999, fee: 2220 },
  { min: 300000, max: 399999, fee: 3180 },
  { min: 400000, max: 499999, fee: 3764 },
  { min: 500000, max: 599999, fee: 4672 },
  { min: 600000, max: 699999, fee: 5712 },
  { min: 700000, max: 799999, fee: 6560 },
  { min: 800000, max: 899999, fee: 7800 },
  { min: 900000, max: 1000000, fee: 8508 },
  { min: 1000001, max: 3000000, fee: 9346 },
  { min: 3000001, max: 5000000, fee: 9890 }
];

const ProductScreen = ({ route, navigation }) => {
  const { products = [], orderReference } = route.params || {};
  const [isPaid, setIsPaid] = useState(false);
   const { colors, isDarkMode } = useTheme(); // Add this line
          const styles = createStyles(colors, isDarkMode);
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
       // console.error('Failed to fetch data:', error);
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

        if(Platform.OS==='android'){
          ToastAndroid.show(errorMessage, ToastAndroid.LONG);
          return;
        }else{
 Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage
        });
        return;
        }
        
       
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
      if(Platform.OS==='android'){
        ToastAndroid.show('Error fetching image list', ToastAndroid.SHORT);
        return [];
      }else{
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error fetching image list'
      });
      return [];
      }
      //console.error("Error fetching image list:", err);
     // return [];
    }
  };

  //find processing charges based on price
  // Calculate mobile money fee based on amount
const calculateProcessingFee = (amount) => {
  const numericAmount = parseInt(amount);
  const feeRange = MOBILE_MONEY_FEES.find(range => 
    numericAmount >= range.min && numericAmount <= range.max
  );
  return feeRange ? feeRange.fee : 9346; // Default fee for amounts above 5,000,000
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
        if(Platform.OS==='android'){
          ToastAndroid.show('Please login to make payment', ToastAndroid.SHORT);
          return;
        }else{
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please login to make payment'
        });
        return;
      }
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
        if(Platform.OS==='android'){
          ToastAndroid.show(response.data.message, ToastAndroid.LONG);
          navigation.navigate('PaymentProcessingScreen');
          return;
        }else{
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message
        });
        navigation.navigate('PaymentProcessingScreen');
        return;
      }
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
       if(Platform.OS==='android'){
        ToastAndroid.show(errorMessage, ToastAndroid.LONG);
        return;
        }else{
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: errorMessage
      });
      return;
    }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!isPaid) {
      if(Platform.OS==='android'){
        ToastAndroid.show('You need to complete payment first.', ToastAndroid.SHORT);
        return;
      }else{
        Toast.show({
          type: 'info',
          text1: 'Payment Required',
          text2: 'You need to complete payment first.'
        });

      //Alert.alert('Payment Required', 'You need to complete payment first.');
      return;
      }
    }
    
    setIsProcessing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        if(Platform.OS==='android'){
          ToastAndroid.show('Permission to access storage is required to download images', ToastAndroid.LONG);
          return;
        }else{
          Toast.show({
            type: 'error',
            text1: 'Permission Required',
            text2: 'Permission to access storage is required to download images'
          });
        //Alert.alert('Permission required', 'Permission to access storage is required to download images');
        return;
        }
      }

      const images = await fetchImagesByProductId();
      if (images.length === 0) {
        if(Platform.OS==='android'){
          ToastAndroid.show('No images found for this product', ToastAndroid.SHORT);
          return;
        }else{
        Toast.show({
          type: 'info',
          text1: 'No Images',
          text2: 'No images found for this product'
        });

        //Alert.alert('No images', 'No images found for this product');
        return;
      }
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
        if(Platform.OS==='android'){
          ToastAndroid.show(`${successCount} out of ${images.length} media file(s) downloaded successfully.`, ToastAndroid.LONG);
          return;
        }else{
        Toast.show({
          type: 'success',
          text1: 'Download Complete',
          text2: `${successCount} out of ${images.length} media file(s) downloaded successfully.`
        });
        return;
      }
        
      } else {
        if(Platform.OS==='android'){
          ToastAndroid.show('Could not download any files. Please try again.', ToastAndroid.LONG);
          return;
        }else{
        Toast.show({
          type: 'error',
          text1: 'Download Failed',
          text2: 'Could not download any files. Please try again.'
        });
        return;
      }
        //Alert.alert('Download Failed', 'Could not download any files. Please try again.');
      }
    } catch (err) {
     // console.error(err);
      //Alert.alert('Download Error', 'Could not download images. Please try again.');
      if(Platform.OS==='android'){
        ToastAndroid.show('Could not download images. Please try again.', ToastAndroid.LONG);
        return;
      }else{
      Toast.show({
        type: 'error',
        text1: 'Download Error',
        text2: 'Could not download images. Please try again.'
      });
      return;
    }
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
      {/* <StatusBar barStyle="dark-content" /> */}
      
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
                <Text style={styles.summaryValue}>{calculateProcessingFee(price)} TZS</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{parseInt(price) + calculateProcessingFee(price)} TZS</Text>
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
                  Pay {parseInt(price) + calculateProcessingFee(price)} TZS
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

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    marginTop: 0,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  placeholder: {
    width: 36,
  },
  carouselContainer: {
    height: height * 0.45,
    position: 'relative',
    backgroundColor: colors.black,
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
    color: colors.white,
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
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtext: {
    color: colors.gray400,
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
    color: colors.white,
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
    backgroundColor: colors.white,
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
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: colors.card,
    marginTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: colors.text,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceWrapper: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  chargesNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  chargesText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  actionContainer: {
    padding: 20,
    backgroundColor: colors.card,
  },
  payButton: {
    backgroundColor: colors.info,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  downloadButton: {
    backgroundColor: colors.success,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.success,
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
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  downloadButtonText: {
    color: colors.white,
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
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.black,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
    marginBottom: 8,
  },
  phoneInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  phoneInputError: {
    borderColor: colors.error,
    backgroundColor: colors.gray50,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 8,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  paymentSummary: {
    padding: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  confirmButton: {
    backgroundColor: colors.info,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledConfirmButton: {
    backgroundColor: colors.gray400,
  },
});