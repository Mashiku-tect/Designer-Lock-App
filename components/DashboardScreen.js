import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, TextInput, FlatList, SafeAreaView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';


export default function DashboardScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // 🔁 Refresh state

  const currentHour = new Date().getHours();
  let greeting;
  if (currentHour < 12) {
    greeting = 'Good Morning';
  } else if (currentHour < 18) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('No token found');
        return;
      }
      const res = await axios.get(
        'https://6d278b6c5fda.ngrok-free.app/api/dashboard',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDashboardData(res.data);
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
              `https://6d278b6c5fda.ngrok-free.app/api/orders/${productId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.data.message === 'Order deleted successfully') {
              Alert.alert('Success', 'Order deleted successfully.');
            }

            // Refresh the dashboard
            await fetchDashboardData();
          } catch (error) {
            console.error('Error deleting order:', error);
            Alert.alert('Error', 'Failed to delete the order. Please try again.');
          }
        },
      },
    ],
    { cancelable: true }
  );
};
   

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 🔁 Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`https://6d278b6c5fda.ngrok-free.app/api/search?q=${text}`);
      const formatted = res.data.map(product => ({
        id: product.product_id,
        title: product.designtitle,
        price: "Tsh:" + product.price,
        image: { uri: `https://6d278b6c5fda.ngrok-free.app/${product.productimagepath.replace(/\\/g, '/')}` }
      }));
      setSearchResults(formatted);
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
              source={require('../assets/profile-placeholder.png')}
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
                horizontal
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productCard}
                    onPress={() => navigation.navigate('Product', { product: item })}
                  >
                    <Image source={item.image} style={styles.productImage} />
                    <Text style={styles.productTitle}>{item.title}</Text>
                    <Text style={styles.productPrice}>{item.price}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.searchResultsList}
                showsHorizontalScrollIndicator={false}
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

          <Text style={styles.sectionTitle}>Recent Orders</Text>
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

    {/* Delete Button */}
    <TouchableOpacity onPress={() => handleDeleteOrder(order.product_id)}>
      <Ionicons name="trash" size={20} color="#e74c3c" style={{ marginTop: 10 }} />
    </TouchableOpacity>
  </View>
</TouchableOpacity>

          ))}
        </ScrollView>

        {/* Bottom Menu */}
        <View style={styles.bottomMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('NewOrder')}
          >
            <Ionicons name="add-circle" size={20} color="#4a6bff" />
            <Text style={styles.menuText}>New Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('DesignersScreen')}
          >
            <Ionicons name="people" size={20} color="#4a6bff" />
            <Text style={styles.menuText}>Designers</Text>
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
    marginTop: 20,
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
    width: 150,
    marginRight: 15,
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
    height: 120,
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
});
