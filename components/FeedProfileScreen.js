import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
import { useTheme } from './ThemeContext'; 
import BASE_URL from './Config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DesignerProfileScreen = ({ route, navigation }) => {
  const { designer } = route.params;
  const designerId = typeof designer === 'object' ? designer.id : designer;

  const { colors, isDarkMode } = useTheme(); // Add this line
          const styles = createStyles(colors, isDarkMode);
  
  // State declarations
  const [activeTab, setActiveTab] = useState('works');
  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [likedPosts, setLikedPosts] = useState({});
  const verticalFlatListRef = useRef(null);
  const [designerWorks, setDesignerWorks] = useState([]);
  const videoRefs = useRef({});
  const [visiblePosts, setVisiblePosts] = useState(new Set());
  
  const [designerStats, setDesignerStats] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [designerdetails, setDesigner] = useState(null);
  const [loggedInUserId, setLoggedinUserId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // Combined loading state - we're ready when we have all critical data
  const [isReady, setIsReady] = useState(false);

  // Add these to your existing state declarations
const [mediaLoading, setMediaLoading] = useState({}); // Track individual media loading
const [mediaErrors, setMediaErrors] = useState({}); // Track media loading errors
const [commentLoading, setCommentLoading] = useState(false); // Track comments loading

  // Function to open WhatsApp
  const openWhatsApp = () => {
    if (!designerdetails?.phone) return;
    
    const message = 'Hello! I would like to discuss a design project with you.';
    const url = `whatsapp://send?phone=${designerdetails.phone}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${designerdetails.phone}?text=${encodeURIComponent(message)}`;
        Linking.openURL(webUrl);
      }
    }).catch(err => {
      console.error('Error opening WhatsApp:', err);
      const webUrl = `https://wa.me/${designerdetails.phone}?text=${encodeURIComponent(message)}`;
      Linking.openURL(webUrl);
    });
  };

  // Main data fetching function
  const fetchAllData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
        setError(null);
        setIsReady(false);
      } else {
        setRefreshing(true);
      }

      // Fetch all data in parallel
      const [designerInfo, worksData, statsData, ownershipData] = await Promise.all([
        fetchDesignerInfo(),
        FetchDesignerWorks(),
        fetchDesignerStats(),
        checkOwnership()
      ]);

      // Set all states
      setDesigner(designerInfo);
      setIsOwner(ownershipData);
      
      // Mark as ready when all critical data is loaded
      setIsReady(true);

    } catch (error) {
      console.error('Error fetching designer data:', error);
      setError('Failed to load designer profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [designerId]);

  // Fetch designer info
  const fetchDesignerInfo = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/getdesignerinfo/${designerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching designer info:', error);
      throw error;
    }
  };

  // Fetch designer works
  const FetchDesignerWorks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Please login to view designer works');
        return null;
      }

      const response = await axios.get(
        `${BASE_URL}/api/designers/works/${designerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      const works = response.data.works;
      setDesignerWorks(works);
      setLoggedinUserId(response.data.loggedInUserId);
      setIsFollowing(response.data.hasFollowedThisDesigner);

      const initialLikedPosts = {};
      works.forEach(post => {
        initialLikedPosts[post.id] = post.hasliked || false;
      });
      setLikedPosts(initialLikedPosts);

      return response.data;

    } catch (error) {
      console.error('Error fetching designer works:', error);
      throw error;
    }
  };

  // Fetch designer stats
  const fetchDesignerStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return null;

      const response = await axios.get(`${BASE_URL}/api/designers/stats/${designerId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      setDesignerStats(response.data);
      return response.data;

    } catch (error) {
      console.error('Failed to fetch designer stats:', error);
      return null;
    }
  };

  // Check ownership
  const checkOwnership = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(
        `${BASE_URL}/api/profile/check-ownership/${designerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.isOwner;
    } catch (error) {
      console.log("Error verifying ownership:", error.message);
      return false;
    }
  };

  // Follow/Unfollow designer
  const FollowDesigner = async (designerId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login to follow designers');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/designers/toggle-follow/${designerId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.isFollowing !== undefined) {
        setIsFollowing(response.data.isFollowing);
        setDesignerStats(prevStats => ({
          ...prevStats,
          followers: response.data.isFollowing
            ? prevStats.followers + 1
            : Math.max(prevStats.followers - 1, 0)
        }));
      }
    } catch (error) {
      console.error('Error following/unfollowing designer:', error);
      Alert.alert('Error', 'Failed to follow/unfollow designer. Please try again.');
    }
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
  const playVideo = (postId, index) => {
    const videoKey = `${postId}-${index}`;
    if (videoRefs.current[videoKey]) {
      videoRefs.current[videoKey].playAsync();
    }
  };

  // Handle viewable items change for vertical scrolling in modal
  const onVerticalViewableItemsChanged = useRef(({ viewableItems }) => {
    pauseAllVideos();
    
    const newVisiblePosts = new Set(viewableItems.map(item => item.key));
    setVisiblePosts(newVisiblePosts);
    
    if (viewableItems.length > 0) {
      const firstVisibleItem = viewableItems[0];
      const postId = firstVisibleItem.key;
      const activeIndex = activeImageIndex;
      
      const post = designerWorks.find(p => p.id === postId);
      if (post && post.images[activeIndex]) {
        const isVideo = isVideoFile(post.images[activeIndex]);
        if (isVideo) {
          playVideo(postId, activeIndex);
        }
      }
    }
  }).current;

  const verticalViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 150,
  }).current;

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
  } else if (diffInMinutes === 1) {
    return '1 min ago';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} mins ago`;
  } else if (diffInHours === 1) {
    return '1 hour ago';
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInWeeks === 1) {
    return '1 week ago';
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} weeks ago`;
  } else if (diffInMonths === 1) {
    return '1 month ago';
  } else if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
  } else if (diffInYears === 1) {
    return '1 year ago';
  } else {
    return `${diffInYears} years ago`;
  }
};

  // Check if file is video based on extension
  const isVideoFile = (url) => {
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.toLowerCase().endsWith('.avi');
  };

  const openPost = (post, index) => {
    pauseAllVideos();

    setSelectedPost(post);
    setActivePostIndex(index);
    setActiveImageIndex(0);
    setPostModalVisible(true);
    
    setTimeout(() => {
      verticalFlatListRef.current?.scrollToIndex({
        index: index,
        animated: false,
      });
    }, 100);
  };

  const closePost = () => {
    pauseAllVideos();
    
    setPostModalVisible(false);
    setSelectedPost(null);
    setActiveImageIndex(0);
    setActivePostIndex(0);
    setVisiblePosts(new Set());
  };

  const openComments = async (post) => {
  setCommentLoading(true);
  setSelectedPost(post);
  setCommentModalVisible(true);
  
  // Simulate loading comments (you can remove this if comments load instantly)
  setTimeout(() => {
    setCommentLoading(false);
  }, 500);
};

// Add comment skeleton renderer
const renderCommentSkeleton = () => (
  <View style={styles.commentSkeleton}>
    <View style={styles.skeletonCommentAvatar} />
    <View style={styles.skeletonCommentContent}>
      <View style={styles.skeletonCommentHeader}>
        <View style={[styles.skeletonText, { width: '40%', height: 14 }]} />
        <View style={[styles.skeletonText, { width: '20%', height: 12 }]} />
      </View>
      <View style={[styles.skeletonText, { width: '80%', height: 14, marginTop: 6 }]} />
      <View style={[styles.skeletonText, { width: '60%', height: 14, marginTop: 4 }]} />
    </View>
  </View>
);

  const closeComments = () => {
    setCommentModalVisible(false);
    setNewComment('');
  };

  const toggleLike = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'Please login to like posts');
        return;
      }

      const currentLikedStatus = likedPosts[postId];
      const currentPost = designerWorks.find(post => post.id === postId);
      
      const currentLikesCount = currentPost?.likes || currentPost?.likesCount || 0;

      // Optimistic update
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));

      setDesignerWorks(prevData => 
        prevData.map(post => 
          post.id === postId 
            ? {
                ...post,
                likes: currentLikedStatus ? currentLikesCount - 1 : currentLikesCount + 1
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
        setDesignerWorks(prevData => 
          prevData.map(post => 
            post.id === postId 
              ? {
                  ...post,
                  likes: response.data.updatedLikesCount
                }
              : post
          )
        );
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert on error
      const currentPost = designerWorks.find(post => post.id === postId);
      const currentLikesCount = currentPost?.likes || currentPost?.likesCount || 0;
      const currentLikedStatus = likedPosts[postId];

      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));

      setDesignerWorks(prevData => 
        prevData.map(post => 
          post.id === postId 
            ? {
                ...post,
                likes: currentLikedStatus ? currentLikesCount - 1 : currentLikesCount + 1
              }
            : post
        )
      );

      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const addComment = async () => {
    if (newComment.trim() === '' || !selectedPost) return;

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

      const updatedWorks = designerWorks.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: [...(post.comments || []), tempComment]
            }
          : post
      );

      setDesignerWorks(updatedWorks);
      
      setSelectedPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), tempComment]
      }));

      setNewComment('');

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

      const finalWorks = updatedWorks.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: post.comments.map(comment => 
                comment.id === tempComment.id ? savedComment : comment
              )
            }
          : post
      );

      setDesignerWorks(finalWorks);
      
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
      
      const revertedWorks = designerWorks.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: post.comments.filter(comment => comment.id !== tempComment.id)
            }
          : post
      );

      setDesignerWorks(revertedWorks);
      
      if (commentModalVisible) {
        setSelectedPost(prev => ({
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== tempComment.id)
        }));
      }

      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  };

  const updateActiveImageIndex = (postId, index) => {
    pauseAllVideos();

    setActiveImageIndex(index);

    if (visiblePosts.has(postId)) {
      const post = designerWorks.find(p => p.id === postId);
      if (post && post.images[index]) {
        const isVideo = isVideoFile(post.images[index]);
        if (isVideo) {
          playVideo(postId, index);
        }
      }
    }
  };

  // Render empty state for no works
  const renderEmptyWorks = () => (
    <View style={styles.emptyContainer}>
      <Icon name="photo-library" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Works Published</Text>
      <Text style={styles.emptySubtitle}>
        {designerId === loggedInUserId
          ? "You haven't published any design works yet."
          : `${designerdetails?.name} hasn't published any design works yet.`}
      </Text>
      <Text style={styles.emptyHint}>
        {designerId === loggedInUserId
          ? "Start uploading your creations to showcase your talent!"
          : "Check back later to see their amazing designs!"}
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="error-outline" size={80} color="#FF6B6B" />
      <Text style={styles.emptyTitle}>Unable to Load Profile</Text>
      <Text style={styles.emptySubtitle}>
        {error}
      </Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => fetchAllData()}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Render skeleton loader
  const renderSkeletonLoader = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Designer Profile</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="more-vert" size={24} color="#4a6bff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Skeleton Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.profileAvatar, styles.skeleton]} />
          </View>
          
          <View style={[styles.skeleton, styles.skeletonText, { width: 120, height: 24, marginBottom: 8 }]} />
          <View style={[styles.skeleton, styles.skeletonText, { width: 160, height: 18, marginBottom: 12 }]} />
          <View style={[styles.skeleton, styles.skeletonText, { width: '80%', height: 14, marginBottom: 24 }]} />

          {/* Skeleton Stats */}
          <View style={styles.statsContainer}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.statItem}>
                <View style={[styles.skeleton, styles.skeletonText, { width: 30, height: 18, marginBottom: 4 }]} />
                <View style={[styles.skeleton, styles.skeletonText, { width: 40, height: 12 }]} />
              </View>
            ))}
          </View>

          {/* Skeleton Action Buttons - Always show both to prevent layout shift */}
          <View style={styles.actionButtons}>
            <View style={[styles.followButton, styles.skeleton]} />
            <View style={[styles.messageButton, styles.skeleton]} />
          </View>
        </View>

        {/* Skeleton Tabs */}
        <View style={styles.tabContainer}>
          <View style={[styles.tab, styles.skeleton]} />
          <View style={[styles.tab, styles.skeleton]} />
        </View>

        {/* Skeleton Content */}
        <View style={[styles.skeleton, { height: 200, margin: 20 }]} />
      </ScrollView>
    </SafeAreaView>
  );

 const renderMediaItem = ({ item, index, postId }) => {
  const isVideo = isVideoFile(item);
  const isPostVisible = visiblePosts.has(postId);
  const isActiveItem = activeImageIndex === index;
  const mediaKey = `${postId}-${index}`;
  const isLoading = mediaLoading[mediaKey];
  const hasError = mediaErrors[mediaKey];
  
  // Handle media load start
  const handleMediaLoadStart = () => {
    setMediaLoading(prev => ({ ...prev, [mediaKey]: true }));
    setMediaErrors(prev => ({ ...prev, [mediaKey]: false }));
  };

  // Handle media load end
  const handleMediaLoadEnd = () => {
    setMediaLoading(prev => ({ ...prev, [mediaKey]: false }));
  };

  // Handle media error
  const handleMediaError = (error) => {
    console.error(`Media loading error for ${mediaKey}:`, error);
    setMediaLoading(prev => ({ ...prev, [mediaKey]: false }));
    setMediaErrors(prev => ({ ...prev, [mediaKey]: true }));
  };

  // Render media skeleton
  const renderMediaSkeleton = () => (
    <View style={styles.mediaSkeleton}>
      <ActivityIndicator size="large" color="#4a6bff" />
      <Text style={styles.skeletonText}>Loading media...</Text>
    </View>
  );

  // Render media error
  const renderMediaError = () => (
    <View style={styles.mediaError}>
      <Icon name="error-outline" size={48} color="#ff6b6b" />
      <Text style={styles.errorText}>Failed to load media</Text>
      <Text style={styles.errorSubtext}>Please check your connection</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          setMediaErrors(prev => ({ ...prev, [mediaKey]: false }));
          setMediaLoading(prev => ({ ...prev, [mediaKey]: true }));
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mediaItem}>
      {isVideo ? (
        <View style={styles.videoContainer}>
          <Video
            ref={ref => videoRefs.current[mediaKey] = ref}
            source={{ uri: item }}
            style={styles.video}
            resizeMode="cover"
            shouldPlay={isPostVisible && isActiveItem && !isLoading && !hasError}
            isLooping
            useNativeControls={false}
            onLoadStart={handleMediaLoadStart}
            onLoad={handleMediaLoadEnd}
            onError={handleMediaError}
          />
          {isLoading && renderMediaSkeleton()}
          {hasError && renderMediaError()}
          {!isPostVisible && !isLoading && !hasError && (
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => {
                if (videoRefs.current[mediaKey]) {
                  videoRefs.current[mediaKey].playAsync();
                }
              }}
            >
              <Icon name="play-arrow" size={48} color="white" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item }}
            style={styles.detailImage}
            resizeMode="cover"
            onLoadStart={handleMediaLoadStart}
            onLoadEnd={handleMediaLoadEnd}
            onError={handleMediaError}
          />
          {isLoading && renderMediaSkeleton()}
          {hasError && renderMediaError()}
        </View>
      )}
      {isVideo && !isLoading && !hasError && (
        <View style={styles.videoIndicator}>
          <Icon name="videocam" size={16} color="#666" />
          <Text style={styles.videoIndicatorText}>Video</Text>
        </View>
      )}
    </View>
  );
};

  const renderGridItem = ({ item, index }) => {
    const isLiked = likedPosts[item.id];
    const likesCount = item.likes || item.likesCount || 0;
    const displayLikes = likesCount;
    const firstMedia = item.images[0];
    const isVideo = isVideoFile(firstMedia);

    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => openPost(item, index)}
      >
        {isVideo ? (
          <View style={styles.gridVideoContainer}>
            <Video
              source={{ uri: firstMedia }}
              style={styles.gridImage}
              resizeMode="cover"
              shouldPlay={false}
              isMuted={true}
            />
            <View style={styles.videoOverlay}>
              <Icon name="play-arrow" size={24} color="white" />
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: firstMedia }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        )}
        
        {/* Show multiple images indicator */}
        {item.images.length > 1 && (
          <View style={styles.multipleImagesIndicator}>
            <Icon name="collections" size={16} color="#FFFFFF" />
          </View>
        )}
        
        {/* Video indicator for grid */}
        {isVideo && (
          <View style={styles.gridVideoIndicator}>
            <Icon name="videocam" size={12} color="#FFFFFF" />
          </View>
        )}
        
        {/* Like overlay */}
        <View style={styles.gridOverlay}>
          <View style={styles.likeContainer}>
            <Icon name="favorite" size={16} color="red" />
            <Text style={styles.likeCount}>{displayLikes}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <Image source={{ uri: item.user?.avatar || 'https://via.placeholder.com/36' }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{item.user?.name || 'User'}</Text>
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

  const renderVerticalPost = ({ item, index }) => {
    const isLiked = likedPosts[item.id];
    const hasliked = item.hasliked;
    const likesCount = item.likes || item.likesCount || 0;
    const displayLikes = likesCount;
    const comments = item.comments || [];

    return (
      <View style={styles.verticalPostContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image
            source={{ uri: designerdetails?.avatar }}
            style={styles.postAvatar}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{designerdetails?.name}</Text>
            <Text style={styles.postCategory}>{item.category}</Text>
          </View>
        </View>

        {/* Media Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={item.images}
            renderItem={({ item: mediaItem, index: mediaIndex }) => 
              renderMediaItem({ item: mediaItem, index: mediaIndex, postId: item.id })
            }
            keyExtractor={(img, imgIndex) => imgIndex.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / screenWidth
              );
              updateActiveImageIndex(item.id, newIndex);
            }}
          />
          
          {/* Media Counter */}
          {item.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {activeImageIndex + 1}/{item.images.length}
              </Text>
            </View>
          )}
          
          {/* Pagination Dots */}
          {item.images.length > 1 && (
            <View style={styles.pagination}>
              {item.images.map((_, imgIndex) => (
                <View
                  key={imgIndex}
                  style={[
                    styles.paginationDot,
                    imgIndex === activeImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.postActionBar}>
          <View style={styles.postActionGroup}>
            <TouchableOpacity 
              style={styles.postActionButton}
              onPress={() => toggleLike(item.id)}
            >
              <Icon 
                name={isLiked ? "favorite" : "favorite-border"} 
                size={24} 
                color={isLiked ? "#FF3B30" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.postActionButton}
              onPress={() => openComments(item)}
            >
              <Icon name="chat-bubble-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.postActionButton}>
            <Icon name="bookmark-border" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Likes */}
        <View style={styles.postLikes}>
          <Text style={styles.likesText}>
            {displayLikes} likes
          </Text>
        </View>

        {/* Description */}
        <View style={styles.postDescription}>
          <Text style={styles.descriptionText}>
            <Text style={styles.userNameText}>{designerdetails?.name} </Text>
            {item.description}
          </Text>
        </View>

        {/* Comments Preview */}
        {comments.length > 0 ? (
          <TouchableOpacity 
            style={styles.commentsPreview}
            onPress={() => openComments(item)}
          >
            <Text style={styles.viewCommentsText}>
              View all {comments.length} comments
            </Text>
            {comments.slice(0, 2).map((comment) => (
              <Text key={comment.id} style={styles.previewComment} numberOfLines={1}>
                <Text style={styles.previewCommentUser}>{comment.user?.name || 'User'}: </Text>
                {comment.text}
              </Text>
            ))}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.commentsPreview}
            onPress={() => openComments(item)}
          >
            <Text style={styles.noCommentsText}>
              No comments yet. Tap to add the first comment!
            </Text>
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <View style={styles.postTimestamp}>
          <Text style={styles.timestampText}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const statsData = [
    { label: 'Works', value: designerStats.works || 0 },
    { label: 'Followers', value: designerStats.followers || 0 },
    { label: 'Following', value: designerStats.following || 0 },
    { label: 'Likes', value: designerStats.likes || 0 },
  ];

  // Show skeleton loader until all data is ready
  if (loading || !isReady) {
    return renderSkeletonLoader();
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#4a6bff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Designer Profile</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more-vert" size={24} color="#4a6bff" />
          </TouchableOpacity>
        </View>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Designer Profile</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="more-vert" size={24} color="#4a6bff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAllData(true)}
            colors={['#4a6bff']}
            tintColor="#4a6bff"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: designerdetails?.avatar }}
              style={styles.profileAvatar}
            />
            <View style={styles.verifiedBadge}>
              <Icon name="verified" size={16} color="#007AFF" />
            </View>
          </View>
          
          <Text style={styles.profileName}>{designerdetails?.name}</Text>
          <Text style={styles.profileRole}>{designerdetails?.bio}</Text>
          <Text style={styles.profileBio}>
            {designerdetails?.professionalsummary}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {statsData.map((stat) => {
              const isNavigable =
                stat.label === "Followers" || stat.label === "Following";

              const handlePress = () => {
                if (isNavigable) {
                  navigation.navigate('VisitedUserFollowAndFollowersScreen', {
                    designername: designerdetails?.name,
                    designerId,
                    receivedactivetab: stat.label === "Followers" ? "Followers" : "Following"
                  });
                }
              };

              const Wrapper = isNavigable ? TouchableOpacity : View;

              return (
                <Wrapper
                  key={stat.label}
                  style={styles.statItem}
                  onPress={handlePress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Wrapper>
              );
            })}
          </View>

          {/* Action Buttons - No more flickering! */}
          {!isOwner && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.followButton} 
                onPress={() => FollowDesigner(designerId)}
              >
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.messageButton}
                onPress={openWhatsApp}
              >
                <Icon name="chat" size={20} color="#007AFF" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'works' && styles.activeTab]}
            onPress={() => setActiveTab('works')}
          >
            <Icon name="grid-on" size={20} color={activeTab === 'works' ? '#007AFF' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Icon name="info" size={20} color={activeTab === 'about' ? '#007AFF' : '#666'} />
          </TouchableOpacity>
        </View>

        {/* Works Grid - Instagram Style */}
        {activeTab === 'works' && (
          designerWorks.length > 0 ? (
            <FlatList
              data={designerWorks}
              renderItem={renderGridItem}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.worksGrid}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyWorks()
          )
        )}

        {/* About Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Information</Text>
              <View style={styles.infoItem}>
                <Icon name="location-on" size={20} color="#666" />
                <Text style={styles.infoText}>{designerdetails?.location || 'Not specified'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="work" size={20} color="#666" />
                <Text style={styles.infoText}>{designerdetails?.work || 'Not specified'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="school" size={20} color="#666" />
                <Text style={styles.infoText}>{designerdetails?.education || 'Not specified'}</Text>
              </View>
            </View>

            <View style={styles.skillsSection}>
              <Text style={styles.sectionTitle}>Skills & Expertise</Text>
              <View style={styles.skillsContainer}>
                {designerStats.skills && designerStats.skills.length > 0 ? (
                  designerStats.skills.map((skill) => (
                    <View key={skill} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noSkillsText}>No skills added yet</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Vertical Posts Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePost}
      >
        <SafeAreaView style={styles.verticalModalContainer}>
          {/* Modal Header */}
          <View style={styles.verticalModalHeader}>
            <TouchableOpacity onPress={closePost} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.verticalModalTitle}>
              Posts • {activePostIndex + 1} of {designerWorks.length}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Vertical Posts FlatList */}
          <FlatList
            ref={verticalFlatListRef}
            data={designerWorks}
            renderItem={renderVerticalPost}
            keyExtractor={item => item.id}
            vertical
            pagingEnabled
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onVerticalViewableItemsChanged}
            viewabilityConfig={verticalViewabilityConfig}
            initialScrollIndex={activePostIndex}
            snapToInterval={screenWidth + 400}
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: screenWidth + 400,
              offset: (screenWidth + 400) * index,
              index,
            })}
          />
        </SafeAreaView>
      </Modal>

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
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={closeComments} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
      {selectedPost && (
  <FlatList
    data={commentLoading ? [] : selectedPost.comments || []}
    renderItem={renderCommentItem}
    keyExtractor={item => item.id}
    style={styles.commentsList}
    contentContainerStyle={[
      styles.commentsListContent,
      ((selectedPost.comments || []).length === 0 && !commentLoading) && styles.emptyCommentsListContent
    ]}
    ListEmptyComponent={
      commentLoading ? null : renderEmptyComments()
    }
    ListHeaderComponent={
      commentLoading ? (
        <View style={styles.commentLoadingContainer}>
          {[1, 2, 3].map((item) => (
            <View key={item}>{renderCommentSkeleton()}</View>
          ))}
        </View>
      ) : null
    }
  />
)}

          {/* Add Comment Input */}
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
              disabled={!newComment.trim()}
            >
              <Text style={[
                styles.postCommentText,
                !newComment.trim() && styles.postCommentTextDisabled
              ]}>
                Post
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  menuButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.card,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
  followButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  followButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  worksGrid: {
    padding: 1,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridVideoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: colors.black,
  },
  videoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 4,
  },
  gridVideoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 4,
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  gridOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  likeCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  aboutContainer: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '400',
  },
  skillsSection: {
    marginBottom: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  // Vertical Modal Styles
  verticalModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  verticalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  verticalModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  // Vertical Post Styles
  verticalPostContainer: {
    width: screenWidth,
    height: screenWidth + 400,
    paddingBottom: 20,
  },
  // Media Styles
  mediaItem: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
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
  // Post Detail Styles
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  postCategory: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  carouselContainer: {
    position: 'relative',
    height: screenWidth,
  },
  detailImage: {
    width: '100%',
    height: '100%',
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
    bottom: 16,
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
  postActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionButton: {
    padding: 8,
    marginRight: 16,
  },
  postLikes: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  postDescription: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  userNameText: {
    fontWeight: '600',
    color: colors.text,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  commentsPreview: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  viewCommentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewComment: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  previewCommentUser: {
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  postTimestamp: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timestampText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },
  // Comments Styles
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
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: 16,
  },
  emptyCommentsListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
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
  noSkillsText: {
    fontStyle: 'italic',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
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
  // Skeleton styles
  skeleton: {
    backgroundColor: colors.gray200,
    borderRadius: 4,
  },
  skeletonText: {
    borderRadius: 2,
  },
  // added styles
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
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
    padding: 20,
  },
  errorText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: colors.gray400,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  // Comment Skeleton Styles
  commentSkeleton: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
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
  commentLoadingContainer: {
    paddingVertical: 8,
  },
  // Update existing styles for better media handling
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: colors.black,
  },
  mediaItem: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative',
  },
});

export default DesignerProfileScreen;