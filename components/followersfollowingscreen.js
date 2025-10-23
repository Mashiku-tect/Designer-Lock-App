// FollowersFollowingScreen.js
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import BASE_URL from './Config';

const FollowersFollowingScreen = ({ route, navigation }) => {
  const { userId, receivedactivetab } = route.params;
  const [activeTab, setActiveTab] = useState(receivedactivetab || 'followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/followfollower/${userId}`);
        setFollowers(response.data.followers || []);
        console.log("Followers",followers);
        console.log("Following",following);
        setFollowing(response.data.following || []);
      } catch (error) {
        console.error('Error fetching followers/following:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Debounced search function to prevent breaking
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

  const currentData = activeTab === 'followers' ? followers : following;

  // Robust search filter with null checks
  const filteredData = currentData.filter((item) => {
    if (!item) return false;
    
    const name = item.name?.toLowerCase() || '';
    const username = item.username?.toLowerCase() || '';
    const query = searchQuery.toLowerCase().trim();
    
    return name.includes(query) || username.includes(query);
  });

  const handleUserPress = (userId) => {
    console.log("Id id is",userId)
    // Navigate to profile screen with user ID
    navigation.navigate('FeedProfileScreen', { userId });
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.avatar} 
        defaultSource={require('../assets/profile-placeholder.png')} // Add a default avatar
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
        <Text style={styles.userUsername}>@{item.bio || 'unknown'}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing ? styles.followingButton : styles.followButton,
        ]}
        onPress={(e) => {
          e.stopPropagation(); // Prevent navigation when follow button is pressed
          // Add your follow/unfollow logic here
        }}
      >
        <Text
          style={[
            styles.followButtonText,
            item.isFollowing ? styles.followingButtonText : styles.followButtonText,
          ]}
        >
          {item.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => {
    if (loading || searchLoading) {
      return null; // Don't show empty message while loading
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Designer Name</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Designer Name</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => {
            setActiveTab('followers');
            setSearchQuery(''); // Clear search when switching tabs
          }}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
          <Text style={styles.countText}>{followers.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => {
            setActiveTab('following');
            setSearchQuery(''); // Clear search when switching tabs
          }}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
          <Text style={styles.countText}>{following.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
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
        {(searchLoading) && (
          <ActivityIndicator size="small" color="#007AFF" />
        )}
      </View>

      {/* User List */}
      {(loading || searchLoading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {searchLoading ? 'Searching...' : 'Loading...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={filteredData.length === 0 ? styles.flatListContent : null}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
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
  },
  activeTab: {
    borderBottomWidth: 2,
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
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
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#666',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
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
  flatListContent: {
    flexGrow: 1,
  },
});

export default FollowersFollowingScreen;