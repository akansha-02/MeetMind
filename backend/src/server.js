import dotenv from 'dotenv';

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocket } from './socket/socketHandler.js';
import reminderService from './services/reminderService.js';

// Import routes
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';
import transcriptRoutes from './routes/transcripts.js';
import actionItemRoutes from './routes/actionItems.js';
import knowledgeBaseRoutes from './routes/knowledgeBase.js';

// // Load environment variables
// dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket.IO
initializeSocket(io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start reminder service
reminderService.startScheduler();


const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
