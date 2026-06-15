import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatScreen = () => {
  const { user } = useAuth();
  const {
    activeRoom,
    messages,
    onlineUsers,
    sendMessage,
    sendTyping,
    sendStopTyping,
    typingUsers,
    loadMoreMessages,
  } = useChat();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const roomName = route.params?.roomName || 'Room';
  const [text, setText] = useState('');
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTyping = useRef(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  const roomMessagesRaw = activeRoom ? messages[activeRoom._id] : undefined;
  const roomMessages = roomMessagesRaw || [];
  const displayMessages = React.useMemo(() => [...roomMessages].reverse(), [roomMessages]);

  // Reset pagination state when mounting new room
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setShowOnlineUsers(false);
  }, [activeRoom?._id]);

  // Update hasMore based on initial payload length
  useEffect(() => {
    if (page === 1 && roomMessages.length > 0) {
      setHasMore(roomMessages.length >= 50);
    }
  }, [roomMessages.length, page]);

  const isGuest = user?.username?.startsWith('guest_');

  const handleChangeText = (val: string) => {
    if (isGuest) return;
    setText(val);

    if (!isTyping.current) {
      isTyping.current = true;
      sendTyping();
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      sendStopTyping();
    }, 1500);
  };

  const handleSend = () => {
    if (isGuest || !text.trim()) return;
    sendMessage(text);
    setText('');
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTyping.current = false;
    sendStopTyping();
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !activeRoom) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const pagination = await loadMoreMessages(activeRoom._id, nextPage);
    setLoadingMore(false);
    if (pagination) {
      setPage(nextPage);
      setHasMore(pagination.hasMore);
    } else {
      setHasMore(false);
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwn =
      item.sender?._id === user?._id || item.sender === user?._id;
    
    // Simple visual grouping: hide avatar if same sender as previous message (which is actually next in inverted list)
    const nextMsg = displayMessages[index + 1];
    const sameSender = nextMsg && (nextMsg.sender?._id || nextMsg.sender) === (item.sender?._id || item.sender);

    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        {!isOwn && (
          <View style={styles.avatarContainer}>
            {!sameSender && (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {item.sender?.username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.bubbleContainer}>
          {!isOwn && !sameSender && (
            <View style={styles.metaInfo}>
              <Text style={styles.senderName}>{item.sender?.username}</Text>
              <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            </View>
          )}
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{item.content}</Text>
            {isOwn && <Text style={styles.bubbleTimeOwn}>{formatTime(item.createdAt)}</Text>}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!activeRoom) return null;
    const typers = [...(typingUsers[activeRoom._id] || [])];
    if (typers.length === 0) return null;

    let label = '';
    if (typers.length === 1) label = `${typers[0]} is typing...`;
    else if (typers.length === 2) label = `${typers[0]} and ${typers[1]} are typing...`;
    else label = `${typers.length} people are typing...`;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{label}</Text>
      </View>
    );
  };

  const onlineUsersList = activeRoom ? onlineUsers[activeRoom._id] || [] : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}># {roomName}</Text>
        <TouchableOpacity 
          style={styles.headerRightBtn} 
          onPress={() => setShowOnlineUsers(!showOnlineUsers)}
        >
          <Text style={styles.headerRightBtnText}>👥 {onlineUsersList.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Online Users Popup Backdrop */}
      {showOnlineUsers && (
        <Pressable 
          style={[StyleSheet.absoluteFill, { zIndex: 90 }]} 
          onPress={() => setShowOnlineUsers(false)} 
        />
      )}

      {/* Online Users Popup */}
      {showOnlineUsers && (
        <View style={styles.onlinePopupContainer}>
          <View style={styles.onlinePopup}>
            <Text style={styles.onlinePopupTitle}>Online Users</Text>
            {onlineUsersList.length === 0 ? (
              <Text style={styles.onlinePopupText}>No one else is here.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 200 }}>
                {onlineUsersList.map((u: any, idx: number) => (
                  <View key={idx} style={styles.onlinePopupItem}>
                    <View style={styles.onlinePopupDot} />
                    <Text style={styles.onlinePopupText}>{u.username || u}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Messages */}
      {roomMessagesRaw === undefined ? (
        <View style={styles.initialLoadContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.initialLoadText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={displayMessages} // Assumed sorted descending by backend or we must invert it
          inverted // Critical for chat: renders bottom up
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 10 }} color="#2563eb" /> : null}
        />
      )}

      {/* Typing Indicator */}
      {renderTypingIndicator()}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isGuest && styles.inputDisabled]}
            placeholder={isGuest ? 'Guest view only. Create account to chat.' : `Message #${roomName}`}
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={handleChangeText}
            editable={!isGuest}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (isGuest || !text.trim()) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={isGuest || !text.trim()}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backBtnText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightBtn: {
    paddingVertical: 6,
    paddingLeft: 12,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  headerRightBtnText: {
    fontSize: 16,
    color: '#4b5563',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8, // Requires RN 0.71+
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    marginRight: 6,
  },
  timeText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleOther: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
    alignItems: 'flex-end',
  },
  bubbleText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  bubbleTextOwn: {
    color: '#ffffff',
  },
  bubbleTimeOwn: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  typingText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 44,
    maxHeight: 100,
    fontSize: 15,
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
  },
  onlinePopupContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 70, // approximate header height
    right: 16,
    zIndex: 100,
    elevation: 10,
  },
  onlinePopup: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minWidth: 160,
  },
  onlinePopupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  onlinePopupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  onlinePopupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 10,
  },
  onlinePopupText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  initialLoadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialLoadText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default ChatScreen;
