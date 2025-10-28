import React, { useState, useEffect, useRef } from 'react';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Linking,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Video, AVPlaybackStatus } from 'expo-av';
import CustomActivityIndicator from './CustomActivityIndicator';
import { useTheme } from './ThemeContext'; 
import ThemeToggle from './ThemeToggle';
import BASE_URL from './Config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FeedScreen = () => {
  const navigation = useNavigation();
  const [activeIndexes, setActiveIndexes] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const videoRefs = useRef({});
  const flatListRef = useRef(null);
  const [visiblePosts, setVisiblePosts] = useState(new Set());
  const [videoProgress, setVideoProgress] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const { colors, isDarkMode } = useTheme(); // Add this line
          const styles = createStyles(colors, isDarkMode);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchFeed();
  }, []);

  // Debounced search function
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setShowSearchResults(false);
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearchDesigners(searchQuery.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchFeed = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        setError('Please login to view feeds');
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/feed`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        timeout: 10000
      });

      setFeedData(response.data.feed);
      const initialLikedPosts = {};
      response.data.feed.forEach(post => {
        initialLikedPosts[post.id] = post.hasliked;
      });
      setLikedPosts(initialLikedPosts);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error('Fetch feed error:', error);
      
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        setError('Network connection failed. Please check your internet connection.');
      } else if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load feeds. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search designers function
  const handleSearchDesigners = async (query) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        setSearchError('Please login to search designers');
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/search/designers`, {
        params: { q: query },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        timeout: 10000
      });

      setSearchResults(response.data.designers || []);
      setShowSearchResults(true);
      
    } catch (error) {
      console.error('Search designers error:', error);
      
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        setSearchError('Network connection failed. Please check your internet connection.');
      } else if (error.response?.status === 401) {
        setSearchError('Session expired. Please login again.');
      } else if (error.response?.status >= 500) {
        setSearchError('Server error. Please try again later.');
      } else {
        setSearchError('Failed to search designers. Please try again.');
      }
      
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle designer selection from search results
  const handleDesignerSelect = (designer) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigation.navigate('FeedProfileScreen', { 
      designer: designer.id,
    });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
    setSearchError(null);
  };

  // Fetch designer feeds on focus
  useFocusEffect(
    useCallback(() => {
      fetchFeed(false);
    }, [])
  );

  const onRefresh = () => {
    fetchFeed(true);
  };

  // Pause all videos
  const pauseAllVideos = () => {
    Object.keys(videoRefs.current).forEach(key => {
      if (videoRefs.current[key]) {
        videoRefs.current[key].pauseAsync();
      }
    });
  };

  // Play video for specific item
  const playVideo = (feedId, index) => {
    const videoKey = `${feedId}-${index}`;
    if (videoRefs.current[videoKey]) {
      videoRefs.current[videoKey].playAsync();
    }
  };

  // Handle video playback status update
  const handlePlaybackStatusUpdate = (feedId, index, status) => {
    if (status.isLoaded) {
      const progress = status.positionMillis / status.durationMillis || 0;
      setVideoProgress(prev => ({
        ...prev,
        [`${feedId}-${index}`]: progress
      }));
    }
  };

  // Handle viewable items change for vertical scrolling
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    pauseAllVideos();
    
    const newVisiblePosts = new Set(viewableItems.map(item => item.key));
    setVisiblePosts(newVisiblePosts);
    
    if (viewableItems.length > 0) {
      const firstVisibleItem = viewableItems[0];
      const feedId = firstVisibleItem.key;
      const activeIndex = activeIndexes[feedId] || 0;
      
      const post = feedData.find(p => p.id === feedId);
      if (post && post.images[activeIndex]) {
        const isVideo = isVideoFile(post.images[activeIndex]);
        if (isVideo) {
          playVideo(feedId, activeIndex);
        }
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 150,
  }).current;

  // Enhanced time formatting
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    } else {
      return `${diffInYears}y ago`;
    }
  };

  const handleWhatsAppPress = (phoneNumber) => {
    const url = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on your device');
    });
  };

  const handleProfilePress = (designer) => {
    pauseAllVideos();
    navigation.navigate('FeedProfileScreen', { designer });
  };

  const toggleLike = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'Please login to like posts');
        return;
      }

      const currentLikedStatus = likedPosts[postId];
      const currentPost = feedData.find(post => post.id === postId);
      const currentLikesCount = currentPost?.likesCount || 0;

      // Optimistic update
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));

      setFeedData(prevData => 
        prevData.map(post => 
          post.id === postId 
            ? {
                ...post,
                likesCount: currentLikedStatus ? currentLikesCount - 1 : currentLikesCount + 1
              }
            : post
        )
      );

      const response = await axios.post(
        `${BASE_URL}/api/posts/toggle-like/${postId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.updatedLikesCount !== undefined) {
        setFeedData(prevData => 
          prevData.map(post => 
            post.id === postId 
              ? {
                  ...post,
                  likesCount: response.data.updatedLikesCount
                }
              : post
          )
        );
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert on error
      const currentPost = feedData.find(post => post.id === postId);
      const currentLikesCount = currentPost?.likesCount || 0;
      const currentLikedStatus = likedPosts[postId];

      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));

      setFeedData(prevData => 
        prevData.map(post => 
          post.id === postId 
            ? {
                ...post,
                likesCount: currentLikedStatus ? currentLikesCount + 1 : currentLikesCount - 1
              }
            : post
        )
      );

      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const updateActiveIndex = (feedId, index) => {
    pauseAllVideos();

    setActiveIndexes(prev => ({
      ...prev,
      [feedId]: index,
    }));

    if (visiblePosts.has(feedId)) {
      const post = feedData.find(p => p.id === feedId);
      if (post && post.images[index]) {
        const isVideo = isVideoFile(post.images[index]);
        if (isVideo) {
          playVideo(feedId, index);
        }
      }
    }
  };

  const openComments = (post) => {
    pauseAllVideos();
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const closeComments = () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    setNewComment('');
    
    if (visiblePosts.size > 0) {
      const firstVisiblePostId = Array.from(visiblePosts)[0];
      const activeIndex = activeIndexes[firstVisiblePostId] || 0;
      const post = feedData.find(p => p.id === firstVisiblePostId);
      if (post && post.images[activeIndex]) {
        const isVideo = isVideoFile(post.images[activeIndex]);
        if (isVideo) {
          playVideo(firstVisiblePostId, activeIndex);
        }
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const addComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'Please login to comment');
        return;
      }

      const tempComment = {
        id: `temp-${Date.now()}`,
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
        user: {
          name: 'You',
          avatar: '',
        },
        isTemp: true
      };

      const updatedFeedData = feedData.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: [...post.comments, tempComment]
            }
          : post
      );

      setFeedData(updatedFeedData);
      
      setSelectedPost(prev => ({
        ...prev,
        comments: [...prev.comments, tempComment]
      }));

      setNewComment('');
      setCommentLoading(prev => ({ ...prev, [selectedPost.id]: true }));

      const payload = {
        text: newComment.trim(),
      };

      const response = await axios.post(
        `${BASE_URL}/api/products/comments/${selectedPost.id}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          }
        }
      );

      const savedComment = response.data.comment;

      const finalFeedData = updatedFeedData.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: post.comments.map(comment => 
                comment.id === tempComment.id ? savedComment : comment
              )
            }
          : post
      );

      setFeedData(finalFeedData);
      
      if (commentModalVisible) {
        setSelectedPost(prev => ({
          ...prev,
          comments: prev.comments.map(comment => 
            comment.id === tempComment.id ? savedComment : comment
          )
        }));
      }

    } catch (error) {
      console.error('Error posting comment:', error);
      
      const revertedFeedData = feedData.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: post.comments.filter(comment => comment.id !== tempComment.id)
            }
          : post
      );

      setFeedData(revertedFeedData);
      
      if (commentModalVisible) {
        setSelectedPost(prev => ({
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== tempComment.id)
        }));
      }

      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setCommentLoading(prev => ({ ...prev, [selectedPost.id]: false }));
    }
  };

  const isVideoFile = (url) => {
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.toLowerCase().endsWith('.avi');
  };

  // Render skeleton for feed items
  const renderFeedSkeleton = () => (
    <View style={styles.feedSkeleton}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonUserInfo}>
          <View style={[styles.skeletonText, { width: '60%', height: 16 }]} />
          <View style={[styles.skeletonText, { width: '40%', height: 14, marginTop: 6 }]} />
        </View>
      </View>
      <View style={styles.skeletonMedia}>
        <View style={styles.skeletonImage} />
      </View>
      <View style={styles.skeletonActions}>
        <View style={styles.skeletonActionButtons}>
          <View style={[styles.skeletonButton, { width: 40 }]} />
          <View style={[styles.skeletonButton, { width: 40 }]} />
          <View style={[styles.skeletonButton, { width: 40 }]} />
        </View>
      </View>
      <View style={styles.skeletonEngagement}>
        <View style={[styles.skeletonText, { width: '30%', height: 14 }]} />
      </View>
      <View style={styles.skeletonComments}>
        <View style={[styles.skeletonText, { width: '80%', height: 14 }]} />
        <View style={[styles.skeletonText, { width: '60%', height: 14, marginTop: 4 }]} />
      </View>
    </View>
  );

  // Render skeleton for comments
  const renderCommentSkeleton = () => (
    <View style={styles.commentSkeleton}>
      <View style={styles.skeletonCommentAvatar} />
      <View style={styles.skeletonCommentContent}>
        <View style={styles.skeletonCommentHeader}>
          <View style={[styles.skeletonText, { width: '40%', height: 14 }]} />
          <View style={[styles.skeletonText, { width: '20%', height: 12 }]} />
        </View>
        <View style={[styles.skeletonText, { width: '80%', height: 14, marginTop: 6 }]} />
      </View>
    </View>
  );

  // Render search result item
  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => handleDesignerSelect(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.profileImage || item.avatar }} 
        style={styles.searchResultAvatar}
        defaultSource={require('../assets/profile-placeholder.png')}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name || 'Unknown Designer'}</Text>
        <Text style={styles.searchResultBio} numberOfLines={2}>
          {item.bio || 'No bio available'}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  // Render empty search results
  const renderEmptySearchResults = () => (
    <View style={styles.emptySearchContainer}>
      <Icon name="search-off" size={64} color="#E0E0E0" />
      <Text style={styles.emptySearchTitle}>No designers found</Text>
      <Text style={styles.emptySearchText}>
        No designers match "{searchQuery}"
      </Text>
    </View>
  );

  // Render empty state for feeds
  const renderEmptyFeeds = () => (
    <View style={styles.emptyContainer}>
      <Icon name="feed" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Feeds Available</Text>
      <Text style={styles.emptySubtitle}>
        {error ? error : 'There are no design feeds to show at the moment.'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchFeed()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3].map((item) => (
        <View key={item}>{renderFeedSkeleton()}</View>
      ))}
    </View>
  );

  const renderWorkItem = ({ item, index, feedId }) => {
    const isVideo = isVideoFile(item.image);
    const isPostVisible = visiblePosts.has(feedId);
    const isActiveItem = activeIndexes[feedId] === index;
    const progress = videoProgress[`${feedId}-${index}`] || 0;
    
    return (
      <View style={styles.workItem}>
        {isVideo ? (
          <View style={styles.videoContainer}>
            <Video
              ref={ref => videoRefs.current[`${feedId}-${index}`] = ref}
              source={{ uri: item.image }}
              style={styles.video}
              resizeMode="cover"
              shouldPlay={isPostVisible && isActiveItem}
              isLooping
              useNativeControls={false}
              onPlaybackStatusUpdate={(status) => 
                handlePlaybackStatusUpdate(feedId, index, status)
              }
            />
            
            {/* Video Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${progress * 100}%` }
                ]} 
              />
            </View>

            {!isPostVisible && (
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => {
                  if (videoRefs.current[`${feedId}-${index}`]) {
                    videoRefs.current[`${feedId}-${index}`].playAsync();
                  }
                }}
              >
                <Icon name="play-arrow" size={48} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Image
            source={{ uri: item.image }}
            style={styles.workImage}
            resizeMode="cover"
          />
        )}
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Icon name="videocam" size={16} color="#666" />
            <Text style={styles.videoIndicatorText}>Video</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <Image 
        source={{ uri: item.user.avatar || 'https://via.placeholder.com/36' }} 
        style={styles.commentAvatar} 
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{item.user.name}</Text>
          <Text style={styles.commentTime}>{formatDate(item.timestamp)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        {item.isTemp && (
          <Text style={styles.sendingText}>Sending...</Text>
        )}
      </View>
    </View>
  );

  const renderEmptyComments = () => (
    <View style={styles.emptyCommentsContainer}>
      <Icon name="chat-bubble-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyCommentsText}>No comments yet</Text>
      <Text style={styles.emptyCommentsSubText}>
        Be the first to share your thoughts!
      </Text>
    </View>
  );

  const renderFeedItem = ({ item }) => {
    const activeIndex = activeIndexes[item.id] || 0;
    const isLiked = likedPosts[item.id];

    return (
      <Animated.View style={[styles.feedItem, { opacity: fadeAnim }]}>
        {/* Header with profile info */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.profileInfo}
            onPress={() => handleProfilePress(item.designer)}
          >
            <Image
              source={{ uri: item.designer.avatar }}
              style={styles.avatar}
            />
            <View style={styles.profileText}>
              <Text style={styles.designerName}>{item.designer.name}</Text>
              <Text style={styles.designerRole}>{item.designer.bio}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => handleWhatsAppPress(item.designer.phone)}
          >
            <Icon name="chat" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Work carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={item.images}
            renderItem={({ item: imageItem, index }) => 
              renderWorkItem({ 
                item: { image: imageItem, description: item.description }, 
                index, 
                feedId: item.id 
              })
            }
            keyExtractor={(imageItem, index) => `${item.id}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / (screenWidth - 20)
              );
              updateActiveIndex(item.id, newIndex);
            }}
            decelerationRate="fast"
            snapToInterval={screenWidth}
            snapToAlignment="center"
          />
          
          {/* Media counter for multiple items */}
          {item.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {activeIndex + 1}/{item.images.length}
              </Text>
            </View>
          )}
          
          {/* Pagination dots */}
          {item.images.length > 1 && (
            <View style={styles.pagination}>
              {item.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionBar}>
          <View style={styles.actionGroup}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => toggleLike(item.id)}
            >
              <Icon 
                name={isLiked ? "favorite" : "favorite-border"} 
                size={24} 
                color={isLiked ? "#FF3B30" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openComments(item)}
            >
              <Icon name="chat-bubble-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="bookmark-border" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Engagement stats */}
        <View style={styles.engagement}>
          <Text style={styles.engagementText}>
            {item.likesCount} likes • {item.comments.length} comments
          </Text>
        </View>

        {/* Show comment preview or empty state */}
        {item.comments.length > 0 ? (
          <TouchableOpacity 
            style={styles.commentPreview}
            onPress={() => openComments(item)}
          >
            <Text style={styles.viewCommentsText}>
              View all {item.comments.length} comments
            </Text>
            <Text style={styles.previewComment} numberOfLines={1}>
              <Text style={styles.previewCommentUser}>
                {item.comments[0].user.name}:
              </Text> {item.comments[0].text}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.commentPreview}
            onPress={() => openComments(item)}
          >
            <Text style={styles.noCommentsText}>
              No comments yet. Tap to add the first comment!
            </Text>
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <View style={styles.timestamp}>
          <Text style={styles.timestampText}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return renderLoading();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.headerIcon}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="chevron-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search designers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.headerButton}>
          {/* <Icon name="tune" size={24} color="#333" /> */}
        </TouchableOpacity>
      </View>
      
      {/* Search Results Overlay */}
      {showSearchResults && (
        <View style={styles.searchResultsOverlay}>
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>Search Results</Text>
              <TouchableOpacity onPress={handleClearSearch}>
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color="#4a6bff" />
                <Text style={styles.searchLoadingText}>Searching designers...</Text>
              </View>
            ) : searchError ? (
              <View style={styles.searchErrorContainer}>
                <Icon name="error-outline" size={48} color="#FF3B30" />
                <Text style={styles.searchErrorText}>{searchError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => handleSearchDesigners(searchQuery)}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptySearchResults}
                contentContainerStyle={searchResults.length === 0 ? styles.emptySearchListContent : null}
              />
            )}
          </View>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={feedData}
        renderItem={renderFeedItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          feedData.length === 0 && styles.emptyListContent
        ]}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={screenHeight * 0.8}
        snapToAlignment="start"
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a6bff']}
            tintColor="#4a6bff"
          />
        }
        ListEmptyComponent={renderEmptyFeeds}
      />

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeComments}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={closeComments} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedPost && (
            <FlatList
              data={selectedPost.comments}
              renderItem={renderCommentItem}
              keyExtractor={item => item.id}
              style={styles.commentsList}
              contentContainerStyle={[
                styles.commentsListContent,
                selectedPost.comments.length === 0 && styles.emptyCommentsListContent
              ]}
              ListEmptyComponent={renderEmptyComments}
              ListHeaderComponent={
                commentLoading[selectedPost.id] && (
                  <View style={styles.commentLoadingContainer}>
                    {[1, 2, 3].map((item) => (
                      <View key={item}>{renderCommentSkeleton()}</View>
                    ))}
                  </View>
                )
              }
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          )}

          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.postCommentButton,
                !newComment.trim() && styles.postCommentButtonDisabled
              ]}
              onPress={addComment}
              disabled={!newComment.trim() || commentLoading[selectedPost?.id]}
            >
              {commentLoading[selectedPost?.id] ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <Text style={[
                  styles.postCommentText,
                  !newComment.trim() && styles.postCommentTextDisabled
                ]}>
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  headerButton: {
    padding: 8,
  },
  // Search styles
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  // Search results styles
  searchResultsOverlay: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  searchResultBio: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  searchLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchErrorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchErrorText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 40,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptySearchListContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  // Feed item styles
  feedItem: {
    backgroundColor: colors.card,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: screenWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: screenWidth,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  profileText: {
    flex: 1,
  },
  designerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  designerRole: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  whatsappButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  carouselContainer: {
    position: 'relative',
    width: screenWidth,
  },
  workItem: {
    width: screenWidth,
    paddingBottom: 16,
  },
  workImage: {
    width: '100%',
    height: 450,
  },
  videoContainer: {
    width: '100%',
    height: 450,
    position: 'relative',
    backgroundColor: colors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    padding: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoIndicatorText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  description: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '400',
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: colors.white,
    width: 20,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: screenWidth,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 16,
  },
  engagement: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    width: screenWidth,
  },
  engagementText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentPreview: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    width: screenWidth,
  },
  viewCommentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewComment: {
    fontSize: 14,
    color: colors.text,
  },
  previewCommentUser: {
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  timestamp: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: screenWidth,
  },
  timestampText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '400',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    flexGrow: 1,
  },
  emptyCommentsListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: colors.gray100,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  sendingText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCommentsSubText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  postCommentButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  postCommentButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  postCommentText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  postCommentTextDisabled: {
    color: colors.textMuted,
  },
  headerIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0
  },
  // Feed Skeleton Styles - Full Width
  feedSkeleton: {
    backgroundColor: colors.card,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: screenWidth,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: screenWidth,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    marginRight: 12,
  },
  skeletonUserInfo: {
    flex: 1,
  },
  skeletonText: {
    backgroundColor: colors.gray100,
    borderRadius: 4,
  },
  skeletonMedia: {
    width: screenWidth,
    marginBottom: 0,
  },
  skeletonImage: {
    width: screenWidth,
    height: 450,
    backgroundColor: colors.gray100,
  },
  skeletonActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: screenWidth,
  },
  skeletonActionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  skeletonButton: {
    height: 24,
    backgroundColor: colors.gray100,
    borderRadius: 4,
  },
  skeletonEngagement: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    width: screenWidth,
  },
  skeletonComments: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    width: screenWidth,
  },
  // Comment Skeleton Styles - Full Width
  commentSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: screenWidth,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skeletonCommentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    marginRight: 12,
  },
  skeletonCommentContent: {
    flex: 1,
  },
  skeletonCommentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  // Update the loading container to be full width
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default FeedScreen;