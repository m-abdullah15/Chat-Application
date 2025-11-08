const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

// Store userId to socketId mapping
const userSocketMap = new Map();

const initializeSocket = (io) => {
  // Configure CORS for socket connections
  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    // Handle authentication event
    socket.on('authenticate', async (token) => {
      try {
        if (!token) {
          socket.emit('error', { message: 'Authentication token required' });
          socket.disconnect();
          return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Store userId-socketId mapping
        socket.userId = userId;
        userSocketMap.set(userId, socket.id);

        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        socket.emit('authenticated', { message: 'Authentication successful' });
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle sendMessage event
    socket.on('sendMessage', async (data) => {
      try {
        // Check if socket is authenticated
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { receiverId, content } = data;

        // Validate input
        if (!receiverId || !content) {
          socket.emit('error', { message: 'Receiver ID and content are required' });
          return;
        }

        // Save message to database
        const message = new Message({
          sender: socket.userId,
          receiver: receiverId,
          content: content.trim()
        });

        await message.save();

        // Populate sender and receiver details
        await message.populate('sender', 'username email');
        await message.populate('receiver', 'username email');

        // Prepare message object for clients
        const messageData = {
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
        };

        // Emit message to receiver if they're online
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', messageData);
        }

        // Send confirmation to sender
        socket.emit('messageSent', messageData);

        console.log(`Message sent from ${socket.userId} to ${receiverId}`);
      } catch (error) {
        console.error('Error sending message:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
};

module.exports = initializeSocket;
