const express = require("express");
const router = express.Router();
const { sendMessage, getSessionHistory } = require("../controllers/chatController");
const { optionalAuth } = require("../middleware/authMiddleware");

// UC05/UC06: Chat voi AI - cho phep ca khach an danh
router.post("/", optionalAuth, sendMessage);
router.get("/:sessionId", optionalAuth, getSessionHistory);

module.exports = router;
