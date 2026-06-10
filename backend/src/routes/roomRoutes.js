const express = require("express");
const router = express.Router();
const { getAllRooms, getRoomById, createRoom, deleteRoom } = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

// All room routes require authentication
router.use(protect);

// GET  /api/rooms
router.get("/", getAllRooms);

// POST /api/rooms
router.post("/", createRoom);

// GET  /api/rooms/:roomId
router.get("/:roomId", getRoomById);

// DELETE /api/rooms/:roomId
router.delete("/:roomId", deleteRoom);

module.exports = router;
