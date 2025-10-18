import React, { useState,useEffect } from 'react';
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
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from './Config';

const { width: screenWidth } = Dimensions.get('window');

const FeedScreen = () => {
  const navigation = useNavigation();
  const [activeIndexes, setActiveIndexes] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      console.error('No token found');
      setLoading(false);
      return;
    }
    const response = await axios.get(`${BASE_URL}/api/feed`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      }
    });

    setFeedData(response.data.feed);
  // console.log('Feed data:', response.data.feed);
  const initialLikedPosts = {};
response.data.feed.forEach(post => {
  initialLikedPosts[post.id] = post.hasliked;
});
setLikedPosts(initialLikedPosts);
  } catch (error) {
    if (error.response) {
      console.error('Fetch feed error:', error.response.data);
    } else if (error.request) {
      console.error('No response from server:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  } finally {
    setLoading(false);
  }
};

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleWhatsAppPress = (phoneNumber) => {
    const url = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on your device');
    });
  };

  const handleProfilePress = (designer) => {
    navigation.navigate('FeedProfileScreen', { designer });
  };

  const toggleLike = async (postId) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      console.error('No token found');
      return;
    }

    // Get current like status and likes count
    const currentLikedStatus = likedPosts[postId];
    const currentPost = feedData.find(post => post.id === postId);
    const currentLikesCount = currentPost?.likesCount || 0;

    // Optimistically update UI - update both like status and likes count
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    // Update feed data with new likes count immediately
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

    //console.log('Toggle like response:', response.data);

    // If backend returns updated likes count, sync with it
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
    
    // Revert optimistic update if error occurs
    const currentPost = feedData.find(post => post.id === postId);
    const currentLikesCount = currentPost?.likesCount || 0;
    const currentLikedStatus = likedPosts[postId];

    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]  // revert the change
    }));

    // Revert likes count
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
    setActiveIndexes(prev => ({
      ...prev,
      [feedId]: index,
    }));
  };

  const openComments = (post) => {
    //console.log('post',post);
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const closeComments = () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    setNewComment('');
  };

  const addComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        console.error('No token available');
        return;
      }

      // Create a temporary comment for immediate UI update
      const tempComment = {
        id: `temp-${Date.now()}`,
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
        user: {
          name: 'You', // You might want to get this from user data
          avatar: '', // Add default avatar or user's avatar
        },
        isTemp: true // Flag to identify temporary comments
      };

      // Optimistically update the UI immediately
      const updatedFeedData = feedData.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: [...post.comments, tempComment]
            }
          : post
      );

      setFeedData(updatedFeedData);
      
      // Update the selected post in modal to show the new comment immediately
      setSelectedPost(prev => ({
        ...prev,
        comments: [...prev.comments, tempComment]
      }));

      setNewComment('');

      // Call backend API
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

      // Replace temporary comment with saved comment from backend
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
      
      // Update selected post in modal
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
      
      // Revert optimistic update on error
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
    }
  };

  const renderWorkItem = ({ item }) => (
  <View style={styles.workItem}>
    <Image
      source={{ uri: item.image }}
      style={styles.workImage}
      resizeMode="cover"
    />
    {item.description && (
      <Text style={styles.description}>{item.description}</Text>
    )}
  </View>
);

  const renderCommentItem = ({ item }) => (
   
    <View style={styles.commentItem}>
      <Image 
        source={{ uri: item.user.avatar || 'https://www.istockphoto.com/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration-gm1300845620-393045799' }} 
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

  // Render empty state for comments
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
      <View style={styles.feedItem}>
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
    renderWorkItem({ item: { image: imageItem, description: item.description }, index, feedId: item.id })
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
          />
          
          {/* Image counter for multiple images */}
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
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="share" size={24} color="#666" />
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Design Feed</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="tune" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={feedData}
        renderItem={renderFeedItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
              data={selectedPost.comments}
              renderItem={renderCommentItem}
              keyExtractor={item => item.id}
              style={styles.commentsList}
              contentContainerStyle={[
                styles.commentsListContent,
                selectedPost.comments.length === 0 && styles.emptyCommentsListContent
              ]}
              ListEmptyComponent={renderEmptyComments}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  headerButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  feedItem: {
    backgroundColor: 'white',
    marginBottom: 24,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    color: '#1D1D1F',
    marginBottom: 2,
  },
  designerRole: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  whatsappButton: {
    padding: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
  },
  carouselContainer: {
    position: 'relative',
  },
  workItem: {
    width: screenWidth,
    paddingBottom: 16,
  },
  workImage: {
    width: '100%',
    height: 450,
  },
  description: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 15,
    color: '#333',
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
    color: 'white',
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
    backgroundColor: 'white',
    width: 20,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  engagementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  commentPreview: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  viewCommentsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewComment: {
    fontSize: 14,
    color: '#333',
  },
  previewCommentUser: {
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  timestamp: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timestampText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '400',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
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
    backgroundColor: '#F0F0F0',
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
    color: '#1D1D1F',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  sendingText: {
    fontSize: 12,
    color: '#999',
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
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCommentsSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  postCommentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  postCommentButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  postCommentText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  postCommentTextDisabled: {
    color: '#999',
  },
});

export default FeedScreen;