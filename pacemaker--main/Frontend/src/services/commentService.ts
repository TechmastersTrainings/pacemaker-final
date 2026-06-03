import apiClient from '@/lib/apiClient';

export interface VideoComment {
  id: number;
  videoId: number;
  userId: number;
  userName: string;
  text: string;
  likes: number;
  isPinned: boolean;
  isAnswered: boolean;
  isInstructor: boolean;
  isReported: boolean;
  reportCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  replies?: VideoComment[];
}

export interface VideoCommentRequest {
  videoId: number;
  text: string;
  parentId?: number;
}

export const commentService = {
  async getCommentsByVideo(videoId: number): Promise<VideoComment[]> {
    const { data } = await apiClient.get<VideoComment[]>(`/video-comments/video/${videoId}`);
    return data;
  },

  async getAllComments(): Promise<VideoComment[]> {
    const { data } = await apiClient.get<VideoComment[]>('/video-comments');
    return data;
  },

  async getCommentById(id: number): Promise<VideoComment> {
    const { data } = await apiClient.get<VideoComment>(`/video-comments/${id}`);
    return data;
  },

  async createComment(request: VideoCommentRequest): Promise<VideoComment> {
    const { data } = await apiClient.post<VideoComment>('/video-comments', request);
    return data;
  },

  async updateComment(id: number, request: VideoCommentRequest): Promise<VideoComment> {
    const { data } = await apiClient.put<VideoComment>(`/video-comments/${id}`, request);
    return data;
  },

  async deleteComment(id: number): Promise<void> {
    await apiClient.delete(`/video-comments/${id}`);
  }
};
