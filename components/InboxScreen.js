import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './Config';

const InboxScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${BASE_URL}/api/inbox`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setChats(data);
      } catch (err) {
        console.error('Error fetching inbox:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a6bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#4a6bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Chats */}
      <ScrollView contentContainerStyle={styles.chatList}>
        {chats.length > 0 ? (
          chats.map(chat => (
            <TouchableOpacity 
              key={chat.user_id} 
              style={styles.chatCard}
              onPress={() => navigation.navigate('ChatScreen', { designer: chat })}
            >
              <Image 
                source={{ uri: `${BASE_URL}${chat.profileimage}` }}
                style={styles.avatar}
              />
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{chat.firstname} {chat.lastname}</Text>
                <Text style={styles.chatMessage} numberOfLines={1}>
                  {chat.lastMessage || 'Tap to start chatting'}
                </Text>
              </View>
              <Text style={styles.chatTime}>
                {chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString() : ''}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.centered}>
            <Text>No chats yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerButton: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#4a6bff' },
  chatList: { padding: 10 },
  chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: '600', color: '#333' },
  chatMessage: { fontSize: 14, color: '#666' },
  chatTime: { fontSize: 12, color: '#aaa' }
});

export default InboxScreen;
