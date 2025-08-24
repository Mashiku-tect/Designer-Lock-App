import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Modal,
  Platform,
  Alert,
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import BASE_URL from './Config';

export default function ProductScreen({ route, navigation }) {
  const { product } = route.params || {};
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        const response = await axios.post(`${BASE_URL}/api/checkpayment`,
          {
            productId: product.id
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.hasPaid) {
          setIsPaid(true);
          //setLoading(false);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
      finally {
      setLoading(false); // ✅ Always stop spinner after the request
    }
    };

    checkPaymentStatus();
  }, []);

  const handlePayment = () => {
    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to pay ${product.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');

              if (!token) {
                Alert.alert('Authentication Error', 'User token not found.');
                return;
              }

              const response = await axios.post(
                `${BASE_URL}/api/pay`,
                {
                  productId: product.id,
                  amount: product.price.replace('Tsh:', ''),
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (response.data.success) {
                setIsPaid(true);
                Alert.alert('Success', 'Payment successful. You can now download your image.');
              } else {
                Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
              }
            } catch (error) {
              console.error('Payment error:', error);
              Alert.alert('Error', 'Could not complete payment.');
            }
          }
        }
      ]
    );
  };

  const downloadImage = async () => {
    if (downloading) return;
    
    setDownloading(true);
    
    try {
      // First we need to get the image URI
      const localUri = Image.resolveAssetSource(product.image).uri;
      
      // For Android, we need to request permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to storage to save images",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission denied", "Cannot save image without storage permission");
          return;
        }
      }
      
      // Check if we have media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission denied", "Cannot save image without media library permission");
        return;
      }
      
      // Create a filename
      const filename = localUri.split('/').pop();
      const fileExt = filename.split('.').pop();
      const newFilename = `${product.title.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      
      // Download the file
      const downloadResumable = FileSystem.createDownloadResumable(
        localUri,
        FileSystem.documentDirectory + newFilename
      );
      
      const { uri } = await downloadResumable.downloadAsync();
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Downloads', asset, false);
      
      Alert.alert("Success", "Image saved to your gallery!");
    
    
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert("Error", "Failed to download image. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const WatermarkOverlay = ({ large = false }) => (
    <View style={[styles.watermarkContainer, large && styles.largeWatermark]}>
      <Text style={[styles.watermarkText, large && styles.largeWatermarkText]}>SAMPLE</Text>
      <Text style={[styles.watermarkText, large && styles.largeWatermarkText]}>UNPAID</Text>
    </View>
  );

  if(loading){
     return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Design Preview</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isFullScreen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <SafeAreaView style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.fullScreenBackButton}
            onPress={() => setIsFullScreen(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {isPaid ? (
            <Image
              source={product.image}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : (
            <ImageBackground
              source={product.image}
              style={styles.fullScreenImage}
              resizeMode="contain"
            >
              <WatermarkOverlay large />
            </ImageBackground>
          )}
        </SafeAreaView>
      </Modal>

      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => setIsFullScreen(true)}
        activeOpacity={0.9}
      >
        {isPaid ? (
          <Image source={product.image} style={styles.productImage} />
        ) : (
          <ImageBackground source={product.image} style={styles.productImage}>
            <WatermarkOverlay />
          </ImageBackground>
        )}
      </TouchableOpacity>

      <View style={styles.productInfo}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{product.price}</Text>

        {!isPaid ? (
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePayment}>
            <Text style={styles.purchaseButtonText}>Pay to Remove Watermark</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.purchaseButton, downloading && styles.disabledButton]} 
            onPress={downloadImage}
            disabled={downloading}
          >
            <Text style={styles.purchaseButtonText}>
              {downloading ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  imageContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenBackButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 20,
    left: 20,
    zIndex: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    borderRadius: 10,
    transform: [{ rotate: '-30deg' }],
  },
  largeWatermark: {
    padding: 40,
    transform: [{ rotate: '-30deg' }, { scale: 1.5 }],
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  largeWatermarkText: {
    fontSize: 48,
  },
  productInfo: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a6bff',
    marginBottom: 20,
  },
  purchaseButton: {
    backgroundColor: '#4a6bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  purchaseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6bff',
    textAlign: 'center',
    flex: 1,
    marginLeft: -24,
  },
   center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});