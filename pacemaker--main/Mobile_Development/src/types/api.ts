/**
 * src/types/api.ts — Shared TypeScript types for the Mobile app
 * Mirrors the backend DTOs (com.marrow.example.dto.*)
 */

// ── Generic wrapper (mirrors ApiResponse<T>) ──────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
}

export interface AuthResponse {
  token: string;
  name: string;
  role: string;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
}

// ── Course ────────────────────────────────────────────────────────────────────

export interface Course {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt?: string;
}
