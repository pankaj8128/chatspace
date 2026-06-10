const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    // For future 1-to-1 messaging support
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    messageType: {
      type: String,
      enum: ["room", "direct"],
      default: "room",
    },
    // Soft delete — mark as deleted without removing from DB
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Track who has read the message (useful for DMs later)
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fast room history queries (most common query)
messageSchema.index({ room: 1, createdAt: -1 });

// Index for direct message queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
