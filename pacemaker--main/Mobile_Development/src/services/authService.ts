/**
 * src/services/authService.ts — Mobile authentication API calls (Updated for unwrapped API)
 *
 * All storage uses Expo SecureStore.
 * The apiClient interceptor now auto-unwraps the { success, data } object.
 */

import * as SecureStore from 'expo-secure-store';
import apiClient, { TOKEN_KEY, USER_KEY } from '@/api/client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/api';

// ── API methods ───────────────────────────────────────────────────────────────

/**
 * Authenticate with email + password.
 * Persists JWT and user object in SecureStore.
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  // apiClient auto-unwraps ApiResponse, so 'data' IS the AuthResponse
  const { data: authData } = await apiClient.post<AuthResponse>(
    '/auth/login',
    payload
  );

  if (!authData || !authData.token) {
    throw new Error('Invalid response from server');
  }

  // Persist to Expo SecureStore
  await SecureStore.setItemAsync(TOKEN_KEY, authData.token);
  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify({
      id:    0,
      name:  authData.name,
      email: payload.email,
      role:  authData.role,
      enabled: true,
    } satisfies User)
  );

  return authData;
}

/**
 * Register a new account.
 * Returns the backend's success message.
 */
export async function register(payload: RegisterRequest): Promise<string> {
  // apiClient auto-unwraps, so 'data' IS the message string from ApiResponse<String>
  const { data: message } = await apiClient.post<string>(
    '/auth/register',
    payload
  );

  return message || 'Registration successful';
}

/**
 * Clear all auth data from SecureStore.
 */
export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
