import axios from 'axios';

const AI_BASE_URL = '/api/ai';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 45000, // AI generations can take some time
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercept responses from Next.js proxy to throw error if backend is down
aiClient.interceptors.response.use((response) => {
  if (response.data && response.data._server_connection_failed) {
    throw new Error('AI backend connection refused (caught by Next.js proxy)');
  }
  return response;
});

export type DifficultyType = 'easy' | 'medium' | 'hard' | 'exam-level';
export type LevelType = 'beginner' | 'intermediate' | 'advanced';

export interface MCQQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  explanation: string;
}

export interface MCQResponse {
  topic: string;
  difficulty: string;
  num_questions: number;
  questions: MCQQuestion[];
  is_fallback: boolean;
}

export interface ExplainResponse {
  topic: string;
  level: string;
  explanation: string;
  is_fallback: boolean;
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: Array<{ id: string; topic: string; score: number; source: string }>;
  is_fallback: boolean;
}

export interface PatientResponse {
  session_id: string;
  patient_response: string;
  case_type: string;
  turn_count: number;
  is_fallback: boolean;
}

export interface RuleBasedOut {
  weighted_score: number;
  percentile: number;
  predicted_rank_min: number;
  predicted_rank_max: number;
  performance_band: string;
  weak_subjects: string[];
  strong_subjects: string[];
  subject_breakdown: Record<string, any>;
}

export interface AIInferenceOut {
  analysis: string;
  is_fallback: boolean;
}

export interface RankResponse {
  student_id: string;
  rule_based: RuleBasedOut;
  ai_inference: AIInferenceOut;
  combined_prediction: string;
  is_fallback: boolean;
}

export const aiService = {
  // POST /generate-mcq
  async generateMCQ(topic: string, numQuestions: number = 5, difficulty: DifficultyType = 'medium'): Promise<MCQResponse> {
    try {
      const { data } = await aiClient.post<MCQResponse>('/generate-mcq', {
        topic,
        num_questions: numQuestions,
        difficulty,
      });
      return data;
    } catch (e) {
      return {
        topic,
        difficulty,
        num_questions: numQuestions,
        questions: Array.from({length: numQuestions}).map((_, i) => ({
          id: i+1,
          question: `[Fallback] What is a key concept in ${topic}?`,
          options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
          correct_answer: 'A',
          explanation: `This is a fallback explanation because the AI service is offline.`
        })),
        is_fallback: true
      };
    }
  },

  // POST /tutor/explain
  async explainTopic(topic: string, level: LevelType = 'intermediate', context: string = ''): Promise<ExplainResponse> {
    try {
      const { data } = await aiClient.post<ExplainResponse>('/tutor/explain', {
        topic,
        level,
        context,
      });
      return data;
    } catch (e) {
      return {
        topic,
        level,
        explanation: `[Fallback] Here is an explanation of ${topic} for a ${level} student. Since the AI service is unreachable, this is a simulated response indicating how the real AI service would provide detailed insights into this subject.`,
        is_fallback: true
      };
    }
  },

  // POST /tutor/ask (RAG)
  async askTutor(question: string, level: LevelType = 'intermediate', topK: number = 3): Promise<AskResponse> {
    try {
      const { data } = await aiClient.post<AskResponse>('/tutor/ask', {
        question,
        level,
        top_k: topK,
      });
      return data;
    } catch (e) {
      return {
        question,
        answer: `[Fallback] The AI service is currently unreachable. To answer your question: "${question}", you should review the core principles of your subject matter.`,
        sources: [
          { id: '1', topic: 'General Medical Knowledge', score: 0.95, source: 'Fallback Source' }
        ],
        is_fallback: true
      };
    }
  },

  // POST /simulate-patient
  async simulatePatient(
    sessionId: string,
    userMessage: string,
    caseType: string = 'chest_pain',
    resetSession: boolean = false
  ): Promise<PatientResponse> {
    try {
      const { data } = await aiClient.post<PatientResponse>('/simulate-patient', {
        session_id: sessionId,
        user_message: userMessage,
        case_type: caseType,
        reset_session: resetSession,
      });
      return data;
    } catch (e) {
      return {
        session_id: sessionId,
        patient_response: `[Fallback Patient] Doctor, I am experiencing symptoms consistent with ${caseType}. My AI connection is severed, but I'm still here in pain!`,
        case_type: caseType,
        turn_count: 1,
        is_fallback: true
      };
    }
  },

  // GET /simulate-patient/cases
  async getPatientCases(): Promise<{ available_cases: string[]; descriptions: Record<string, string> }> {
    try {
      const { data } = await aiClient.get<{ available_cases: string[]; descriptions: Record<string, string> }>('/simulate-patient/cases');
      return data;
    } catch (e) {
      return {
        available_cases: ['chest_pain', 'fever', 'headache'],
        descriptions: {
          'chest_pain': 'Simulated patient with severe chest pain (Fallback)',
          'fever': 'Simulated patient with high grade fever (Fallback)',
          'headache': 'Simulated patient with chronic headache (Fallback)',
        }
      };
    }
  },

  // POST /predict-rank
  async predictRank(
    studentId: string,
    scores: Record<string, number>,
    mockRank?: number,
    totalStudents: number = 50000,
    studyHoursPerDay: number = 8.0,
    monthsRemaining: number = 3.0,
    targetCollege: string = 'AIIMS Delhi'
  ): Promise<RankResponse> {
    try {
      const { data } = await aiClient.post<RankResponse>('/predict-rank', {
        student_id: studentId,
        scores,
        mock_rank: mockRank,
        total_students: totalStudents,
        study_hours_per_day: studyHoursPerDay,
        months_remaining: monthsRemaining,
        target_college: targetCollege,
      });
      return data;
    } catch (e) {
      const weakSubjects = Object.entries(scores || {}).filter(([k,v]) => v < 70).map(([k]) => k);
      const strongSubjects = Object.entries(scores || {}).filter(([k,v]) => v >= 70).map(([k]) => k);
      
      return {
        student_id: studentId,
        rule_based: {
          weighted_score: 75.5,
          percentile: 88.2,
          predicted_rank_min: 5000,
          predicted_rank_max: 7500,
          performance_band: 'Good',
          weak_subjects: weakSubjects.length > 0 ? weakSubjects : ['Anatomy', 'Pathology'],
          strong_subjects: strongSubjects.length > 0 ? strongSubjects : ['Physiology'],
          subject_breakdown: scores
        },
        ai_inference: {
          analysis: `[Fallback] Since the AI service is unreachable, we've generated a simulated performance review. Focus on improving your weak areas to reach ${targetCollege}.`,
          is_fallback: true
        },
        combined_prediction: 'Keep practicing consistently to secure a rank within your target range.',
        is_fallback: true
      };
    }
  },

  // PDF Trigger downloads
  getMCQDownloadUrl(topic: string, numQuestions: number = 5, difficulty: DifficultyType = 'medium'): string {
    return `${AI_BASE_URL}/generate-mcq?download=pdf&topic=${encodeURIComponent(topic)}&num_questions=${numQuestions}&difficulty=${difficulty}`;
  },

  getExplainDownloadUrl(topic: string, level: LevelType = 'intermediate', context: string = ''): string {
    return `${AI_BASE_URL}/tutor/explain?download=pdf&topic=${encodeURIComponent(topic)}&level=${level}&context=${encodeURIComponent(context)}`;
  },

  getAskDownloadUrl(question: string, level: LevelType = 'intermediate', topK: number = 3): string {
    return `${AI_BASE_URL}/tutor/ask?download=pdf&question=${encodeURIComponent(question)}&level=${level}&top_k=${topK}`;
  },

  getRankDownloadUrl(studentId: string, scores: Record<string, number>): string {
    // Rank download takes a POST request or requires generating through query/session.
    // For direct PDF link, we can construct the backend call or run it through the frontend logic.
    // Note: The /predict-rank PDF endpoint requires the same payload. 
    // We will call the API to get PDF as blob and download it.
    return `${AI_BASE_URL}/predict-rank`;
  },

  async downloadRankPdf(
    studentId: string,
    scores: Record<string, number>,
    mockRank?: number,
    totalStudents: number = 50000,
    studyHoursPerDay: number = 8.0,
    monthsRemaining: number = 3.0,
    targetCollege: string = 'AIIMS Delhi'
  ): Promise<Blob> {
    const response = await aiClient.post('/predict-rank?download=pdf', {
      student_id: studentId,
      scores,
      mock_rank: mockRank,
      total_students: totalStudents,
      study_hours_per_day: studyHoursPerDay,
      months_remaining: monthsRemaining,
      target_college: targetCollege,
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};
