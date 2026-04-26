/**
 * @fileoverview React Query hooks for course and progress data.
 */

import { getCourseById, getPublishedCourses } from '@/services/courseService';
import { getProgressByCourse } from '@/services/progressService';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';

/**
 * Query published courses.
 */
export function useCourses() {
  return useQuery({
    queryKey: ['courses', 'published'],
    queryFn: async () => {
      const result = await getPublishedCourses();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
  });
}

/**
 * Query a course and nested lessons by ID.
 * @param courseId - Course ID.
 */
export function useCourse(courseId: string | null | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      if (!courseId) {
        return null;
      }

      const result = await getCourseById(courseId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

/**
 * Query current user's progress for a course.
 * @param courseId - Course ID.
 */
export function useProgress(courseId: string | null | undefined) {
  const userId = useAuthStore((state) => state.user?.id ?? null);

  return useQuery({
    queryKey: ['course-progress', userId, courseId],
    enabled: Boolean(userId && courseId),
    queryFn: async () => {
      if (!userId || !courseId) {
        return [];
      }

      const result = await getProgressByCourse(userId, courseId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
  });
}
