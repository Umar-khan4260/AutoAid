const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const ServiceRequest = require('./models/ServiceRequest');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

// Map to store connected providers: { [uid]: socketId }
const connectedProviders = new Map();
// Map to store connected users: { [uid]: socketId }
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Provider joins room/registers with their UID
    socket.on('register_provider', (uid) => {
        if (uid) {
            connectedProviders.set(uid, socket.id);
            console.log(`Provider ${uid} registered with socket ${socket.id}`);
        }
    });

    // User registers with their UID
    socket.on('register_user', (uid) => {
        if (uid) {
            connectedUsers.set(uid, socket.id);
            console.log(`User ${uid} registered with socket ${socket.id}. Total connected users: ${connectedUsers.size}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from provider map if applicable
        for (let [uid, socketId] of connectedProviders.entries()) {
            if (socketId === socket.id) {
                connectedProviders.delete(uid);
                console.log(`Provider ${uid} unregistered`);
                break;
            }
        }
        // Remove from user map if applicable
        for (let [uid, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(uid);
                console.log(`User ${uid} unregistered`);
                break;
            }
        }
    });

    // Chat Events
    socket.on('join_job_room', (requestId) => {
        if (requestId) {
            socket.join(`job_${requestId}`);
            console.log(`Socket ${socket.id} joined room job_${requestId}`);
        }
    });

    socket.on('send_job_message', async ({ requestId, senderId, senderModel, text }) => {
        try {
            const request = await ServiceRequest.findById(requestId);
            if (request && ['Accepted', 'In Progress'].includes(request.status)) {
                const message = {
                    senderId,
                    senderModel,
                    text,
                    timestamp: new Date(),
                    seen: false
                };
                request.messages.push(message);
                await request.save();
                
                io.to(`job_${requestId}`).emit('new_job_message', message);
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('mark_messages_seen', async ({ requestId, readerId }) => {
        try {
            const request = await ServiceRequest.findById(requestId);
            if (request) {
                let updated = false;
                request.messages.forEach(msg => {
                    // If message is NOT from the reader, mark as seen
                    if (msg.senderId !== readerId && !msg.seen) {
                        msg.seen = true;
                        updated = true;
                    }
                });
                if (updated) {
                    await request.save();
                    io.to(`job_${requestId}`).emit('messages_updated', request.messages);
                }
            }
        } catch (error) {
             console.error('Error marking messages as seen:', error);
        }
    });

});

// Make io and connectedProviders available to routes
app.set('io', io);
app.set('connectedProviders', connectedProviders);
app.set('connectedUsers', connectedUsers);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173', // Adjust if frontend port differs
    credentials: true
}));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/recommend', require('./routes/recommenderRoutes'));

app.get('/', (req, res) => {
  res.send('AutoAid Backend is running');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
