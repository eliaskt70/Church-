import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import serviceRoutes from './routes/services';
import messageRoutes from './routes/messages';
import ratingRoutes from './routes/ratings';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings', ratingRoutes);

// Socket.io for real-time messaging
const chatNamespace = io.of('/chat');
chatNamespace.on('connection', (socket) => {
  console.log('User connected to chat:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('send_message', (data: { receiver_id: string; message: unknown }) => {
    chatNamespace.to(data.receiver_id).emit('new_message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from chat:', socket.id);
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Qarib server running on port ${PORT}`);
  });
}

export { io, chatNamespace };
export default app;
