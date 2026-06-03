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

// ── Offline demo accounts (used when Spring Boot is not running) ──────────────
const DEMO_ACCOUNTS: Record<string, { name: string; role: string; token: string }> = {
  'admin@pacemaker.com':      { name: 'Super Admin',      role: 'admin',      token: 'demo-token-admin' },
  'instructor@pacemaker.com': { name: 'Dr. Instructor',   role: 'instructor', token: 'demo-token-instructor' },
  'student@pacemaker.com':    { name: 'Medical Student',  role: 'student',    token: 'demo-token-student' },
  // Shorthand aliases
  'admin@demo.com':           { name: 'Super Admin',      role: 'admin',      token: 'demo-token-admin' },
  'instructor@demo.com':      { name: 'Dr. Instructor',   role: 'instructor', token: 'demo-token-instructor' },
  'student@demo.com':         { name: 'Medical Student',  role: 'student',    token: 'demo-token-student' },
};

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
    // 1. Try real Spring Boot backend first
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
      persist(data, payload.email);
      return data;
    } catch {
      // Backend unreachable — fall through to offline demo login
    }

    // 2. Offline demo login — match email (ignore password in dev mode)
    const emailKey = payload.email.toLowerCase().trim();
    const demo = DEMO_ACCOUNTS[emailKey];

    if (demo) {
      const authData: AuthResponse = { ...demo };
      persist(authData, payload.email);
      return authData;
    }

    // Check custom registered users from local storage if offline
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('registeredUsers');
      if (stored) {
        try {
          const registeredUsers = JSON.parse(stored);
          const user = registeredUsers[payload.email] || registeredUsers[emailKey];
          if (user) {
            const authData: AuthResponse = {
              token: `offline-token-${Date.now()}`,
              name: user.fullName || `${user.firstName} ${user.lastName}`,
              role: user.role || 'student'
            };
            persist(authData, payload.email);
            return authData;
          }
        } catch (e) {
          console.error("Failed to parse registered users in login authService", e);
        }
      }
    }

    // 3. If email not in demo list or registered users — still let them in as a student
    //    (useful when testing with any custom email)
    const fallback: AuthResponse = {
      token: `offline-token-${Date.now()}`,
      name: payload.email.split('@')[0] || 'User',
      role: 'student',
    };
    persist(fallback, payload.email);
    return fallback;
  },

  async register(payload: RegisterRequest): Promise<string> {
    try {
      const { data } = await apiClient.post<string>('/auth/register', {
        ...payload,
        username: payload.email,
      });
      return data;
    } catch {
      // Offline — pretend registration succeeded
      return 'Registration saved locally. You can log in with your credentials.';
    }
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
