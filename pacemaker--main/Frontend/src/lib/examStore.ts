// ============================================================
// Exam Store — Shared localStorage helpers for PaceMaker Exams
// ============================================================

export type QuestionType = 'mcq' | 'truefalse' | 'match';

export type ExamQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  // MCQ
  options?: string[];
  correct?: number; // index
  // True/False
  tfCorrect?: boolean;
  // Match
  leftItems?: string[];
  rightItems?: string[];
  matchAnswer?: number[]; // rightItems index for each leftItem
  explanation?: string;
};

export type ExamSettings = {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanation: boolean;
  timerMode: 'countdown' | 'stopwatch';
  attemptsAllowed: 1 | 2 | 3 | 99;
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  duration: number; // minutes
  totalMarks: number;
  passingPercentage: number;
  description: string;
  questions: ExamQuestion[];
  settings: ExamSettings;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  attempts: number;
};

export type ExamAttempt = {
  examId: string;
  answers: Record<string, number | boolean | number[] | null>;
  markedForReview: string[];
  startedAt: string;
  submittedAt?: string;
  score?: number;
  passed?: boolean;
};

export const EXAMS_KEY = 'lms_exams_v1';
export const ATTEMPTS_KEY = 'lms_exam_attempts_v1';

export function getExams(): Exam[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]');
  } catch { return []; }
}

export function saveExams(exams: Exam[]) {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

export function getExamById(id: string): Exam | null {
  return getExams().find(e => e.id === id) || null;
}

export function upsertExam(exam: Exam) {
  const exams = getExams();
  const idx = exams.findIndex(e => e.id === exam.id);
  if (idx >= 0) exams[idx] = exam;
  else exams.unshift(exam);
  saveExams(exams);
}

export function deleteExam(id: string) {
  saveExams(getExams().filter(e => e.id !== id));
}

export function getAttempt(examId: string): ExamAttempt | null {
  try {
    const all = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
    return all[examId] || null;
  } catch { return null; }
}

export function saveAttempt(attempt: ExamAttempt) {
  try {
    const all = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
    all[attempt.examId] = attempt;
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
  } catch {}
}

export function clearAttempt(examId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
    delete all[examId];
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
  } catch {}
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const DEFAULT_SETTINGS: ExamSettings = {
  shuffleQuestions: false,
  shuffleOptions: false,
  showExplanation: true,
  timerMode: 'countdown',
  attemptsAllowed: 1,
};
