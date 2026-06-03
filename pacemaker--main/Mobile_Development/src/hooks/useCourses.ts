/**
 * src/hooks/useCourses.ts — Mobile course management hook
 *
 * Provides a simple API to fetch and manage courses state within components.
 *
 * Usage:
 *   const { courses, isLoading, error, refetch } = useCourses();
 */

import { useState, useEffect, useCallback } from 'react';
import { getCourses } from '@/services/courseService';
import type { Course } from '@/types/api';

interface UseCoursesReturn {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses, refreshCount]);

  const refetch = () => setRefreshCount((prev) => prev + 1);

  return { courses, isLoading, error, refetch };
}
