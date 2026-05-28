import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const TOKEN_KEY = 'auth_token';

interface User {
  id: string;
  name: string;
  phone: string;
  account_type: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, code: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        const response = await userAPI.getMe();
        setUser(response.data);
        await connectSocket();
      }
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = useCallback(async (phone: string, code: string) => {
    const response = await authAPI.verifyOtp(phone, code);
    const { token: newToken, user: userData } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(userData);
    await connectSocket();
  }, []);

  const loginWithGoogle = useCallback(async (googleToken: string) => {
    const response = await authAPI.googleSignIn(googleToken);
    const { token: newToken, user: userData } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(userData);
    await connectSocket();
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    disconnectSocket();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await userAPI.getMe();
      setUser(response.data);
    } catch {
      // ignore refresh errors
    }
  }, []);

  const value = React.useMemo(
    () => ({ user, token, loading, login, loginWithGoogle, logout, refreshUser }),
    [user, token, loading, login, loginWithGoogle, logout, refreshUser]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => useContext(AuthContext);
