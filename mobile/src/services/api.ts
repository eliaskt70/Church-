import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'auth_token';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  requestOtp: (phone: string) => api.post('/auth/request-otp', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code }),
  googleSignIn: (token: string) => api.post('/auth/google', { token }),
};

// User endpoints
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: { name?: string; account_type?: string; avatar_url?: string }) =>
    api.put('/users/me', data),
  updateLocation: (latitude: number, longitude: number) =>
    api.put('/users/me/location', { latitude, longitude }),
};

// Service endpoints
export const serviceAPI = {
  getServices: (params?: {
    lat?: number;
    lng?: number;
    radius_km?: number;
    category?: string;
  }) => api.get('/services', { params }),
  getService: (id: string) => api.get(`/services/${id}`),
  createService: (data: {
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    radius_km?: number;
    photos?: string[];
  }) => api.post('/services', data),
  updateService: (id: string, data: Record<string, unknown>) => api.put(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
};

// Message endpoints
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string, page = 1, limit = 20) =>
    api.get(`/messages/${conversationId}`, { params: { page, limit } }),
  sendMessage: (receiver_id: string, content: string) =>
    api.post('/messages', { receiver_id, content }),
};

// Rating endpoints
export const ratingAPI = {
  createRating: (service_id: string, rating: number, comment?: string) =>
    api.post('/ratings', { service_id, rating, comment }),
  getServiceRatings: (serviceId: string) => api.get(`/ratings/service/${serviceId}`),
};

export default api;
