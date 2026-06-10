import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { getSocket, connectSocket } from "../services/socket";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  // messages: { [roomId]: Message[] }
  const [messages, setMessages] = useState({});
  // onlineUsers: { [roomId]: User[] }
  const [onlineUsers, setOnlineUsers] = useState({});
  // typingUsers: { [roomId]: Set<username> }
  const [typingUsers, setTypingUsers] = useState({});
  const [roomsLoading, setRoomsLoading] = useState(false);

  const typingTimeouts = useRef({});
  const activeRoomRef = useRef(activeRoom);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // ── Fetch all rooms from REST ───────────────────────────
  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const { data } = await api.get("/rooms");
      setRooms(data.rooms);
    } catch (err) {
      console.error("Failed to fetch rooms:", err.message);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // ── Join a room ─────────────────────────────────────────
  const joinRoom = useCallback(
    (room) => {
      const socket = getSocket();
      if (!socket) return;

      // Leave current room first
      if (activeRoom && activeRoom._id !== room._id) {
        socket.emit("leaveRoom", { roomId: activeRoom._id });
      }

      setActiveRoom(room);
      socket.emit("joinRoom", { roomId: room._id });
    },
    [activeRoom],
  );

  // ── Create a new room ───────────────────────────────────
  const createRoom = useCallback(async (name, description) => {
    try {
      const { data } = await api.post("/rooms", { name, description });
      setRooms((prev) => [data.room, ...prev]);
      return { success: true, room: data.room };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to create room",
      };
    }
  }, []);

  // ── Send a message ──────────────────────────────────────
  const sendMessage = useCallback(
    (content) => {
      const socket = getSocket();
      if (!socket || !activeRoom || !content.trim()) return;
      socket.emit("chatMessage", {
        roomId: activeRoom._id,
        content: content.trim(),
      });
    },
    [activeRoom],
  );

  // ── Typing indicators ───────────────────────────────────
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

  // ── Load more history (pagination) ─────────────────────
  const loadMoreMessages = useCallback(async (roomId, page) => {
    try {
      const { data } = await api.get(
        `/messages/${roomId}?page=${page}&limit=50`,
      );
      setMessages((prev) => ({
        ...prev,
        [roomId]: [...data.messages, ...(prev[roomId] || [])],
      }));
      return data.pagination;
    } catch (err) {
      console.error("Failed to load messages:", err.message);
    }
  }, []);

  // ── Socket event listeners ──────────────────────────────
  useEffect(() => {
    if (!user) return;

    let socket = getSocket();
    if (!socket) {
      const token = localStorage.getItem("token");
      if (token) {
        socket = connectSocket(token);
      }
    }
    if (!socket) return;

    const onConnect = () => {
      console.log("Socket connected/reconnected. Syncing state...");
      fetchRooms();
      if (activeRoomRef.current) {
        socket.emit("joinRoom", { roomId: activeRoomRef.current._id });
      }
    };

    const onRoomHistory = ({ roomId, messages: msgs }) => {
      setMessages((prev) => ({ ...prev, [roomId]: msgs }));
    };

    const onNewMessage = (message) => {
      setMessages((prev) => ({
        ...prev,
        [message.room]: [...(prev[message.room] || []), message],
      }));
    };

    const onOnlineUsers = ({ roomId, users }) => {
      setOnlineUsers((prev) => ({ ...prev, [roomId]: users }));
    };

    const onTyping = ({ roomId, username }) => {
      if (username === user.username) return;

      setTypingUsers((prev) => {
        const roomSet = new Set(prev[roomId] || []);
        roomSet.add(username);
        return { ...prev, [roomId]: roomSet };
      });

      // Auto-clear after 3s if stopTyping is never received
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

    const onStopTyping = ({ roomId, username }) => {
      setTypingUsers((prev) => {
        const roomSet = new Set(prev[roomId] || []);
        roomSet.delete(username);
        return { ...prev, [roomId]: roomSet };
      });
    };

    // If socket is already connected when this effect registers, trigger sync
    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("roomHistory", onRoomHistory);
    socket.on("newMessage", onNewMessage);
    socket.on("onlineUsers", onOnlineUsers);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);

    return () => {
      socket.off("connect", onConnect);
      socket.off("roomHistory", onRoomHistory);
      socket.off("newMessage", onNewMessage);
      socket.off("onlineUsers", onOnlineUsers);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
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
