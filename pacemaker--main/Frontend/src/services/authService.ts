import apiClient from '@/lib/apiClient';

export interface AuthResponse {
  token: string;
  name: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
}



function persist(data: AuthResponse, email: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', data.token);
  localStorage.setItem('currentUser', data.name);
  localStorage.setItem('userRole', data.role.toLowerCase());
  localStorage.setItem('currentUserEmail', email);
}

// ── Service ──────────────────────────────────────────────────────────────────
export const authService = {

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    persist(data, payload.email);
    return data;
  },
  async register(payload: RegisterRequest): Promise<string> {
    const { data } = await apiClient.post<string>('/auth/register', {
      ...payload,
      username: payload.email,
    });
    return data;
  },

  logout() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUserEmail');
    window.location.href = '/login';
  }
};
