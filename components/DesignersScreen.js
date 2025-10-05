import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './Config';

const DesignersScreen = ({ navigation }) => {
  //const BASE_URL = "https://d09d54f9f906.ngrok-free.app/";
  const [designers, setDesigners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDesigners, setFilteredDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  //const [currentUserId, setCurrentUserId] = useState(null);


 

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken'); 
     const response = await fetch(`${BASE_URL}/api/designers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch designers');
      }
        const data = await response.json();

     

        // Map designers to include full image URL (fall back to placeholder)
        const designersWithFullImageUrl = data.map(d => ({
          ...d,
          image: d.profileimage
            ? `${BASE_URL}${d.profileimage}`
            : 'https://randomuser.me/api/portraits/men/1.jpg',
        }));

        setDesigners(designersWithFullImageUrl);
        setFilteredDesigners(designersWithFullImageUrl);
      } catch (error) {
        console.error("Failed to fetch designers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigners();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDesigners(designers);
    } else {
      const filtered = designers.filter(designer =>
        (designer.firstname || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (designer.specialty || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredDesigners(filtered);
    }
  }, [searchQuery, designers]);

  const handleMessageDesigner = (designer) => {
    navigation.navigate('ChatScreen', { designer });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a6bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
    <Ionicons name="chevron-back" size={24} color="#4a6bff" />
  </TouchableOpacity>
  <View style={styles.headerTitleContainer}>
    <Text style={styles.headerTitle}>Available Designers</Text>
  </View>
  
</View>


      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search designers by name"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Designers List */}
      <ScrollView contentContainerStyle={styles.designersContainer}>
        {filteredDesigners.length > 0 ? (
          filteredDesigners.map(designer => (
            <View key={designer.user_id} style={styles.designerCard}>
              <Image
               source={{ uri: `${BASE_URL}/${designer.profileimage}` }}

                style={styles.designerImage}
                defaultSource={require('../assets/profile-placeholder.png')}
              />
              <View style={styles.designerInfo}>
                <Text style={styles.designerName}>{designer.firstname+" "+designer.lastname}</Text>
                <Text style={styles.designerBio} numberOfLines={2}>{designer.bio}</Text>
              </View>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => handleMessageDesigner(designer)}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#4a6bff" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={50} color="#ccc" />
            <Text style={styles.noResultsText}>No designers found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </View>
        )}
      </ScrollView>

            {/* Floating Inbox Button */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Inbox')} 
        style={styles.floatingInboxButton}
      >
        <Ionicons name="mail" size={24} color="white" />
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  // ... Your existing styles unchanged ...
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop:25,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6bff',
    marginTop: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  designersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  designerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  designerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  designerInfo: {
    flex: 1,
  },
  designerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  designerBio: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  messageButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  messageButtonText: {
    color: '#4a6bff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  floatingInboxButton: {
    position: 'absolute',
    bottom: 35,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a6bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default DesignersScreen;
