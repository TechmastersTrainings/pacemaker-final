import apiClient from '@/api/client';
import type { Course } from '@/types/api';

/** Fetch all courses. */
export async function getCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/v1/courses');
  return data;
}

/** Get a course by ID. */
export async function getCourseById(id: number): Promise<Course | undefined> {
  const courses = await getCourses();
  return courses.find((c) => c.id === id);
}
