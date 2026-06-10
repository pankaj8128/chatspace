/**
 * roomManager.js
 *
 * In-memory store for tracking globally online users.
 * A user is considered online in a room if they have an active socket connection
 * and they are a member of that room in MongoDB.
 */

const Room = require("../models/Room");

// Map: userId (string) -> { userId, username, avatar, socketIds: Set<string> }
const onlineUsers = {};

// Map: socketId (string) -> userId (string)
const socketToUser = {};

const roomManager = {
  // Add a socket connection for a user
  addOnlineUser(userId, userInfo, socketId) {
    const userIdStr = userId.toString();
    socketToUser[socketId] = userIdStr;

    if (!onlineUsers[userIdStr]) {
      onlineUsers[userIdStr] = {
        userId: userInfo.userId,
        username: userInfo.username,
        avatar: userInfo.avatar,
        socketIds: new Set(),
      };
    }
    onlineUsers[userIdStr].socketIds.add(socketId);
    console.log(`[roomManager] Added socket ${socketId} for user ${userInfo.username}. Active sockets: ${onlineUsers[userIdStr].socketIds.size}`);
  },

  // Remove a socket connection
  removeSocket(socketId) {
    const userIdStr = socketToUser[socketId];
    if (!userIdStr) return null;

    delete socketToUser[socketId];

    const userObj = onlineUsers[userIdStr];
    if (userObj) {
      userObj.socketIds.delete(socketId);
      console.log(`[roomManager] Removed socket ${socketId} for user ${userObj.username}. Remaining sockets: ${userObj.socketIds.size}`);
      if (userObj.socketIds.size === 0) {
        delete onlineUsers[userIdStr];
        return userIdStr; // User went completely offline
      }
    }
    return null; // User is still online on another socket/tab
  },

  // Check if a specific user is online
  isUserOnline(userId) {
    return !!onlineUsers[userId.toString()];
  },

  // Get all online users (as an array)
  getOnlineUsers() {
    return Object.values(onlineUsers).map((u) => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar,
    }));
  },

  // Get online users in a specific room
  async getOnlineUsersInRoom(roomId) {
    try {
      const room = await Room.findById(roomId);
      if (!room) return [];

      const list = [];
      for (const memberId of room.members) {
        const memberIdStr = memberId.toString();
        if (onlineUsers[memberIdStr]) {
          list.push({
            userId: onlineUsers[memberIdStr].userId,
            username: onlineUsers[memberIdStr].username,
            avatar: onlineUsers[memberIdStr].avatar,
            socketId: [...onlineUsers[memberIdStr].socketIds][0], // Return first active socket ID
          });
        }
      }
      return list;
    } catch (error) {
      console.error("Error getting online users in room:", error);
      return [];
    }
  },
};

module.exports = roomManager;
