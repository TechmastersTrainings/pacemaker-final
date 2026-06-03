import apiClient from '@/lib/apiClient';

export interface StudyMaterial {
  id: number;
  title: string;
  subjectName: string;
  chapterName: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface StudyMaterialResponse {
  id: number;
  subjectName: string;
  chapterName: string;
  fileName: string;
  filePath: string;
}

export const studyMaterialService = {
  async getAllMaterials(): Promise<StudyMaterial[]> {
    const { data } = await apiClient.get<StudyMaterial[]>('/study-materials');
    return data;
  },

  async uploadMaterial(subjectName: string, chapterName: string, file: File): Promise<StudyMaterialResponse> {
    const formData = new FormData();
    formData.append('subjectName', subjectName);
    formData.append('chapterName', chapterName);
    formData.append('file', file);

    const { data } = await apiClient.post<StudyMaterialResponse>('/study-materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  },

  async downloadMaterial(id: number): Promise<Blob> {
    const response = await apiClient.get(`/study-materials/download/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async deleteMaterial(id: number): Promise<void> {
    await apiClient.delete(`/study-materials/${id}`);
  }
};
