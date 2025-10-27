import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, TextInput, FlatList, SafeAreaView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert,ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Video } from 'expo-av';
import CustomActivityIndicator from './CustomActivityIndicator';

import BASE_URL from './Config';


export default function DashboardScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // 🔁 Refresh state
  const [profileImage, setProfileImage] = useState(null);
  

  const currentHour = new Date().getHours();
  let greeting;
  if (currentHour < 12) {
    greeting = 'Good Morning';
  } else if (currentHour < 18) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  
 useFocusEffect(
    useCallback(() => {
      fetchDashboardData(); // Refresh every time dashboard is focused
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('No token found');
        return;
      }
      const res = await axios.get(
        `${BASE_URL}/api/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDashboardData(res.data);
      setLoading(false);
      setProfileImage(`${BASE_URL}/${res.data.profileimage.replace(/\\/g, '/')}`);

      //console.log(res.data.profileimage);
        
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  // handle delete order
 
const handleDeleteOrder = (productId) => {
  Alert.alert(
    'Delete Confirmation',
    'Are you sure you want to delete this order?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
              console.warn('No token found');
              return;
            }

            const response = await axios.delete(
              `${BASE_URL}/api/orders/${productId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.data.message === 'Order deleted successfully') {
              //Alert.alert('Success', 'Order deleted successfully.');
              Toast.show({
                       type: 'success',
                       text2: 'Order deleted successfully',
                     });
            }

            // Refresh the dashboard
            await fetchDashboardData();
          } catch (error) {
            //console.error('Error deleting order:', error);
            //Alert.alert('Error', 'Failed to delete the order. Please try again.');
            Toast.show({
                       type: 'error',
                       text2: 'Failed to delete the order. Please try again',
                     });
          }
        },
      },
    ],
    { cancelable: true }
  );
};
   


  // 🔁 Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  //handle edit of the order
  // Add this function near your handleDeleteOrder function
const handleEditOrder = (order) => {
  //console.log("order", order);

  if (order.status === 'Completed') {
    Alert.alert(
      'Action Not Allowed',
      'Completed orders cannot be edited.'
    );
    return;
  }

  // Navigate to edit screen with order data
  navigation.navigate('EditOrderScreen', { 
    order: order,
    onGoBack: fetchDashboardData // Refresh data when returning from edit
  });
};


  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }
    try {
      setLoading(false);
      const res = await axios.get(`${BASE_URL}/api/search?q=${text}`);
      const formatted = res.data.map(product => ({
        id: product.id,
        fileType:product.fileType,
        
        image: { uri: `${BASE_URL}/${product.path.replace(/\\/g, '/')}` }
      }));
      setSearchResults(formatted);
      //console.log("Formatted Search Result",formatted);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };
if (loading) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with subtle animation */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={[styles.skeletonShimmer, { width: 120, height: 18, marginBottom: 8 }]} />
            <View style={[styles.skeletonShimmer, { width: 180, height: 28 }]} />
          </View>
          <View style={[styles.skeletonShimmer, { width: 50, height: 50, borderRadius: 25 }]} />
        </View>

        {/* Search Bar */}
        <View style={[styles.skeletonShimmer, { height: 50, borderRadius: 10, marginBottom: 20 }]} />

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statCardSkeleton}>
            <View style={[styles.skeletonShimmer, { width: 40, height: 24, marginBottom: 8 }]} />
            <View style={[styles.skeletonShimmer, { width: 60, height: 14 }]} />
          </View>
          <View style={styles.statCardSkeleton}>
            <View style={[styles.skeletonShimmer, { width: 60, height: 24, marginBottom: 8 }]} />
            <View style={[styles.skeletonShimmer, { width: 70, height: 14 }]} />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCardSkeleton}>
            <View style={[styles.skeletonShimmer, { width: 50, height: 24, marginBottom: 8 }]} />
            <View style={[styles.skeletonShimmer, { width: 50, height: 14 }]} />
          </View>
          <View style={styles.statCardSkeleton}>
            <View style={[styles.skeletonShimmer, { width: 55, height: 24, marginBottom: 8 }]} />
            <View style={[styles.skeletonShimmer, { width: 65, height: 14 }]} />
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={[styles.skeletonShimmer, { width: 150, height: 20, marginBottom: 15 }]} />

        {/* Order List */}
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.orderCardSkeleton}>
            <View style={styles.orderInfoSkeleton}>
              <View style={[styles.skeletonShimmer, { width: '70%', height: 16, marginBottom: 8 }]} />
              <View style={[styles.skeletonShimmer, { width: '50%', height: 12 }]} />
            </View>
            <View style={styles.orderMetaSkeleton}>
              <View style={[styles.skeletonShimmer, { width: 80, height: 14, marginBottom: 8 }]} />
              <View style={[styles.skeletonShimmer, { width: 60, height: 16 }]} />
              <View style={styles.orderActionsSkeleton}>
                <View style={[styles.skeletonShimmer, { width: 20, height: 20, borderRadius: 10 }]} />
                <View style={[styles.skeletonShimmer, { width: 20, height: 20, borderRadius: 10 }]} />
              </View>
            </View>
          </View>
        ))}

        {/* Bottom Navigation */}
        <View style={styles.bottomMenu}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.menuItemSkeleton}>
              <View style={[styles.skeletonShimmer, { width: 24, height: 24, borderRadius: 12 }]} />
              <View style={[styles.skeletonShimmer, { width: 40, height: 12, marginTop: 4 }]} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
  // Show All the Other Data if not loading
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.username}>{dashboardData?.name}, {Number(dashboardData?.haseverloggedin) === 0 ? 'Welcome' : 'Welcome Back'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by ID "
            placeholderTextColor="#4a6bff"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#aaa" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(searchQuery)}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
{/* Search Results */}
{searchQuery.trim() !== '' && (
  <View style={styles.searchResultsContainer}>
    <Text style={styles.sectionTitle}>Search Results</Text>

    {searchResults.length > 0 ? (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // 🔥 grid layout

        renderItem={({ item }) => {
          const isVideo =
            item.fileType === 'video' ||
            (item.image.uri && item.image.uri.match(/\.(mp4|mov|mkv)$/i));

          return (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() =>
                navigation.navigate('Product', {
                  products: searchResults, // all results
                  orderReference: item.id, // use clicked product
                })
              }
            >
              {/* ✅ Conditionally render image or video */}
              {isVideo ? (
                <Video
                  source={{ uri: item.image.uri?.startsWith('http') ? item.image.uri : `${item.image.uri}` }}
                  style={styles.productMedia}
                  resizeMode="cover"
                  shouldPlay={false}
                  useNativeControls={false}
                  isLooping
                />
              ) : (
                <Image
                  source={{ uri: item.image.uri?.startsWith('http') ? item.image.uri : `${item.image.uri}` }}
                  style={styles.productMedia}
                  resizeMode="cover"
                />
              )}

              <Text style={styles.productPrice}>
                {item.price || 'Preview Only'}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.gridList}
        showsVerticalScrollIndicator={false}
      />
    ) : (
      <Text style={styles.noResultsText}>No results found.</Text>
    )}
  </View>
)}


        {/* Stats & Orders */}
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.sectionTitle}>Dashboard Stats</Text>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#4a6bff' }]}>
              <Text style={styles.statValue}>{dashboardData?.activeOrders}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#6c5ce7' }]}>
              <Text style={styles.statValue}>Tsh {dashboardData?.monthlyRevenue?.toFixed(2)}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
         
          </View>

          {/* duplicate views */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#4a6bff' }]}>
              <Text style={styles.statValue}>Tsh {dashboardData?.todayRevenue?.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#6c5ce7' }]}>
              <Text style={styles.statValue}>Tsh {dashboardData?.weeklyRevenue?.toFixed(2)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
          {/* end of duplicate views */}

          {dashboardData?.orders?.length > 0 && (
              <Text style={styles.sectionTitle}>Recent Orders</Text>
          )}

        
          {/* In the order card section */}
{dashboardData?.orders?.map(order => (
  <TouchableOpacity key={order.product_id} style={styles.orderCard}>
    <View style={styles.orderInfo}>
      <Text style={styles.orderClient}>{order.clientname}</Text>
      <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleString()}</Text>
    </View>

    <View style={styles.orderMeta}>
      <Text style={[
        styles.orderStatus,
        { color: order.status === 'Completed' ? '#2ecc71' : '#f39c12' }
      ]}>
        {order.status}
      </Text>
      <Text style={styles.orderAmount}>Tsh: {order.price}</Text>

      {/* Action Buttons Container */}
      <View style={styles.orderActions}>
        {/* Edit Button */}
        <TouchableOpacity 
          onPress={() => handleEditOrder(order)}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={18} color="#3498db" />
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity 
          onPress={() => handleDeleteOrder(order.product_id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
))}
        </ScrollView>

       {/* Bottom Menu */}
<View style={styles.bottomMenu}>
  {/* <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('Dashboard')}
  >
    <Ionicons name="home" size={20} color="#4a6bff" />
    <Text style={styles.menuText}>Home</Text>
  </TouchableOpacity> */}

  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('NewOrder')}
  >
    <Ionicons name="add-circle" size={20} color="#4a6bff" />
    <Text style={styles.menuText}>New Order</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('FeedScreen')}
  >
    <Ionicons name="people" size={20} color="#4a6bff" />
    <Text style={styles.menuText}>Discover</Text>
  </TouchableOpacity>

 

</View>
      </View>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 25,
  },
  greeting: {
    fontSize: 18,
    color: '#666',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a6bff',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginHorizontal: 6,
  },
  searchButton: {
    backgroundColor: '#4a6bff',
    borderRadius: 8,
    padding: 10,
  },
  searchResultsContainer: {
    marginBottom: 20,
  },
  searchResultsList: {
    paddingVertical: 10,
  },
  noResultsText: {
    paddingVertical: 10,
    fontStyle: 'italic',
    color: '#999',
  },
  productCard: {
  flex: 1,
  margin: 8,
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
  productImage: {
  width: '100%',
  height: 150,
  borderRadius: 8,
  marginBottom: 8,
},
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#4a6bff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: '48%',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#eee',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  orderInfo: {},
  orderClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  menuItem: {
    alignItems: 'center',
  },
  menuText: {
    fontSize: 12,
    color: '#4a6bff',
    marginTop: 4,
  },
   center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gridList: {
  paddingBottom: 20,
},
orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 15, // Space between buttons
  },
  editButton: {
    padding: 5,
  },
  
  deleteButton: {
    padding: 5,
  },
  productMedia: {
  width: '100%',
  height: 150,
  borderRadius: 10,
 // looks nice for videos
},

//added styles
// Add these to your styles
skeletonShimmer: {
  backgroundColor: '#f0f0f0',
  borderRadius: 4,
  overflow: 'hidden',
},
statCardSkeleton: {
  width: '48%',
  backgroundColor: '#f8f9fa',
  borderRadius: 15,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
},
orderActionsSkeleton: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: 10,
  gap: 15,
},

});
