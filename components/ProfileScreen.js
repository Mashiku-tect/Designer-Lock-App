import React, { useState,useContext,useEffect  } from 'react';
import { AuthContext } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Image, 
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons, Feather, FontAwesome, Entypo } from '@expo/vector-icons';



const ProfileScreen = ({ navigation }) => {
  // User data state
  const [user, setUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
 const [profileimage, setProfileImage] = useState(null);

  //fetch user data
const fetchUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
        console.warn('No token found');
        return;
      }
    const res = await axios.get('https://6d278b6c5fda.ngrok-free.app/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(res.data.user);
    console.log('Fetched user profile:', res.data.user);
    setProfileImage(`https://6d278b6c5fda.ngrok-free.app${res.data.user.profileimage}`);
  } catch (err) {
    console.error('Error fetching profile:', err);
    Alert.alert('Error', 'Failed to load profile');
  }
};

useEffect(() => {
  console.log("Running fetchUserProfile...");
  fetchUserProfile();
}, []);

//Upload profile image function
const uploadImage = async (uri) => {
  const token = await AsyncStorage.getItem('userToken');
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  });

  try {
    const res = await axios.put('https://6d278b6c5fda.ngrok-free.app/api/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    const newImageUrl = `https://6d278b6c5fda.ngrok-free.app${res.data.profileImage}`;
    setProfileImage(newImageUrl);
    setLoading(false);
    setModalVisible(false);
    Alert.alert('Success', 'Profile image updated');
  } catch (err) {
    console.error('Upload failed:', err);
    setLoading(false);
    Alert.alert('Error', 'Image upload failed');
  }
};


//end of fetch user profile
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { logout } = useContext(AuthContext);

  // Handle image upload
  const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    setLoading(true);
    uploadImage(result.assets[0].uri);
  }
};


  // Take photo
 const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'We need camera permission to take photos');
    return;
  }

  let result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    setLoading(true);
    uploadImage(result.assets[0].uri);
  }
};


  // Start editing a field
  const startEditing = (field, value) => {
    setEditField(field);
    setEditValue(value);
    setIsEditing(true);
  };

  // Save edited field
  // const saveEdit = () => {
  //   setUser({ ...user, [editField]: editValue });
  //   setIsEditing(false);
  //   setEditField(null);
  //   setEditValue('');
  // };
  const saveEdit = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const updatedField = { [editField]: editValue };

    setLoading(true);

    const response = await axios.put('https://6d278b6c5fda.ngrok-free.app/api/updateprofile', updatedField, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Update user state with new data from backend (or local if not returned)
    setUser(prevUser => ({
      ...prevUser,
      [editField]: editValue,
    }));

    Alert.alert('Success', `${editField} updated successfully`);
  } catch (error) {
    console.error(`Failed to update ${editField}:`, error);
    Alert.alert('Error', `Failed to update ${editField}`);
  } finally {
    setLoading(false);
    setIsEditing(false);
    setEditField(null);
    setEditValue('');
  }
};


  if(!user || loading) {
 return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Image Section */}
        <View style={styles.profileImageContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#4a6bff" />
          ) : (
            <Image source={{ uri:profileimage }} style={styles.profileImage} />
          )}
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Name and Username */}
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{user.firstname}</Text>
          {/* <Text style={styles.username}>{user.username}</Text> */}
        </View>

        {/* Bio */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => startEditing('bio', user.bio)}
        >
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
          <Feather name="edit-2" size={18} color="#888" style={styles.editIcon} />
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
  
            <Text style={styles.statLabel}>Total Works Completed Or Done Before </Text>
            <Text style={styles.statNumber}>{user.posts} Posts</Text>
          </View>
         
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <InfoItem 
            icon="mail" 
            label="Email" 
            value={user.email} 
            onPress={() => startEditing('email', user.email)}
          />
          
          <InfoItem 
            icon="phone" 
            label="Phone" 
            value={user.phone} 
            onPress={() => startEditing('phone', user.phonenumber)}
          />
          
          <InfoItem 
            icon="map-pin" 
            label="Location" 
            value={user.location} 
            onPress={() => startEditing('location', 'Tanzania')}
          />
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Links</Text>
          
          <InfoItem 
            icon="globe" 
            label="Website" 
            value={user.website} 
            onPress={() => startEditing('website', user.website)}
          />
          
          <InfoItem 
            icon="instagram" 
            label="Instagram" 
            value={user.instagram} 
            onPress={() => startEditing('instagram', user.instagram)}
          />
          
          <InfoItem 
            icon="twitter" 
            label="Twitter" 
            value={user.twitter} 
            onPress={() => startEditing('twitter', user.x)}
          />
           <InfoItem 
            icon="whatsapp" 
            label="WhatsApp" 
            value={user.whatsapp} 
            onPress={() => startEditing('Whatsapp', user.phonenumber)}
          />
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <ActionButton 
            icon="settings" 
            label="Settings" 
            onPress={() => navigation.navigate('Settings')}
          />
          
          <ActionButton 
            icon="help-circle" 
            label="Help & Support" 
            onPress={() => navigation.navigate('Help')}
          />
          
          <ActionButton 
            icon="log-out" 
            label="Log Out" 
            onPress={() => logout()}
            isLast
          />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditing}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit {editField}</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              multiline={editField === 'bio'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={saveEdit}
              >
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageModalContainer}>
            <Text style={styles.modalTitle}>Change Profile Photo</Text>
            
            <TouchableOpacity 
              style={styles.imageOption}
              onPress={pickImage}
            >
              <Ionicons name="image" size={24} color="#000" />
              <Text style={styles.imageOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imageOption}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color="#000" />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imageOption}
              onPress={() => {
                setProfileImage('https://randomuser.me/api/portraits/men/1.jpg');
                setModalVisible(false);
              }}
            >
              <MaterialIcons name="delete" size={24} color="#ff4444" />
              <Text style={styles.imageOptionTextDelete}>Remove Current Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.imageOption, styles.imageOptionCancel]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.imageOptionTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
  }
};

// Reusable Info Item Component
const InfoItem = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.infoItem} onPress={onPress}>
    <View style={styles.infoIcon}>
      <Feather name={icon} size={20} color="#888" />
    </View>
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
    <Feather name="edit-2" size={18} color="#888" />
  </TouchableOpacity>
);

// Reusable Action Button Component
const ActionButton = ({ icon, label, onPress, isLast }) => (
  <TouchableOpacity 
    style={[
      styles.actionButton, 
      !isLast && styles.actionButtonBorder
    ]} 
    onPress={onPress}
  >
    <Feather name={icon} size={20} color="#888" />
    <Text style={styles.actionButtonText}>{label}</Text>
    <Entypo name="chevron-right" size={20} color="#888" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop:20
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6bff',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    right: 100,
    bottom: 0,
    backgroundColor: '#4a6bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#888',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  editIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  actionButtonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#4a6bff',
    borderRadius: 6,
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#888',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    color: 'white',
  },
  imageModalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    paddingBottom: 10,
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  imageOptionTextDelete: {
    fontSize: 16,
    marginLeft: 15,
    color: '#ff4444',
  },
  imageOptionCancel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOptionTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a6bff',
  },
});

export default ProfileScreen;