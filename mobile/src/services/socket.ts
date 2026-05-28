import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../config/api';

const TOKEN_KEY = 'auth_token';

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket | null> => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export const onNewMessage = (callback: (message: {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}) => void) => {
  if (socket) {
    socket.on('new_message', callback);
  }
};

export const offNewMessage = (callback: (...args: unknown[]) => void) => {
  if (socket) {
    socket.off('new_message', callback);
  }
};
