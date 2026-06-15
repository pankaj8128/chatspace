import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const { rooms, fetchRooms, roomsLoading, joinRoom } = useChat();
  const navigation = useNavigation<any>();

  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const { createRoom } = useChat();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setCreateError('Room name is required');
      return;
    }
    setCreating(true);
    setCreateError('');
    const result = await createRoom(newRoomName.trim(), newRoomDesc.trim());
    setCreating(false);
    if (result.success) {
      setNewRoomName('');
      setNewRoomDesc('');
      setShowCreate(false);
      joinRoom(result.room);
      navigation.navigate('ChatRoom', { roomName: result.room.name });
    } else {
      setCreateError(result.message);
    }
  };

  const handleJoinRoom = (room: any) => {
    joinRoom(room);
    navigation.navigate('ChatRoom', { roomName: room.name });
  };

  const isGuest = user?.username?.startsWith('guest_');

  const renderRoom = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => handleJoinRoom(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.roomHash}>#</Text>
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        {!!item.description && <Text style={styles.roomDesc} numberOfLines={1}>{item.description}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandIcon}>◈</Text>
          <Text style={styles.brandName}>ChatSpace</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>ROOMS</Text>
        {!isGuest && (
          <TouchableOpacity
            style={styles.createBtnToggle}
            onPress={() => {
              setShowCreate(!showCreate);
              setCreateError('');
            }}
          >
            <Text style={styles.createBtnText}>{showCreate ? '✕' : '＋'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showCreate && (
        <View style={styles.createForm}>
          <TextInput
            style={styles.input}
            placeholder="Room name"
            placeholderTextColor="#9ca3af"
            value={newRoomName}
            onChangeText={(text) => {
              setNewRoomName(text);
              setCreateError('');
            }}
            maxLength={30}
          />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            placeholderTextColor="#9ca3af"
            value={newRoomDesc}
            onChangeText={setNewRoomDesc}
            maxLength={150}
          />
          {!!createError && <Text style={styles.errorText}>{createError}</Text>}
          <TouchableOpacity
            style={[styles.createSubmitBtn, creating && styles.disabledBtn]}
            onPress={handleCreateRoom}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.createSubmitText}>Create Room</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {roomsLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>No rooms yet. Create one!</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <View style={styles.userProfile}>
        <Image
          source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=random&color=fff` }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.username}</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 24,
    color: '#2563eb',
    marginRight: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9ca3af',
  },
  createBtnToggle: {
    padding: 4,
  },
  createBtnText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  createForm: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 14,
    color: '#111827',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 8,
  },
  createSubmitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  createSubmitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 12,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  roomHash: {
    fontSize: 18,
    color: '#9ca3af',
    marginRight: 12,
    fontFamily: 'monospace',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  roomDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default HomeScreen;
