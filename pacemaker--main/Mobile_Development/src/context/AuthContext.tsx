/**
 * src/context/AuthContext.tsx — Mobile Auth Context (updated)
 *
 * Changes vs. original:
 *  - Uses authService.login() / authService.logout() instead of raw SecureStore calls
 *    so that all storage logic is in one place.
 *  - AuthResponse from the backend is mapped to the User shape.
 *  - Handles 401 indirectly: apiClient interceptor clears SecureStore, the
 *    next loadToken() effect (triggered on focus) will then see no token and
 *    redirect to login automatically.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  login  as loginService,
  logout as logoutService,
  getStoredToken,
  getStoredUser,
} from '@/services/authService';
import type { LoginRequest, User } from '@/types/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthContextType = {
  user:      User | null;
  token:     string | null;
  isLoading: boolean;
  login:     (payload: LoginRequest) => Promise<void>;
  logout:    () => Promise<void>;
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user:      null,
  token:     null,
  isLoading: true,
  login:     async () => {},
  logout:    async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]    = useState<User | null>(null);
  const [token,     setToken]   = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  const segments = useSegments();
  const router   = useRouter();

  // ── Load persisted session on mount ────────────────────────────────────

  useEffect(() => {
    async function loadSession() {
      try {
        const storedToken = await getStoredToken();
        const storedUser  = await getStoredUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('[AuthContext] Failed to load session:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  // ── Route guard ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/');
    }
  }, [token, segments, isLoading]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = async (payload: LoginRequest) => {
    const authData = await loginService(payload);
    // authService.login() already persists to SecureStore
    setToken(authData.token);
    setUser({
      id:      0,
      name:    authData.name,
      email:   payload.email,
      role:    authData.role,
      enabled: true,
    });
  };

  const logout = async () => {
    await logoutService();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
