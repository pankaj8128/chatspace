const Message = require("../models/Message");
const Room = require("../models/Room");

// GET /api/messages/:roomId — paginated chat history for a room
const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    const messages = await Message.find({ room: roomId })
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      room: roomId,
    });

    res.status(200).json({
      success: true,
      // Reverse so client gets oldest-first order
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/messages/:messageId — soft delete a message (only by sender)
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message",
      });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoomMessages, deleteMessage };
