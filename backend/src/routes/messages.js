const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// POST /api/messages - Send a message (authenticated)
router.post('/', authMiddleware, messageController.sendMessage);

// GET /api/messages/chat/:userId - Get chat history with specific user (authenticated)
router.get('/chat/:userId', authMiddleware, messageController.getChatHistory);

module.exports = router;
