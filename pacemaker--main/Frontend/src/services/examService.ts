import apiClient from '@/lib/apiClient';

// Types matching the backend Exam entity/DTO
export interface ExamQuestion {
  id: string;
  type: 'mcq' | 'truefalse' | 'match';
  text: string;
  marks: number;
  options?: string[];
  correct?: number;
  tfCorrect?: boolean;
  leftItems?: string[];
  rightItems?: string[];
  matchAnswer?: number[];
  explanation?: string;
}

export interface ExamSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanation: boolean;
  timerMode: 'countdown' | 'stopwatch';
  attemptsAllowed: 1 | 2 | 3 | 99;
}

export interface Exam {
  id: string | number;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  passingPercentage: number;
  description: string;
  questions: ExamQuestion[];
  settings: ExamSettings;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  attempts: number;
  totalQuestions?: number;
}

export interface ExamAttempt {
  examId: string;
  answers: Record<string, number | boolean | number[] | null>;
  markedForReview: string[];
  startedAt: string;
  submittedAt?: string;
  score?: number;
  passed?: boolean;
}

export interface AttemptRequest {
  examId: number;
  score: number;
  totalMarks: number;
}

// LocalStorage keys
const ATTEMPTS_KEY = 'lms_exam_attempts_v1';
const EXAMS_KEY    = 'lms_exams_v1';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getLocalExams(): Exam[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]'); } catch { return []; }
}

function saveLocalExams(exams: Exam[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(EXAMS_KEY, JSON.stringify(exams)); } catch {}
}

// ── Service ──────────────────────────────────────────────────────────────────
export const examService = {

  // ---- Get all exams: tries backend first, falls back to localStorage ----
  async getAllExams(): Promise<Exam[]> {
    try {
      const { data } = await apiClient.get<Exam[]>('/exams');
      // Sync to localStorage so we always have an offline copy
      saveLocalExams(data);
      return data;
    } catch {
      // Spring Boot not running — use local data silently
      return getLocalExams();
    }
  },

  // ---- Get single exam by id ----
  async getExamById(id: string | number): Promise<Exam> {
    try {
      const { data } = await apiClient.get<Exam>(`/exams/${id}`);
      return data;
    } catch {
      const local = getLocalExams().find(e => String(e.id) === String(id));
      if (local) return local;
      throw new Error(`Exam ${id} not found locally.`);
    }
  },

  // ---- Create exam: tries backend, always saves locally too ----
  async createExam(exam: Partial<Exam>): Promise<Exam> {
    const timestamp = new Date().toISOString();
    const localExam: Exam = {
      id: exam.id || Math.random().toString(36).substring(2, 9),
      title: exam.title || '',
      subject: exam.subject || 'General',
      duration: exam.duration || 60,
      totalMarks: exam.totalMarks || 0,
      passingPercentage: exam.passingPercentage || 50,
      description: exam.description || '',
      questions: exam.questions || [],
      settings: exam.settings || {
        shuffleQuestions: false,
        shuffleOptions: false,
        showExplanation: true,
        timerMode: 'countdown',
        attemptsAllowed: 1,
      },
      status: exam.status || 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
      attempts: 0,
    };

    try {
      const { data } = await apiClient.post<Exam>('/exams', exam);
      // Merge backend response into localStorage
      const all = getLocalExams().filter(e => String(e.id) !== String(data.id));
      saveLocalExams([...all, data]);
      return data;
    } catch {
      // Save locally when backend is down
      const all = getLocalExams().filter(e => String(e.id) !== String(localExam.id));
      saveLocalExams([...all, localExam]);
      return localExam;
    }
  },

  // ---- Update exam locally (backend endpoint pending) ----
  async updateExam(id: string | number, exam: Partial<Exam>): Promise<Exam> {
    try {
      const { data } = await apiClient.put<Exam>(`/exams/${id}`, exam);
      const all = getLocalExams().filter(e => String(e.id) !== String(id));
      saveLocalExams([...all, data]);
      return data;
    } catch {
      const existing = getLocalExams().find(e => String(e.id) === String(id));
      const updated: Exam = { ...existing!, ...exam, updatedAt: new Date().toISOString() } as Exam;
      const all = getLocalExams().filter(e => String(e.id) !== String(id));
      saveLocalExams([...all, updated]);
      return updated;
    }
  },

  // ---- Delete exam locally ----
  async deleteExam(id: string | number): Promise<void> {
    try {
      await apiClient.delete(`/exams/${id}`);
    } catch {
      // Ignore backend error — always remove locally
    }
    const all = getLocalExams().filter(e => String(e.id) !== String(id));
    saveLocalExams(all);
  },

  // ---- Submit attempt ----
  async submitAttempt(request: AttemptRequest): Promise<any> {
    try {
      const { data } = await apiClient.post('/attempts', request);
      return data;
    } catch {
      // Backend down — just return a local acknowledgement
      return { success: true, local: true, ...request };
    }
  },

  // ---- Client-side in-progress attempt persistence ----
  getAttempt(examId: string): ExamAttempt | null {
    if (typeof window === 'undefined') return null;
    try {
      const all = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
      return all[examId] || null;
    } catch { return null; }
  },

  saveAttempt(attempt: ExamAttempt): void {
    if (typeof window === 'undefined') return;
    try {
      const all = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
      all[attempt.examId] = attempt;
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
    } catch {}
  },

  clearAttempt(examId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const all = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
      delete all[examId];
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
    } catch {}
  }
};
