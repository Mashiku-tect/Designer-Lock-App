import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import BASE_URL from './Config';

const { width: screenWidth } = Dimensions.get('window');

const FollowersFollowingScreen = ({ route, navigation }) => {
  const { userId, receivedactivetab } = route.params;
  const [activeTab, setActiveTab] = useState(receivedactivetab || 'followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [designerName, setDesignername] = useState(null);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState({});
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await axios.get(`${BASE_URL}/api/followfollower/${userId}`, {
        timeout: 10000
      });
      
      setFollowers(response.data.followers || []);
      setFollowing(response.data.following || []);
      setDesignername(response.data.designername);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error('Error fetching followers/following:', error);
      
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
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Refresh function
  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    fetchData(true);
  };

  // Debounced search function
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timeoutId = setTimeout(() => {
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // Follow or unfollow a user
  const FollowDesigner = async (designerId, tab) => {
    try {
      setFollowLoading(prev => ({ ...prev, [designerId]: true }));

      // Optimistically update UI first
      if (tab === 'followers') {
        setFollowers(prev =>
          prev.map(user =>
            user.id === designerId ? { ...user, isFollowing: !user.isFollowing } : user
          )
        );
      } else if (tab === 'following') {
        setFollowing(prev =>
          prev.map(user =>
            user.id === designerId ? { ...user, isFollowing: !user.isFollowing } : user
          )
        );
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login to follow designers');
        return;
      }

      await axios.post(
        `${BASE_URL}/api/designers/toggle-follow/${designerId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

    } catch (error) {
      console.error('Error following/unfollowing designer:', error);

      // Revert UI if API fails
      if (tab === 'followers') {
        setFollowers(prev =>
          prev.map(user =>
            user.id === designerId ? { ...user, isFollowing: !user.isFollowing } : user
          )
        );
      } else if (tab === 'following') {
        setFollowing(prev =>
          prev.map(user =>
            user.id === designerId ? { ...user, isFollowing: !user.isFollowing } : user
          )
        );
      }

      let errorMessage = 'Failed to follow/unfollow designer. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Please login to follow users';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setFollowLoading(prev => ({ ...prev, [designerId]: false }));
    }
  };

  const currentData = activeTab === 'followers' ? followers : following;

  // Robust search filter with null checks
  const filteredData = currentData.filter((item) => {
    if (!item) return false;
    
    const name = item.name?.toLowerCase() || '';
    const username = item.username?.toLowerCase() || '';
    const bio = item.bio?.toLowerCase() || '';
    const query = searchQuery.toLowerCase().trim();
    
    return name.includes(query) || username.includes(query) || bio.includes(query);
  });

  const handleUserPress = (userId) => {
    navigation.navigate('FeedProfileScreen', { designer: userId });
  };

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

  const renderUserItem = ({ item }) => (
    <Animated.View 
      style={[
        styles.userItem,
        { opacity: fadeAnim }
      ]}
    >
      <TouchableOpacity 
        style={styles.userLeft}
        onPress={() => handleUserPress(item.id)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar} 
          defaultSource={require('../assets/profile-placeholder.png')}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.userUsername}>
            {item.bio || item.username || 'No bio'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing && styles.followingButton,
          followLoading[item.id] && styles.disabledButton
        ]}
        onPress={() => FollowDesigner(item.id, activeTab)}
        disabled={followLoading[item.id]}
      >
        {followLoading[item.id] ? (
          <ActivityIndicator size="small" color={item.isFollowing ? "#666" : "#fff"} />
        ) : (
          <Text style={[
            styles.followButtonText,
            item.isFollowing && styles.followingButtonText,
          ]}>
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyComponent = () => {
    if (loading) {
      return renderSkeletonList();
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="error-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Unable to Load Data</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchData()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (searchQuery.trim() !== '' && filteredData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search-off" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>
            No {activeTab} match "{searchQuery}"
          </Text>
        </View>
      );
    }

    if (currentData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No {activeTab} yet</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'followers' 
              ? "When someone follows you, you'll see them here." 
              : "When you follow someone, you'll see them here."}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="#4a6bff" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>{designerName}</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab} • {currentData.length}
        </Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
        onPress={() => handleTabChange('followers')}
      >
        <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
          Followers
        </Text>
        <View style={[
          styles.countContainer,
          loading && styles.countContainerLoading
        ]}>
          {loading ? (
            <ActivityIndicator size="small" color="#999" />
          ) : (
            <Text style={styles.countText}>{followers.length}</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'following' && styles.activeTab]}
        onPress={() => handleTabChange('following')}
      >
        <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
          Following
        </Text>
        <View style={[
          styles.countContainer,
          loading && styles.countContainerLoading
        ]}>
          {loading ? (
            <ActivityIndicator size="small" color="#999" />
          ) : (
            <Text style={styles.countText}>{following.length}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={`Search ${activeTab}...`}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
        clearButtonMode="while-editing"
      />
      {searchLoading && (
        <ActivityIndicator size="small" color="#007AFF" style={styles.searchLoading} />
      )}
      {searchQuery.length > 0 && !searchLoading && (
        <TouchableOpacity 
          onPress={() => setSearchQuery('')}
          style={styles.clearButton}
        >
          <Icon name="close" size={20} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResultsCount = () => {
    if (filteredData.length > 0 && searchQuery) {
      return (
        <Text style={styles.resultsCount}>
          {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'} found
        </Text>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {renderHeader()}
      {renderTabs()}
      {renderSearchBar()}

      {/* User List */}
      <FlatList
        data={filteredData}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[
          styles.flatListContent,
          (loading || filteredData.length === 0) && styles.flatListContentEmpty
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a6bff']}
            tintColor="#4a6bff"
          />
        }
        ListHeaderComponent={renderResultsCount()}
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
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  countContainer: {
    minWidth: 20,
    alignItems: 'center',
  },
  countContainerLoading: {
    opacity: 0.5,
  },
  countText: {
    fontSize: 14,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  searchLoading: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  // User Item Styles
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#666',
  },
  disabledButton: {
    opacity: 0.6,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    width: screenWidth,
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
  // List Styles
  flatListContent: {
    flexGrow: 1,
  },
  flatListContentEmpty: {
    paddingHorizontal: 0,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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

export default FollowersFollowingScreen;