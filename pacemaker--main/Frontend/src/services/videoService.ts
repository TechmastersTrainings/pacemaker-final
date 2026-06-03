import apiClient from '@/lib/apiClient';

export interface VideoResponse {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  accessLevel: string;
  category: string;
}

export const videoService = {
  async getAllVideos(): Promise<VideoResponse[]> {
    const { data } = await apiClient.get<VideoResponse[]>('/videos');
    return data;
  },

  async getVideoById(id: number): Promise<VideoResponse> {
    const { data } = await apiClient.get<VideoResponse>(`/videos/${id}`);
    return data;
  },

  async uploadVideo(formData: FormData): Promise<VideoResponse> {
    const { data } = await apiClient.post<VideoResponse>('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  },

  async deleteVideo(id: number): Promise<void> {
    await apiClient.delete(`/videos/${id}`);
  }
};
