const express = require("express");
const router = express.Router();
const { getAllRooms, getRoomById, createRoom, deleteRoom } = require("../controllers/roomController");
const { protect, restrictGuests } = require("../middleware/authMiddleware");

// All room routes require authentication
router.use(protect);

// GET  /api/rooms
router.get("/", getAllRooms);

// POST /api/rooms
router.post("/", restrictGuests, createRoom);

// GET  /api/rooms/:roomId
router.get("/:roomId", getRoomById);

// DELETE /api/rooms/:roomId
router.delete("/:roomId", restrictGuests, deleteRoom);

module.exports = router;
