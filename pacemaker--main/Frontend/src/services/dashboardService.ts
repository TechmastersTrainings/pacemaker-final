import apiClient from '@/lib/apiClient';
import axios from 'axios';

// Separate client for endpoints not under /api/v1
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_HOST = process.env.NEXT_PUBLIC_API_URL || 
  (isLocalhost ? 'http://localhost:8080' : 'YOUR_RENDER_BACKEND_URL');
const baseClient = axios.create({
  baseURL: API_HOST.replace(/\/$/, ''),
  timeout: 8000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
});

baseClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AnalyticsSummary {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  totalVideos: number;
  overallScore: number;
  totalTimeSpent: string;
}

export interface StreakResponse {
  currentStreak: number;
  highestStreak: number;
  lastLoginDate: string;
}

export interface BadgeResponse {
  id: number;
  name: string;
  description: string;
  earnedAt: string;
}

export interface AchievementResponse {
  id: number;
  name: string;
  description: string;
  achievedAt: string;
}

export interface UserPoints {
  totalPoints: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface SubjectPerformance {
  subjectId: number;
  subjectName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}

// ── Mock fallback data (shown when Spring Boot is not running) ─────────────────
function mockAnalytics(): AnalyticsSummary {
  const qbankRaw = typeof window !== 'undefined' ? localStorage.getItem('lms_qbank_questions_v1') : null;
  const qbankCount = qbankRaw ? JSON.parse(qbankRaw).length : 0;
  const examsRaw = typeof window !== 'undefined' ? localStorage.getItem('lms_exams_v1') : null;
  const examsCount = examsRaw ? JSON.parse(examsRaw).length : 0;

  return {
    totalStudents: 1,
    totalCourses: 4,
    totalExams: examsCount || 3,
    totalVideos: 12,
    overallScore: 78,
    totalTimeSpent: '14h 32m',
  };
}

function mockStreak(): StreakResponse {
  return {
    currentStreak: 5,
    highestStreak: 12,
    lastLoginDate: new Date().toISOString(),
  };
}

function mockBadges(): BadgeResponse[] {
  return [
    { id: 1, name: 'First Login',     description: 'Logged in for the first time',   earnedAt: new Date().toISOString() },
    { id: 2, name: 'Quick Learner',   description: 'Completed your first quiz',       earnedAt: new Date().toISOString() },
    { id: 3, name: 'AI Explorer',     description: 'Used the AI Tutor feature',       earnedAt: new Date().toISOString() },
  ];
}

function mockPoints(): UserPoints {
  const attemptsRaw = typeof window !== 'undefined' ? localStorage.getItem('lms_exam_attempts_v1') : null;
  const attempts = attemptsRaw ? Object.values(JSON.parse(attemptsRaw)) : [];
  return {
    totalPoints: 1240 + attempts.length * 50,
    totalQuestions: 86,
    correctAnswers: 67,
  };
}

function mockAchievements(): AchievementResponse[] {
  return [
    { id: 1, name: 'Study Streak',       description: '5 day study streak achieved',      achievedAt: new Date().toISOString() },
    { id: 2, name: 'MCQ Champion',       description: 'Scored above 80% in 3 quizzes',    achievedAt: new Date().toISOString() },
    { id: 3, name: 'Clinical Thinker',   description: 'Completed an OSCE simulation',      achievedAt: new Date().toISOString() },
  ];
}

// ── Service ───────────────────────────────────────────────────────────────────
export const dashboardService = {

  async getDashboardSummary(): Promise<AnalyticsSummary> {
    try {
      const { data } = await baseClient.get<AnalyticsSummary>('/api/dashboard/summary');
      return data;
    } catch {
      return mockAnalytics();
    }
  },

  async getStudentAnalytics(): Promise<AnalyticsSummary> {
    try {
      const { data } = await baseClient.get<AnalyticsSummary>('/api/analytics/student');
      return data;
    } catch {
      return mockAnalytics();
    }
  },

  async getSubjectPerformance(subjectId: number): Promise<SubjectPerformance> {
    try {
      const { data } = await baseClient.get<SubjectPerformance>(`/api/analytics/subject/${subjectId}`);
      return data;
    } catch {
      return { subjectId, subjectName: 'General Medicine', score: 75, correctAnswers: 15, totalQuestions: 20 };
    }
  },

  async getStreak(): Promise<StreakResponse> {
    try {
      const { data } = await baseClient.get<StreakResponse>('/api/gamification/streak');
      return data;
    } catch {
      return mockStreak();
    }
  },

  async getUserBadges(): Promise<BadgeResponse[]> {
    try {
      const { data } = await baseClient.get<BadgeResponse[]>('/api/gamification/badges');
      return data;
    } catch {
      return mockBadges();
    }
  },

  async getUserPoints(): Promise<UserPoints> {
    try {
      const { data } = await baseClient.get<UserPoints>('/api/gamification/points');
      return data;
    } catch {
      return mockPoints();
    }
  },

  async getUserAchievements(): Promise<AchievementResponse[]> {
    try {
      const { data } = await baseClient.get<AchievementResponse[]>('/api/gamification/achievements');
      return data;
    } catch {
      return mockAchievements();
    }
  },

  async recordDailyLogin(): Promise<StreakResponse> {
    try {
      const { data } = await baseClient.post<StreakResponse>('/api/gamification/login');
      return data;
    } catch {
      return mockStreak();
    }
  },
};
