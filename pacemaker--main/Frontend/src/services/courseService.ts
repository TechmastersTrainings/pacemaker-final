import apiClient from '@/lib/apiClient';

export interface Course {
  id: number;
  title: string;
  description: string;
  instructorName: string;
  price: number;
  thumbnailUrl: string;
}

export const courseService = {
  async getAllCourses(): Promise<Course[]> {
    const { data } = await apiClient.get<Course[]>('/courses');
    return data;
  },

  async createCourse(course: Partial<Course>): Promise<Course> {
    const { data } = await apiClient.post<Course>('/courses', course);
    return data;
  }
};
