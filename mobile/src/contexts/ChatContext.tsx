import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSocket, connectSocket } from "../services/socket";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});
  const [roomsLoading, setRoomsLoading] = useState(false);

  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const activeRoomRef = useRef<any>(activeRoom);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const { data } = await api.get("/rooms");
      setRooms(data.rooms);
    } catch (err: any) {
      console.error("Failed to fetch rooms:", err.message);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const joinRoom = useCallback((room: any) => {
    const socket = getSocket();
    if (!socket) return;

    if (activeRoom && activeRoom._id !== room._id) {
      socket.emit("leaveRoom", { roomId: activeRoom._id });
    }

    setActiveRoom(room);
    socket.emit("joinRoom", { roomId: room._id });
  }, [activeRoom]);

  const createRoom = useCallback(async (name: string, description: string) => {
    try {
      const { data } = await api.post("/rooms", { name, description });
      setRooms((prev) => [data.room, ...prev]);
      return { success: true, room: data.room };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || "Failed to create room" };
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    const socket = getSocket();
    if (!socket || !activeRoom || !content.trim()) return;
    socket.emit("chatMessage", { roomId: activeRoom._id, content: content.trim() });
  }, [activeRoom]);

  const sendTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !activeRoom) return;
    socket.emit("typing", { roomId: activeRoom._id });
  }, [activeRoom]);

  const sendStopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !activeRoom) return;
    socket.emit("stopTyping", { roomId: activeRoom._id });
  }, [activeRoom]);

  const loadMoreMessages = useCallback(async (roomId: string, page: number) => {
    try {
      const { data } = await api.get(`/messages/${roomId}?page=${page}&limit=50`);
      setMessages((prev) => ({
        ...prev,
        [roomId]: [...data.messages, ...(prev[roomId] || [])],
      }));
      return data.pagination;
    } catch (err: any) {
      console.error("Failed to load messages:", err.message);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let socket = getSocket();
    
    // Fallback: If not connected yet, try fetching token from AsyncStorage
    const setupSocketAsync = async () => {
      if (!socket) {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          socket = connectSocket(token);
        }
      }
      if (!socket) return;
      attachSocketListeners(socket);
    };

    const attachSocketListeners = (s: any) => {
      const onConnect = () => {
        console.log("Socket connected/reconnected. Syncing state...");
        fetchRooms();
        if (activeRoomRef.current) {
          s.emit("joinRoom", { roomId: activeRoomRef.current._id });
        }
      };

      const onRoomHistory = ({ roomId, messages: msgs }: any) => {
        setMessages((prev) => ({ ...prev, [roomId]: msgs }));
      };

      const onNewMessage = (message: any) => {
        setMessages((prev) => ({
          ...prev,
          [message.room]: [...(prev[message.room] || []), message],
        }));
      };

      const onOnlineUsers = ({ roomId, users }: any) => {
        setOnlineUsers((prev) => ({ ...prev, [roomId]: users }));
      };

      const onTyping = ({ roomId, username }: any) => {
        if (username === user.username) return;
        setTypingUsers((prev) => {
          const roomSet = new Set(prev[roomId] || []);
          roomSet.add(username);
          return { ...prev, [roomId]: roomSet };
        });

        const key = `${roomId}:${username}`;
        clearTimeout(typingTimeouts.current[key]);
        typingTimeouts.current[key] = setTimeout(() => {
          setTypingUsers((prev) => {
            const roomSet = new Set(prev[roomId] || []);
            roomSet.delete(username);
            return { ...prev, [roomId]: roomSet };
          });
        }, 3000);
      };

      const onStopTyping = ({ roomId, username }: any) => {
        setTypingUsers((prev) => {
          const roomSet = new Set(prev[roomId] || []);
          roomSet.delete(username);
          return { ...prev, [roomId]: roomSet };
        });
      };

      if (s.connected) onConnect();

      s.on("connect", onConnect);
      s.on("roomHistory", onRoomHistory);
      s.on("newMessage", onNewMessage);
      s.on("onlineUsers", onOnlineUsers);
      s.on("typing", onTyping);
      s.on("stopTyping", onStopTyping);
    };

    setupSocketAsync();

    return () => {
      const s = getSocket();
      if (s) {
        s.off("connect");
        s.off("roomHistory");
        s.off("newMessage");
        s.off("onlineUsers");
        s.off("typing");
        s.off("stopTyping");
      }
    };
  }, [user, fetchRooms]);

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoom,
        messages,
        onlineUsers,
        typingUsers,
        roomsLoading,
        fetchRooms,
        joinRoom,
        createRoom,
        sendMessage,
        sendTyping,
        sendStopTyping,
        loadMoreMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
