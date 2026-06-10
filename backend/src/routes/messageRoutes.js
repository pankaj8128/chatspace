const express = require("express");
const router = express.Router();
const { getRoomMessages, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

// All message routes require authentication
router.use(protect);

// GET  /api/messages/:roomId?page=1&limit=50
router.get("/:roomId", getRoomMessages);

// DELETE /api/messages/:messageId
router.delete("/:messageId", deleteMessage);

module.exports = router;
