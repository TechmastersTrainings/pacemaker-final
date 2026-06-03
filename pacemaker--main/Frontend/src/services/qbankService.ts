import apiClient from '@/lib/apiClient';

export interface QuestionResponse {
  id: number;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string;
  subject: string;
  difficulty: string;
  tags: string[];
}

export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const qbankService = {
  async getQuestions(
    subject?: string,
    tag?: string,
    difficulty?: string,
    page: number = 0,
    size: number = 10
  ): Promise<PaginationResponse<QuestionResponse>> {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (tag) params.append('tag', tag);
    if (difficulty) params.append('difficulty', difficulty);
    params.append('page', String(page));
    params.append('size', String(size));

    const { data } = await apiClient.get<PaginationResponse<QuestionResponse>>(
      `/qbank/questions?${params.toString()}`
    );
    return data;
  },

  async getQuestionsBySubject(
    subjectName: string,
    page: number = 0,
    size: number = 10
  ): Promise<PaginationResponse<QuestionResponse>> {
    const { data } = await apiClient.get<PaginationResponse<QuestionResponse>>(
      `/qbank/questions/subject/${subjectName}?page=${page}&size=${size}`
    );
    return data;
  },

  async getQuestionsByDifficulty(
    difficulty: string,
    page: number = 0,
    size: number = 10
  ): Promise<PaginationResponse<QuestionResponse>> {
    const { data } = await apiClient.get<PaginationResponse<QuestionResponse>>(
      `/qbank/questions/difficulty/${difficulty}?page=${page}&size=${size}`
    );
    return data;
  },

  async getQuestionsByTag(
    tagName: string,
    page: number = 0,
    size: number = 10
  ): Promise<PaginationResponse<QuestionResponse>> {
    const { data } = await apiClient.get<PaginationResponse<QuestionResponse>>(
      `/qbank/questions/tag/${tagName}?page=${page}&size=${size}`
    );
    return data;
  }
};
