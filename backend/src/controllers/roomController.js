const Room = require("../models/Room");

// GET /api/rooms — list all public rooms
const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: rooms.length, rooms });
  } catch (error) {
    next(error);
  }
};

// GET /api/rooms/:roomId — get a single room
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId).populate(
      "createdBy",
      "username avatar"
    );

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

// POST /api/rooms — create a new room
const createRoom = async (req, res, next) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Room name is required" });
    }

    // Check for duplicate name (case-insensitive)
    const existing = await Room.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) {
      return res.status(409).json({ success: false, message: "A room with this name already exists" });
    }

    const room = await Room.create({
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: req.user._id,
      members: [req.user._id],
      isPrivate: isPrivate || false,
    });

    const populated = await room.populate("createdBy", "username avatar");
    res.status(201).json({ success: true, room: populated });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    next(error);
  }
};

// DELETE /api/rooms/:roomId — delete a room (only by creator)
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this room" });
    }

    await room.deleteOne();
    res.status(200).json({ success: true, message: "Room deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllRooms, getRoomById, createRoom, deleteRoom };
