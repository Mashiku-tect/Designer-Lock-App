import React, { useState, useEffect, useRef } from 'react';
import { Video } from 'expo-av';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Image, Alert, Modal, TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

const ChatScreen = ({ route, navigation }) => {
  const { designer } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fullScreenItems, setFullScreenItems] = useState([]);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const scrollViewRef = useRef();
  
  const { width } = Dimensions.get('window');
  const GRID_MARGIN = 2;
  const GRID_PADDING = 8;
  const MAX_GRID_WIDTH = width * 0.8 - GRID_PADDING * 2;

  useEffect(() => {
    setMessages([
      { id: '1', text: 'Hi there! I saw your design portfolio and loved your work.', sender: 'designer', time: '10:30 AM' },
      { id: '2', text: 'Thank you! What kind of project do you have in mind?', sender: 'me', time: '10:32 AM' },
      { id: '3', text: 'I need a logo for my new coffee shop business.', sender: 'designer', time: '10:33 AM' }
    ]);
  }, []);

  const OriginalImageURL = designer.image;
  const CorrectedImageURL = OriginalImageURL.replace("appuploads", "app/uploads");

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // ========================
  // Permissions
  // ========================
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') Alert.alert('Permission required', 'Camera permission is needed');
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    if (audioStatus !== 'granted') Alert.alert('Permission required', 'Microphone permission is needed');
  };
  useEffect(() => { requestPermissions(); }, []);

  // ========================
  // Send Text
  // ========================
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const newMsg = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  // ========================
  // Add file (image/video)
  // ========================
  const addFile = (file) => {
    if (selectedFiles.length >= 10) {
      Alert.alert("Limit reached", "You can only send up to 10 items at once.");
      return;
    }
    setSelectedFiles(prev => [...prev, file]);
    setShowPreview(true);
  };

  const discardSelection = () => {
    setSelectedFiles([]);
    setShowPreview(false);
  };

  const sendSelected = () => {
    if (selectedFiles.length === 0) return;
    const batchId = Date.now().toString();
    const newMsgs = selectedFiles.map(file => ({
      ...file,
      batchId,
      id: Date.now().toString() + Math.random(),
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }));
    setMessages(prev => [...prev, ...newMsgs]);
    setSelectedFiles([]);
    setShowPreview(false);
  };

  // ========================
  // Pickers
  // ========================
  const handleGallerySelect = async () => {
    setShowAttachmentMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      result.assets.forEach(asset => {
        addFile({ type: asset.type === 'video' ? 'video' : 'image', uri: asset.uri });
      });
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All });
    if (!result.canceled) {
      addFile({ type: result.assets[0].type === 'video' ? 'video' : 'image', uri: result.assets[0].uri });
    }
  };

  // ========================
  // Audio Recording
  // ========================
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'audio',
      uri,
      name: 'Voice Note',
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setRecording(null);
  };

  // ========================
  // Full-screen viewer
  // ========================
  const openFullScreen = (batchItems) => {
    setFullScreenItems(batchItems);
    setFullScreenVisible(true);
  };

  // ========================
  // Calculate grid layout
  // ========================
  const calculateGridLayout = (items) => {
    if (!items || items.length === 0) return { items: [], containerWidth: 0 };
    
    const itemCount = items.length;
    let columns, itemSize;
    
    if (itemCount === 1) {
      columns = 1;
      itemSize = MAX_GRID_WIDTH;
    } else if (itemCount === 2 || itemCount === 4) {
      columns = 2;
      itemSize = (MAX_GRID_WIDTH - GRID_MARGIN) / 2;
    } else {
      columns = 3;
      itemSize = (MAX_GRID_WIDTH - GRID_MARGIN * 2) / 3;
    }
    
    return {
      columns,
      itemSize,
      containerWidth: MAX_GRID_WIDTH
    };
  };

  // ========================
  // Render messages
  // ========================
  const renderMessage = (message) => {
    if (message.type === 'image' || message.type === 'video') {
      const batchMessages = messages.filter(m => m.batchId === message.batchId);
      if (!batchMessages || batchMessages.length === 0) return null;
      if (batchMessages[0].id !== message.id) return null; // Only render once per batch

      const { columns, itemSize, containerWidth } = calculateGridLayout(batchMessages);
      
      return (
        <View style={[styles.messageBubble, styles.myMessage]}>
          <View style={[styles.gridContainer, { width: containerWidth }]}>
            {batchMessages.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => openFullScreen(batchMessages)}
                style={[
                  styles.gridItem, 
                  { 
                    width: itemSize, 
                    height: itemSize,
                    marginRight: (idx % columns !== columns - 1) ? GRID_MARGIN : 0,
                    marginBottom: (idx < batchMessages.length - columns) ? GRID_MARGIN : 0
                  }
                ]}
              >
                {item.type === 'image' ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
                    <Video
                      source={{ uri: item.uri }}
                      style={{ width: '100%', height: '100%' }}
                      useNativeControls
                      resizeMode="cover"
                      shouldPlay={false}
                    />
                    <View style={styles.videoOverlay}>
                      <Ionicons name="play-circle" size={32} color="white" />
                    </View>
                  </View>
                )}
                
                {/* Show count for more than 9 items */}
                {batchMessages.length > 9 && idx === 8 && (
                  <View style={styles.remainingCountOverlay}>
                    <Text style={styles.remainingCountText}>+{batchMessages.length - 9}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.messageTime}>{message.time}</Text>
        </View>
      );
    }

    if (message.type === 'audio') {
      return (
        <View style={[styles.messageBubble, styles.myMessage]}>
          <View style={styles.audioPreview}>
            <Ionicons name="musical-notes" size={24} color="white" />
            <Text style={{ color: 'white', marginLeft: 10 }}>{message.name}</Text>
          </View>
          <Text style={styles.messageTime}>{message.time}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageBubble, message.sender === 'me' ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, message.sender === 'me' && { color: 'white' }]}>{message.text}</Text>
        <Text style={styles.messageTime}>{message.time}</Text>
      </View>
    );
  };

  // ========================
  // Attachment Menu
  // ========================
  const AttachmentMenu = () => (
    <Modal transparent={true} visible={showAttachmentMenu} animationType="fade">
      <TouchableWithoutFeedback onPress={() => setShowAttachmentMenu(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.attachmentMenu}>
        <Text style={styles.menuTitle}>Choose an option</Text>
        <TouchableOpacity style={styles.menuOption} onPress={handleGallerySelect}>
          <Ionicons name="images" size={24} color="#4a6bff" />
          <Text style={styles.menuOptionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuOption} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color="#4a6bff" />
          <Text style={styles.menuOptionText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAttachmentMenu(false)}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ========================
  // Preview Modal
  // ========================
  const PreviewModal = () => {
    const { columns, itemSize } = calculateGridLayout(selectedFiles);
    
    return (
      <Modal visible={showPreview} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Preview ({selectedFiles.length}/10)</Text>
            <View style={{ width: 24 }} /> {/* Spacer for balance */}
          </View>
          
          <ScrollView contentContainerStyle={styles.previewContainer}>
            <View style={[styles.gridContainer, { width: MAX_GRID_WIDTH }]}>
              {selectedFiles.map((file, idx) => (
                <Image 
                  key={idx} 
                  source={{ uri: file.uri }} 
                  style={[
                    styles.gridItem,
                    { 
                      width: itemSize, 
                      height: itemSize,
                      marginRight: (idx % columns !== columns - 1) ? GRID_MARGIN : 0,
                      marginBottom: (idx < selectedFiles.length - columns) ? GRID_MARGIN : 0
                    }
                  ]} 
                />
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.previewActions}>
            <TouchableOpacity onPress={discardSelection} style={styles.discardButton}>
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendSelected} style={styles.sendButtonPreview}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // ========================
  // FullScreen Viewer
  // ========================
  const FullScreenViewer = () => {
    const [zoomImage, setZoomImage] = useState(null);

    return (
      <>
        <Modal visible={fullScreenVisible} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
            <ScrollView
              contentContainerStyle={{ padding: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {fullScreenItems.map((item, idx) => (
                <View key={idx} style={{ marginBottom: 20 }}>
                  {item.type === 'image' ? (
                    <TouchableOpacity onPress={() => setZoomImage(item.uri)}>
                      <Image
                        source={{ uri: item.uri }}
                        style={{ width: '100%', aspectRatio: 1, borderRadius: 8 }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ) : (
                    <Video
                      source={{ uri: item.uri }}
                      style={{ width: '100%', aspectRatio: 1, borderRadius: 8 }}
                      useNativeControls
                      resizeMode="contain"
                      shouldPlay={true}
                    />
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullScreenVisible(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>

        <Modal visible={zoomImage !== null} transparent={true}>
          <TouchableWithoutFeedback onPress={() => setZoomImage(null)}>
            <View style={styles.zoomContainer}>
              <Image
                source={{ uri: zoomImage }}
                style={{ width: '95%', height: '80%' }}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
          <View style={styles.headerInfo}>
            <Image source={{ uri: CorrectedImageURL }} style={styles.designerImage} />
            <View>
              <Text style={styles.designerName}>{designer.firstname + " " + designer.lastname}</Text>
              <Text style={styles.designerStatus}>Online</Text>
            </View>
          </View>
          <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color="#333" /></TouchableOpacity>
        </View>

        {/* Chat */}
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messagesContainer}>
          {messages.map(msg => <View key={msg.id}>{renderMessage(msg)}</View>)}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachmentButton} onPress={() => setShowAttachmentMenu(true)}>
            <Ionicons name="attach" size={24} color="#4a6bff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#4a6bff" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color={newMessage.trim() === '' ? '#ccc' : '#4a6bff'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.micButton} onPressIn={startRecording} onPressOut={stopRecording}>
            <Ionicons name="mic" size={24} color={isRecording ? 'red' : '#4a6bff'} />
          </TouchableOpacity>
        </View>

        <AttachmentMenu />
        <PreviewModal />
        <FullScreenViewer />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Updated Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  headerInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    marginLeft: 15 
  },
  designerImage: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10 
  },
  designerName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333' 
  },
  designerStatus: { 
    fontSize: 12, 
    color: '#4CAF50' 
  },
  messagesContainer: { 
    padding: 15, 
    paddingBottom: 10 
  },
  messageBubble: { 
    maxWidth: '80%', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  myMessage: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#4a6bff', 
    borderBottomRightRadius: 2 
  },
  theirMessage: { 
    alignSelf: 'flex-start', 
    backgroundColor: 'white', 
    borderBottomLeftRadius: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 2 
  },
  messageText: { 
    fontSize: 16, 
    color: '#333' 
  },
  messageTime: { 
    fontSize: 10, 
    color: 'rgba(255,255,255,0.7)', 
    marginTop: 5, 
    alignSelf: 'flex-end' 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
  },
  attachmentButton: { 
    padding: 8 
  },
  cameraButton: { 
    padding: 8, 
    marginLeft: 5 
  },
  messageInput: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    maxHeight: 100, 
    marginHorizontal: 10, 
    fontSize: 16 
  },
  sendButton: { 
    padding: 10 
  },
  micButton: { 
    padding: 10 
  },
  audioPreview: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: '#4a6bff', 
    borderRadius: 20, 
    marginBottom: 5 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  attachmentMenu: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'white', 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    padding: 20, 
    paddingBottom: 30 
  },
  menuTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  menuOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  menuOptionText: { 
    fontSize: 16, 
    color: '#333', 
    marginLeft: 15 
  },
  cancelButton: { 
    marginTop: 15, 
    padding: 15, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  cancelButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#4a6bff' 
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  remainingCountOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  remainingCountText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewContainer: {
    padding: 15,
    alignItems: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  discardButton: {
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
  },
  discardButtonText: {
    color: 'red',
    fontWeight: '600',
  },
  sendButtonPreview: {
    padding: 15,
    backgroundColor: '#4a6bff',
    borderRadius: 10,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;