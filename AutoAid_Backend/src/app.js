const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

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

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Provider joins room/registers with their UID
    socket.on('register_provider', (uid) => {
        if (uid) {
            connectedProviders.set(uid, socket.id);
            console.log(`Provider ${uid} registered with socket ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from map if provider disconnects
        for (let [uid, socketId] of connectedProviders.entries()) {
            if (socketId === socket.id) {
                connectedProviders.delete(uid);
                console.log(`Provider ${uid} unregistered`);
                break;
            }
        }
    });
});

// Make io and connectedProviders available to routes
app.set('io', io);
app.set('connectedProviders', connectedProviders);

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

app.get('/', (req, res) => {
  res.send('AutoAid Backend is running');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
