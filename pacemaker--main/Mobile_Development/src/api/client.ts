/**
 * src/api/client.ts — Updated Mobile Axios client
 *
 * This version includes an automatic unwrap mechanism for the ApiResponse wrapper.
 * If the backend returns { success: true, data: ... }, callers get the inner data.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ── Constants ──────────────────────────────────────────────────────────────

export const TOKEN_KEY = 'token';
export const USER_KEY  = 'user';

const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api/v1',
  ios:     'http://localhost:8080/api/v1',
  default: 'http://localhost:8080/api/v1',
}) as string;

const TIMEOUT_MS = 15_000;

// ── Create instance ────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor ────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Non-fatal
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────

apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    // 1. Handle Token Refresh
    const newToken = response.headers['authorization'] as string | undefined;
    if (newToken) {
      const bare = newToken.replace('Bearer ', '');
      await SecureStore.setItemAsync(TOKEN_KEY, bare);
    }

    // 2. Auto-Unwrap ApiResponse
    const data = response.data;
    
    // If it's a standardized ApiResponse, we unwrap the 'data' field
    // while keeping 'success' check in mind.
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === false) {
        return Promise.reject(new Error(data.message || 'Action failed'));
      }
      // Return just the inner data to the caller
      return { ...response, data: data.data };
    }

    return response;
  },
  async (error: AxiosError<{ success: boolean; message: string }>) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'));
    }

    if (!error.response) {
      return Promise.reject(new Error('Unable to reach the server. Please check your connection.'));
    }

    const { status, data } = error.response;

    if (status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }

    // Surface backend message if available
    const message = data?.message || `Request failed with status ${status}`;
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
