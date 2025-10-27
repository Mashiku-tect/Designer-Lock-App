import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  SafeAreaView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './Config';

const { width: screenWidth } = Dimensions.get('window');

const FollowScreen = ({ route, navigation }) => {
  const { designerId, receivedactivetab, designername } = route.params;
  const [activeTab, setActiveTab] = useState(receivedactivetab || 'Followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState({ Followers: [], Following: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState({ Followers: null, Following: null });
  const [loggedInUserId, setLoggedinUserId] = useState(null);
  const [followLoading, setFollowLoading] = useState({});
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Fetch follows with error handling
  const fetchFollows = async (type, isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      setError(prev => ({ ...prev, [type]: null }));
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError(prev => ({ ...prev, [type]: 'Please login to view follows' }));
        return;
      }

      const res = await axios.get(
        `${BASE_URL}/api/follower/${designerId}/following/${type.toLowerCase()}`, 
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      setUsers((prev) => ({ ...prev, [type]: res.data.data || [] }));
      setLoggedinUserId(res.data.loggedInUserId);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error("Fetch error:", error);
      
      let errorMessage = 'Failed to load data. Please try again.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(prev => ({ ...prev, [type]: errorMessage }));
      setUsers((prev) => ({ ...prev, [type]: [] }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFollows("Followers");
    fetchFollows("Following");
  }, [designerId]);

  // Refresh function
  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    fetchFollows("Followers", true);
    fetchFollows("Following", true);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleFollowToggle = async (userId, listType) => {
    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));
      
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(
        `${BASE_URL}/api/designers/toggle-follow/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) => ({
        ...prev,
        [listType]: prev[listType].map((user) =>
          user.id === userId 
            ? { ...user, isFollowing: response.data.isFollowing } 
            : user
        ),
      }));

    } catch (error) {
      console.error("Follow toggle error:", error);
      
      let errorMessage = 'Failed to update follow status';
      if (error.response?.status === 401) {
        errorMessage = 'Please login to follow users';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Filter users based on search
  const filteredUsers = users[activeTab].filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Full-width skeleton loader
  const renderSkeletonItem = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLeft}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonTextContainer}>
          <View style={[styles.skeletonText, styles.skeletonName]} />
          <View style={[styles.skeletonText, styles.skeletonUsername]} />
        </View>
      </View>
      <View style={styles.skeletonButton} />
    </View>
  );

  // Render skeleton list
  const renderSkeletonList = () => (
    <View style={styles.skeletonList}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <View key={item}>{renderSkeletonItem()}</View>
      ))}
    </View>
  );

  // Render user item
  const renderUserItem = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.userCard,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.userLeft}>
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar} 
          defaultSource={require('../assets/profile-placeholder.png')}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.userUsername}>
            @{item.username || 'nousername'}
          </Text>
          {item.followsYou && (
            <View style={styles.followsYouBadge}>
              <Text style={styles.followsYouText}>Follows you</Text>
            </View>
          )}
        </View>
      </View>
      
      {item.id !== loggedInUserId && (
        <TouchableOpacity
          style={[
            styles.followButton, 
            item.isFollowing && styles.followingButton,
            followLoading[item.id] && styles.disabledButton
          ]}
          onPress={() => handleFollowToggle(item.id, activeTab)}
          disabled={followLoading[item.id]}
        >
          {followLoading[item.id] ? (
            <ActivityIndicator size="small" color={item.isFollowing ? "#666" : "#fff"} />
          ) : (
            <Text style={[
              styles.followButtonText,
              item.isFollowing && styles.followingButtonText,
            ]}>
              {item.isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (loading) {
      return renderSkeletonList();
    }

    if (error[activeTab]) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Unable to Load {activeTab}</Text>
          <Text style={styles.errorSubtitle}>{error[activeTab]}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchFollows(activeTab)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (searchQuery) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No users found</Text>
          <Text style={styles.emptyStateSubText}>
            Try adjusting your search terms
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={64} color="#ccc" />
        <Text style={styles.emptyStateText}>
          No {activeTab.toLowerCase()} yet
        </Text>
        <Text style={styles.emptyStateSubText}>
          {activeTab === 'Followers' 
            ? 'When someone follows this designer, they will appear here.'
            : 'When this designer follows someone, they will appear here.'
          }
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{designername}</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab} • {users[activeTab].length}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['Followers', 'Following'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
            <View style={[
              styles.tabCount, 
              loading && styles.tabCountLoading
            ]}>
              {loading ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <Text style={styles.tabCountText}>{users[tab].length}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab.toLowerCase()}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          loading && styles.listContentLoading
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a6bff']}
            tintColor="#4a6bff"
          />
        }
        ListHeaderComponent={
          filteredUsers.length > 0 && (
            <Text style={styles.resultsCount}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6bff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerSpacer: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabCount: {
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountLoading: {
    opacity: 0.5,
  },
  tabCountText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  listContentLoading: {
    paddingHorizontal: 0, // Remove horizontal padding for full-width skeletons
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  // User Card Styles
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  followsYouBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  followsYouText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#ddd',
  },
  disabledButton: {
    opacity: 0.6,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followingButtonText: {
    color: '#000',
  },
  // Full-width Skeleton Styles
  skeletonList: {
    flex: 1,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    width: screenWidth, // Full width
  },
  skeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  skeletonTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonText: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonName: {
    width: '60%',
    height: 16,
    marginBottom: 8,
  },
  skeletonUsername: {
    width: '40%',
    height: 14,
  },
  skeletonButton: {
    width: 80,
    height: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4a6bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FollowScreen;