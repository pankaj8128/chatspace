const Message = require("../models/Message");
const Room = require("../models/Room");
const roomManager = require("./roomManager");

/**
 * socketHandler.js
 *
 * Registers all Socket.io event handlers on the server.
 * Called once per connected socket.
 */
const socketHandler = (io, socket) => {
  const user = socket.user; // Set by authenticateSocket middleware
  console.log(`Socket connected: ${socket.id} | User: ${user.username}`);

  // 1. Add user to online users list globally in memory
  roomManager.addOnlineUser(
    user._id,
    {
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
    },
    socket.id,
  );

  // 2. Find all rooms they are a member of and join the socket to them
  const initUserRooms = async () => {
    try {
      const userRooms = await Room.find({ members: user._id });
      userRooms.forEach((room) => {
        socket.join(room._id.toString());
      });

      // Broadcast updated online users to all their rooms
      for (const room of userRooms) {
        const onlineInRoom = await roomManager.getOnlineUsersInRoom(room._id);
        io.to(room._id.toString()).emit("onlineUsers", {
          roomId: room._id,
          users: onlineInRoom,
        });
      }
    } catch (err) {
      console.error("Error initializing user rooms on connect:", err.message);
    }
  };
  initUserRooms();

  // EVENT: joinRoom
  // Client sends: { roomId }
  socket.on("joinRoom", async ({ roomId }) => {
    try {
      if (!roomId) {
        return socket.emit("error", { message: "roomId is required" });
      }

      // Verify room exists in DB
      const room = await Room.findById(roomId);
      if (!room) {
        return socket.emit("error", { message: "Room not found" });
      }

      // Join Socket.io room (ensures socket is connected to this room's channel)
      socket.join(roomId);

      // Add user to room's members list in DB (if not already)
      await Room.findByIdAndUpdate(
        roomId,
        { $addToSet: { members: user._id } },
        { new: true },
      );

      // Send last 50 messages (chat history) to the joining user only
      const history = await Message.find({ room: roomId, isDeleted: false })
        .populate("sender", "username avatar")
        .sort({ createdAt: -1 })
        .limit(50);

      socket.emit("roomHistory", {
        roomId,
        messages: history.reverse(), // Oldest first
      });

      // Broadcast updated online users list to everyone in the room
      const onlineUsers = await roomManager.getOnlineUsersInRoom(roomId);
      io.to(roomId).emit("onlineUsers", { roomId, users: onlineUsers });

      // Notify others that a new user joined
      socket.to(roomId).emit("userJoined", {
        roomId,
        user: {
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
        },
        message: `${user.username} joined the room`,
      });

      console.log(`${user.username} joined room: ${room.name}`);
    } catch (error) {
      console.error("joinRoom error:", error.message);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // EVENT: leaveRoom
  // Client sends: { roomId }
  socket.on("leaveRoom", ({ roomId }) => {
    if (!roomId) return;

    // We do NOT call socket.leave or remove from roomManager.
    // Instead, we just broadcast stopTyping if they were typing.
    socket.to(roomId).emit("stopTyping", {
      roomId,
      username: user.username,
      userId: user._id,
    });

    console.log(`${user.username} switched away from room: ${roomId}`);
  });

  // EVENT: chatMessage
  // Client sends: { roomId, content }
  socket.on("chatMessage", async ({ roomId, content }) => {
    try {
      // Validate
      if (user.username.startsWith("guest_")) {
        return socket.emit("error", {
          message: "Guest users cannot send messages. Please register to chat.",
        });
      }

      if (!roomId || !content || !content.trim()) {
        return socket.emit("error", {
          message: "roomId and content are required",
        });
      }

      if (content.trim().length > 1000) {
        return socket.emit("error", {
          message: "Message too long (max 1000 characters)",
        });
      }

      // Verify room exists
      const room = await Room.findById(roomId);
      if (!room) {
        return socket.emit("error", { message: "Room not found" });
      }

      // Save to MongoDB
      const message = await Message.create({
        content: content.trim(),
        sender: user._id,
        room: roomId,
        messageType: "room",
      });

      // Populate sender info for the broadcast
      await message.populate("sender", "username avatar");

      // Broadcast to everyone in the room (including sender)
      io.to(roomId).emit("newMessage", {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        room: roomId,
        createdAt: message.createdAt,
      });
    } catch (error) {
      console.error("chatMessage error:", error.message);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // EVENT: typing
  // Client sends: { roomId }
  socket.on("typing", ({ roomId }) => {
    if (!roomId || user.username.startsWith("guest_")) return;
    // Broadcast to others in the room (NOT back to the sender)
    socket.to(roomId).emit("typing", {
      roomId,
      username: user.username,
      userId: user._id,
    });
  });

  // EVENT: stopTyping
  // Client sends: { roomId }
  socket.on("stopTyping", ({ roomId }) => {
    if (!roomId || user.username.startsWith("guest_")) return;
    socket.to(roomId).emit("stopTyping", {
      roomId,
      username: user.username,
      userId: user._id,
    });
  });

  // EVENT: disconnect
  socket.on("disconnect", async (reason) => {
    console.log(
      `Socket disconnected: ${socket.id} | User: ${user.username} | Reason: ${reason}`,
    );

    // Remove from in-memory global online user tracker
    const wentOfflineUserId = roomManager.removeSocket(socket.id);

    // If this was the user's last open socket connection/tab, broadcast offline status
    if (wentOfflineUserId) {
      try {
        const userRooms = await Room.find({ members: user._id });
        for (const room of userRooms) {
          const onlineInRoom = await roomManager.getOnlineUsersInRoom(room._id);
          io.to(room._id.toString()).emit("onlineUsers", {
            roomId: room._id,
            users: onlineInRoom,
          });

          io.to(room._id.toString()).emit("userLeft", {
            roomId: room._id,
            user: { userId: user._id, username: user.username },
            message: `${user.username} disconnected`,
          });
        }
      } catch (err) {
        console.error(
          "Error handling disconnect in socketHandler:",
          err.message,
        );
      }
    }
  });
};

module.exports = socketHandler;
