/**
 * src/hooks/useAuth.ts — Mobile useAuth hook
 *
 * Re-export the context hook for consistent naming across the codebase.
 * Components import from '@/hooks/useAuth' rather than the context directly.
 *
 * Usage:
 *   const { user, token, isLoading, login, logout } = useAuth();
 */

export { useAuth } from '@/context/AuthContext';
