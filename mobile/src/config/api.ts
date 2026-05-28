import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  // Allow override via Expo extra config or environment
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl) {
    return configUrl;
  }

  // Default: iOS simulator uses localhost, Android emulator uses 10.0.2.2
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:3000/api`;
}

function getSocketUrl(): string {
  const configUrl = Constants.expoConfig?.extra?.socketUrl;
  if (configUrl) {
    return configUrl;
  }

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:3000`;
}

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();
