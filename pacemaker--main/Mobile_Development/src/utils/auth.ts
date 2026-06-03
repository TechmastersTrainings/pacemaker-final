/**
 * src/utils/auth.ts — Mobile auth utility helpers
 *
 * Pure async helpers that read/write Expo SecureStore.
 * No React dependency — safe to call anywhere.
 */

import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'token';
export const USER_KEY  = 'user';

/** Read JWT from SecureStore. */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** Returns true when a JWT exists (does NOT validate expiry). */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

/** Clear all auth keys from SecureStore. */
export async function clearAuthStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

/**
 * Parse a JWT payload without verifying the signature.
 * Useful for reading the expiry claim client-side.
 */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    // React Native's atob equivalent:
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/** Returns true if the stored JWT has expired. */
export async function isTokenExpired(): Promise<boolean> {
  const token = await getToken();
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload['exp'] !== 'number') return true;
  return Date.now() >= (payload['exp'] as number) * 1000;
}
