import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active users and messages in memory (in production, use a database)
let users = new Map();
let messages = [];
let rooms = new Map();

// API Routes
app.get('/api/messages', (req, res) => {
  res.json(messages.slice(-50)); // Return last 50 messages
});

app.get('/api/users', (req, res) => {
  res.json(Array.from(users.values()));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('join', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar,
      joinedAt: new Date(),
      isOnline: true
    };
    
    users.set(socket.id, user);
    
    // Send user their data
    socket.emit('user-joined', user);
    
    // Broadcast to all users that someone joined
    socket.broadcast.emit('user-connected', user);
    
    // Send current online users to the new user
    socket.emit('online-users', Array.from(users.values()));
    
    // Send recent messages to the new user
    socket.emit('message-history', messages.slice(-50));
  });

  // Handle sending messages
  socket.on('send-message', (messageData) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      text: messageData.text,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      timestamp: new Date(),
      reactions: {}
    };

    messages.push(message);
    
    // Keep only last 100 messages in memory
    if (messages.length > 100) {
      messages = messages.slice(-100);
    }

    // Broadcast message to all connected users
    io.emit('new-message', message);
  });

  // Handle typing indicators
  socket.on('typing-start', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', { user, isTyping: true });
    }
  });

  socket.on('typing-stop', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', { user, isTyping: false });
    }
  });

  // Handle message reactions
  socket.on('add-reaction', (data) => {
    const { messageId, emoji } = data;
    const user = users.get(socket.id);
    
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (message) {
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = [];
      }
      
      const existingReaction = message.reactions[emoji].find(r => r.userId === user.id);
      if (!existingReaction) {
        message.reactions[emoji].push({
          userId: user.id,
          username: user.username
        });
        
        io.emit('reaction-added', { messageId, emoji, user });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Broadcast to all users that someone left
      socket.broadcast.emit('user-disconnected', user);
      
      console.log('User disconnected:', user.username);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});