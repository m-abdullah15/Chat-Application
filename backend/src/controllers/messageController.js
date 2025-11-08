const Message = require('../models/Message');
const mongoose = require('mongoose');

/**
 * Send a message to another user
 * @route POST /api/messages
 * @access Private
 */
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId;

    // Validate input
    if (!receiverId || !content) {
      return res.status(400).json({
        error: {
          message: 'Receiver ID and message content are required.',
          code: 'MISSING_FIELDS'
        }
      });
    }

    // Validate content is not empty after trimming
    if (content.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Message content cannot be empty.',
          code: 'EMPTY_CONTENT'
        }
      });
    }

    // Validate receiver ID format
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid receiver ID format.',
          code: 'INVALID_RECEIVER_ID'
        }
      });
    }

    // Prevent sending message to self
    if (receiverId === senderId) {
      return res.status(400).json({
        error: {
          message: 'Cannot send message to yourself.',
          code: 'SELF_MESSAGE'
        }
      });
    }

    // Create message document
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    // Populate sender and receiver details
    await message.populate([
      { path: 'sender', select: 'username email' },
      { path: 'receiver', select: 'username email' }
    ]);

    res.status(201).json({
      message: {
        id: message._id,
        sender: {
          id: message.sender._id,
          username: message.sender.username
        },
        receiver: {
          id: message.receiver._id,
          username: message.receiver.username
        },
        content: message.content,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: {
        message: 'Failed to send message.',
        code: 'SEND_MESSAGE_ERROR'
      }
    });
  }
};

/**
 * Get chat history between current user and another user
 * @route GET /api/messages/chat/:userId
 * @access Private
 */
const getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid user ID format.',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Query messages between current user and specified user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .sort({ createdAt: 1 }) // Sort chronologically (oldest first)
      .populate('sender', 'username email')
      .populate('receiver', 'username email');

    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      sender: {
        id: msg.sender._id,
        username: msg.sender.username
      },
      receiver: {
        id: msg.receiver._id,
        username: msg.receiver.username
      },
      content: msg.content,
      timestamp: msg.createdAt
    }));

    res.status(200).json({
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch chat history.',
        code: 'FETCH_HISTORY_ERROR'
      }
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
};
