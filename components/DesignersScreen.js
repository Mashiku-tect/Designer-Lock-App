import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DesignersScreen = ({ navigation }) => {
  const [designers, setDesigners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDesigners, setFilteredDesigners] = useState([]);

  // Mock data - replace with your actual data fetching logic
  useEffect(() => {
    const mockDesigners = [
      {
        id: '1',
        name: 'Sarah Johnson',
        specialty: 'Logo Design',
        experience: '5 years',
        rating: 4.8,
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        bio: 'Specialized in minimalist logo designs and brand identity.'
      },
      {
        id: '2',
        name: 'Michael Chen',
        specialty: 'UI/UX Design',
        experience: '7 years',
        rating: 4.9,
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        bio: 'Passionate about creating intuitive user experiences.'
      },
      {
        id: '3',
        name: 'Emma Williams',
        specialty: 'Print Design',
        experience: '4 years',
        rating: 4.7,
        image: 'https://randomuser.me/api/portraits/women/68.jpg',
        bio: 'Expert in business cards, brochures and packaging design.'
      },
      {
        id: '4',
        name: 'David Kim',
        specialty: 'Illustration',
        experience: '6 years',
        rating: 4.9,
        image: 'https://randomuser.me/api/portraits/men/75.jpg',
        bio: 'Creative illustrator with a unique cartoon style.'
      },
      {
        id: '5',
        name: 'Lisa Rodriguez',
        specialty: 'Web Design',
        experience: '3 years',
        rating: 4.6,
        image: 'https://randomuser.me/api/portraits/women/63.jpg',
        bio: 'Focuses on responsive and accessible web designs.'
      },
      {
        id: '6',
        name: 'Nainei Mawazo',
        specialty: 'Web Design',
        experience: '3 years',
        rating: 4.6,
        image: 'https://randomuser.me/api/portraits/women/53.jpg',
        bio: 'Focuses on responsive and accessible web designs.'
      },
      {
        id: '7',
        name: 'Allen Mashiku',
        specialty: 'Web Design',
        experience: '3 years',
        rating: 4.6,
        image: 'https://randomuser.me/api/portraits/men/53.jpg',
        bio: 'Focuses on responsive and accessible web designs.'
      },
    ];
    
    setDesigners(mockDesigners);
    setFilteredDesigners(mockDesigners);
  }, []);

  // Filter designers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDesigners(designers);
    } else {
      const filtered = designers.filter(designer =>
        designer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        designer.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDesigners(filtered);
    }
  }, [searchQuery, designers]);

  const handleMessageDesigner = (designer) => {
    // Navigate to chat screen with the designer
    navigation.navigate('ChatScreen', { designer });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Available Designers</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search designers by name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Designers List */}
      <ScrollView contentContainerStyle={styles.designersContainer}>
        {filteredDesigners.length > 0 ? (
          filteredDesigners.map(designer => (
            <View key={designer.id} style={styles.designerCard}>
              <Image source={{ uri: designer.image }} style={styles.designerImage} />
              
              <View style={styles.designerInfo}>
                <Text style={styles.designerName}>{designer.name}</Text>
                <Text style={styles.designerSpecialty}>{designer.specialty}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{designer.rating}</Text>
                  <Text style={styles.experienceText}>• {designer.experience} experience</Text>
                </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 25
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
  designerSpecialty: {
    fontSize: 14,
    color: '#4a6bff',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    marginRight: 10,
  },
  experienceText: {
    fontSize: 14,
    color: '#666',
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
});

export default DesignersScreen;