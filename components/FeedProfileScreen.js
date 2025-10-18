import React, { useState, useRef,useEffect } from 'react';
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
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './Config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DesignerProfileScreen = ({ route, navigation }) => {
  const { designer } = route.params;
  //console.log('Designer data:', designer);
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
  

  // Function to open WhatsApp
  const openWhatsApp = () => {
    const phoneNumber = '+1234567890'; // Replace with actual phone number or get from designer data
    const message = 'Hello! I would like to discuss a design project with you.';
    const url = `whatsapp://send?phone=${designer.phone}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback if WhatsApp is not installed
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        Linking.openURL(webUrl);
      }
    }).catch(err => {
      console.error('Error opening WhatsApp:', err);
      // Fallback to web version
      const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      Linking.openURL(webUrl);
    });
  };
  
  useEffect(() => {
    FetchDesignerWorks();
  }, []);
  

  //fetch designer works from designer data on component mount
  const FetchDesignerWorks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(
        `${BASE_URL}/api/designers/works/${designer.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // You can now use the data, e.g., set it in state:
      const works = response.data.works;
      setDesignerWorks(works);
      console.log("Works",works);
      
      // Initialize likedPosts state based on fetched data
      const initialLikedPosts = {};
      works.forEach(post => {
        initialLikedPosts[post.id] = post.hasliked || false;
      });
      setLikedPosts(initialLikedPosts);

      console.log("Returned Data", works);
      console.log('Fetched designer works:', response.data);
      return response.data;

    } catch (error) {
      console.error('Error fetching designer works:', error);
    }
  };

  const designerStats = {
    works: 24,
    followers: '1.2K',
    following: 156,
    likes: '2.4K',
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
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const openPost = (post, index) => {
    setSelectedPost(post);
    setActivePostIndex(index);
    setActiveImageIndex(0);
    setPostModalVisible(true);
    
    // Scroll to the selected post in vertical view
    setTimeout(() => {
      verticalFlatListRef.current?.scrollToIndex({
        index: index,
        animated: false,
      });
    }, 100);
  };

  const closePost = () => {
    setPostModalVisible(false);
    setSelectedPost(null);
    setActiveImageIndex(0);
    setActivePostIndex(0);
  };

  const openComments = (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const closeComments = () => {
    setCommentModalVisible(false);
    setNewComment('');
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
    const currentPost = designerWorks.find(post => post.id === postId);
    
    // Use only one property consistently - prefer likesCount if available, otherwise use likes
    const currentLikesCount = currentPost?.likesCount || currentPost?.likes || 0;

    // Optimistically update UI - update both like status and likes count
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    // Update designer works with new likes count immediately - UPDATE ONLY ONE PROPERTY
    setDesignerWorks(prevData => 
      prevData.map(post => 
        post.id === postId 
          ? {
              ...post,
              // UPDATE ONLY ONE PROPERTY - choose either likesCount or likes
              likesCount: currentLikedStatus ? currentLikesCount - 1 : currentLikesCount + 1
              // REMOVE THIS LINE: likes: currentLikedStatus ? currentLikesCount - 1 : currentLikesCount + 1
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

    console.log('Toggle like response:', response.data);

    // If backend returns updated likes count, sync with it
    if (response.data.updatedLikesCount !== undefined) {
      setDesignerWorks(prevData => 
        prevData.map(post => 
          post.id === postId 
            ? {
                ...post,
                likesCount: response.data.updatedLikesCount
                // REMOVE THIS LINE: likes: response.data.updatedLikesCount
              }
            : post
        )
      );
    }

  } catch (error) {
    console.error('Error toggling like:', error);
    
    // Revert optimistic update if error occurs
    const currentPost = designerWorks.find(post => post.id === postId);
    const currentLikesCount = currentPost?.likesCount || currentPost?.likes || 0;
    const currentLikedStatus = likedPosts[postId];

    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]  // revert the change
    }));

    // Revert likes count - UPDATE ONLY ONE PROPERTY
    setDesignerWorks(prevData => 
      prevData.map(post => 
        post.id === postId 
          ? {
              ...post,
              // UPDATE ONLY ONE PROPERTY
              likesCount: currentLikedStatus ? currentLikesCount + 1 : currentLikesCount - 1
              // REMOVE THIS LINE: likes: currentLikedStatus ? currentLikesCount + 1 : currentLikesCount - 1
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
        console.error('No token available');
        return;
      }

      // Create a temporary comment for immediate UI update
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

      // Optimistically update the UI immediately
      const updatedWorks = designerWorks.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              comments: [...(post.comments || []), tempComment]
            }
          : post
      );

      setDesignerWorks(updatedWorks);
      
      // Update the selected post to show the new comment immediately
      setSelectedPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), tempComment]
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

  const handleVerticalScroll = (event) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const visibleItemHeight = screenWidth + 400; // Approximate height of each post
    const index = Math.round(contentOffsetY / visibleItemHeight);
    
    if (index >= 0 && index < designerWorks.length) {
      setActivePostIndex(index);
      setSelectedPost(designerWorks[index]);
      setActiveImageIndex(0);
    }
  };

 const renderGridItem = ({ item, index }) => {
  const isLiked = likedPosts[item.id];
  // Use only one property consistently
  const likesCount = item.likesCount || item.likes || 0;
  const displayLikes = likesCount;

    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => openPost(item, index)}
      >
        <Image
          source={{ uri: item.images[0] }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        {/* Show multiple images indicator */}
        {item.images.length > 1 && (
          <View style={styles.multipleImagesIndicator}>
            <Icon name="collections" size={16} color="#FFFFFF" />
          </View>
        )}
        {/* Like overlay */}
        <View style={styles.gridOverlay}>
          <View style={styles.likeContainer}>
            <Icon name="favorite" size={16} color="#FFFFFF" />
            <Text style={styles.likeCount}>{displayLikes}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageItem}>
      <Image
        source={{ uri: item }}
        style={styles.detailImage}
        resizeMode="cover"
      />
    </View>
  );

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

  const renderVerticalPost = ({ item, index }) => {
  const isLiked = likedPosts[item.id];
  // Use only one property consistently
  const likesCount = item.likesCount || item.likes || 0;
  const displayLikes = likesCount;

    const comments = item.comments || [];

    return (
      <View style={styles.verticalPostContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image
            source={{ uri: designer.avatar }}
            style={styles.postAvatar}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{designer.name}</Text>
            <Text style={styles.postCategory}>{item.category}</Text>
          </View>
        </View>

        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={item.images}
            renderItem={renderImageItem}
            keyExtractor={(img, imgIndex) => imgIndex.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / screenWidth
              );
              setActiveImageIndex(newIndex);
            }}
          />
          
          {/* Image Counter */}
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
            <TouchableOpacity style={styles.postActionButton}>
              <Icon name="share" size={24} color="#666" />
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
            <Text style={styles.userNameText}>{designer.name} </Text>
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

  const renderStatsItem = ({ item }) => (
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </View>
  );

  const statsData = [
    { label: 'Works', value: designerStats.works },
    { label: 'Followers', value: designerStats.followers },
    { label: 'Following', value: designerStats.following },
    { label: 'Likes', value: designerStats.likes },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1D1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="more-vert" size={24} color="#1D1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: designer.avatar }}
              style={styles.profileAvatar}
            />
            <View style={styles.verifiedBadge}>
              <Icon name="verified" size={16} color="#007AFF" />
            </View>
          </View>
          
          <Text style={styles.profileName}>{designer.name}</Text>
          <Text style={styles.profileRole}>{designer.bio}</Text>
          <Text style={styles.profileBio}>
           {designer.professionalsummary}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {statsData.map((stat, index) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={openWhatsApp}
            >
              <Icon name="chat" size={20} color="#007AFF" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
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
          <FlatList
            data={designerWorks}
            renderItem={renderGridItem}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.worksGrid}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* About Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Information</Text>
              <View style={styles.infoItem}>
                <Icon name="location-on" size={20} color="#666" />
                <Text style={styles.infoText}>{designer.location}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="work" size={20} color="#666" />
                <Text style={styles.infoText}>{designer.work}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="school" size={20} color="#666" />
                <Text style={styles.infoText}>{designer.education}</Text>
              </View>
            </View>

            <View style={styles.skillsSection}>
              <Text style={styles.sectionTitle}>Skills & Expertise</Text>
              <View style={styles.skillsContainer}>
                {['Brand Identity', 'UI/UX Design', 'Illustration', 'Typography', 'Motion Graphics', 'Art Direction'].map((skill) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
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
            onMomentumScrollEnd={handleVerticalScroll}
            initialScrollIndex={activePostIndex}
            snapToInterval={screenWidth + 50} // Approximate height of each post
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: screenWidth + 400, // Approximate height
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
              data={selectedPost.comments || []}
              renderItem={renderCommentItem}
              keyExtractor={item => item.id}
              style={styles.commentsList}
              contentContainerStyle={[
                styles.commentsListContent,
                (selectedPost.comments || []).length === 0 && styles.emptyCommentsListContent
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

// ... (styles remain exactly the same as in your original code)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
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
    backgroundColor: '#FFFFFF',
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
    borderColor: '#F8F8F8',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 14,
    color: '#666',
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
    color: '#1D1D1F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
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
    color: '#FFFFFF',
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
    color: '#1D1D1F',
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
    color: '#333',
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
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  // Vertical Modal Styles
  verticalModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  verticalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  verticalModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  closeButton: {
    padding: 4,
  },
  // Vertical Post Styles
  verticalPostContainer: {
    width: screenWidth,
    height: screenWidth + 400, // Approximate height for each post
    paddingBottom: 20,
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
    color: '#1D1D1F',
    marginBottom: 2,
  },
  postCategory: {
    fontSize: 14,
    color: '#666',
  },
  carouselContainer: {
    position: 'relative',
    height: screenWidth, // Full screen width for images
  },
  imageItem: {
    width: screenWidth,
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
    color: 'white',
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
    backgroundColor: 'white',
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
    color: '#1D1D1F',
  },
  postDescription: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  userNameText: {
    fontWeight: '600',
    color: '#1D1D1F',
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  commentsPreview: {
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
    marginBottom: 2,
  },
  previewCommentUser: {
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  postTimestamp: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  // Comments Styles
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

export default DesignerProfileScreen;