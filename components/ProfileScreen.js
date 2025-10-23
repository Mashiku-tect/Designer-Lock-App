import React, { useState, useContext, useEffect  } from 'react';
import { AuthContext } from '../AuthContext';
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
  ActivityIndicator,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons, Feather, Entypo, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import BASE_URL from './Config';

const ProfileScreen = ({ navigation }) => {
  const { logout, userToken } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // New states for skills and expertise
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState([]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        setUser(response.data);
        //console.log('User data fetched:', response.data);
        
        // Initialize skills and expertise from user data if available
        if (response.data.skills) {
          setSkills(response.data.skills);
        }
        if (response.data.expertise) {
          setExpertise(response.data.expertise);
        }

        const data = response.data;
        const fullImageUrl = data.profileimage
          ? `${BASE_URL}/${data.profileimage.replace(/^\/+/, '')}`
          : 'https://randomuser.me/api/portraits/men/1.jpg';

        setProfileImage(fullImageUrl);
      } catch (error) {
        Alert.alert('Error', 'Failed to load user data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userToken]);

  // Refresh when screen is focused
  // useFocusEffect(
  //   useCallback(() => {
  //     fetchUserData();
  //   }, [])
  // );

   const handleFollower = () => {
    navigation.navigate('followerfollowingscreen', { userId: user.id,receivedactivetab:'followers' }); // replace with your target screen
  };

  const handleFollowing = () => {
    navigation.navigate('followerfollowingscreen', { userId: user.id,receivedactivetab:'following' }); // replace with your target screen
  };

  // Upload profile image to backend
  const uploadImage = async (imageUri) => {
    try {
      setUploading(true);
      const formData = new FormData();

      const filename = imageUri.split('/').pop();
      let match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('profileimage', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: filename,
        type,
      });

      const response = await axios.post(`${BASE_URL}/api/profile/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userToken}`,
        },
      });

      setProfileImage(response.data.profileImageUrl);
      setUser((prev) => ({ ...prev, profileImage: response.data.profileImageUrl }));
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile image');
      console.error(error);
    } finally {
      setUploading(false);
      setModalVisible(false);
    }
  };

  // Handle image picker from library
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setProfileImage(selectedUri);
      await uploadImage(selectedUri);
    }
  };

  // Take photo with camera
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
      const capturedUri = result.assets[0].uri;
      setProfileImage(capturedUri);
      await uploadImage(capturedUri);
    }
  };

  // Start editing a field
  const startEditing = (field, value) => {
    setEditField(field);
    setEditValue(value || '');
    setIsEditing(true);
  };

  // Save edited field - send to backend
  const saveEdit = async () => {
    try {
      setLoading(true);
      const updatedData = { [editField]: editValue };
      await axios.put(`${BASE_URL}/api/updateprofile`, updatedData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      setUser((prev) => ({ ...prev, ...updatedData }));
      setIsEditing(false);
      setEditField(null);
      setEditValue('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new skill
  const addSkill = async () => {
    if (newSkill.trim() === '') {
      Toast.show({
                 type: 'error',
                 text2: "Skill is Required",
               });
               return;
    }
    
    try {
     //const updatedSkills = [...skills, newSkill.trim()];
      const response=await axios.put(`${BASE_URL}/api/updateprofile/addskill`, { skills: newSkill }, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if(response.data.success){
        Toast.show({
                 type: 'success',
                 text2: response.data.newskill+" skill added successfully",
               });

      }
       const updatedSkills = response.data.skills || [];
      setSkills(updatedSkills);
      setNewSkill('');
    } catch (error) {
      //Alert.alert('Error', 'Failed to add skill');
      //console.error(error);
      Toast.show({
                 type: 'error',
                 text2: error.response.data.message,
               });
    }
  };

  // Delete a skill
  const deleteSkill = async (index) => {
    try {
     
    const response=  await axios.delete(`${BASE_URL}/api/updateprofile/deleteskill/${index}`, { }, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if(response.data.success){
        Toast.show({
                 type: 'success',
                 text2: response.data.removedskill+" skill removed successfully",
               });
                const updatedSkills = skills.filter((s) => s.id !== index);
    setSkills(updatedSkills);
      }
     
     
    } catch (error) {
     // Alert.alert('Error', 'Failed to delete skill');
     console.error(error);
     Toast.show({
                 type: 'error',
                 text2: 'Failed to delete skill',
               });
    }
  };

 



  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4a6bff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Failed to load user data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Image Section */}
        <View style={styles.profileImageContainer}>
          {uploading ? (
            <ActivityIndicator size="large" color="#4a6bff" />
          ) : (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
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
          <Text style={styles.name}>{user.firstname + " " + user.lastname}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity style={styles.statItem} onPress={handleFollower}>
      <Text style={styles.statNumber}>{user.followers || 0}</Text>
      <Text style={styles.statLabel}>Followers</Text>
    </TouchableOpacity>
           <TouchableOpacity style={styles.statItem} onPress={handleFollowing}>
            <Text style={styles.statNumber}>{user.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => startEditing('bio', user.bio)}
        >
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{user.bio || 'Add a bio...'}</Text>
          <Feather name="edit-2" size={18} color="#888" style={styles.editIcon} />
        </TouchableOpacity>

        {/* Work Section */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => startEditing('work', user.work)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Work</Text>
            <Feather name="edit-2" size={18} color="#888" />
          </View>
          {user.work ? (
            <Text style={styles.infoText}>{user.work}</Text>
          ) : (
            <Text style={styles.placeholderText}>Add where you work...</Text>
          )}
        </TouchableOpacity>

        {/* Professional Summary Section */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => startEditing('professionalsummary', user.professionalsummary)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Feather name="edit-2" size={18} color="#888" />
          </View>
          {user.professionalsummary ? (
            <Text style={styles.infoText}>{user.professionalsummary}</Text>
          ) : (
            <Text style={styles.placeholderText}>Add Your Professional Summary</Text>
          )}
        </TouchableOpacity>

        {/* Education Section */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => startEditing('education', user.education)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Feather name="edit-2" size={18} color="#888" />
          </View>
          {user.education ? (
            <Text style={styles.infoText}>{user.education}</Text>
          ) : (
            <Text style={styles.placeholderText}>Add your education level...</Text>
          )}
        </TouchableOpacity>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills/Expertise</Text>
          </View>
          
          {/* Add Skill Input */}
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Add a skill or expertise"
              value={newSkill}
              onChangeText={setNewSkill}
            />
            <TouchableOpacity style={styles.addItemButton} onPress={addSkill}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
{/* Skills List */}
{skills.length > 0 ? (
  <View style={styles.itemsList}>
    {skills.map((skill) => (
      <View key={skill.id} style={styles.itemChip}>
        <Text style={styles.itemChipText}>{skill.skill}</Text>
        <TouchableOpacity 
          style={styles.deleteItemButton}
          onPress={() => deleteSkill(skill.id)}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    ))}
  </View>
) : (
  <Text style={styles.placeholderText}>No skills/expertise added yet</Text>
)}

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
            value={user.phonenumber} 
            onPress={() => startEditing('phone', user.phonenumber)}
          />
          
          <InfoItem 
            icon="map-pin" 
            label="Location" 
            value={user.location || 'Not specified'} 
            onPress={() => startEditing('location', user.location)}
          />
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <ActionButton 
            icon="settings" 
            label="Settings" 
            //onPress={() => navigation.navigate('Settings')}
          />
          
          <ActionButton 
            icon="help-circle" 
            label="Help & Support" 
            //onPress={() => navigation.navigate('Help')}
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
    
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4a6bff',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    right: 160,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bioText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  editIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  // Skills and Expertise Styles
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginRight: 10,
  },
  addItemButton: {
    backgroundColor: '#4a6bff',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  itemChipText: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  deleteItemButton: {
    backgroundColor: '#ff4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 10,
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
    textAlign: 'center',
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
  imageOptionCancel: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  imageOptionTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a6bff',
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileScreen;