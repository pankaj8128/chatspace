import { io, Socket } from 'socket.io-client';

const SOCKET_URL = __DEV__ ? 'http://10.0.2.2:5000' : 'https://chatspace-xd13.onrender.com';

let socket: Socket | null = null;

export const getSocket = () => socket;

export const connectSocket = (token: string): Socket => {
  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'], // Native engines prefer direct WebSocket transports
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
