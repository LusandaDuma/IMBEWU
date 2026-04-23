/**
 * @fileoverview Lesson progress data access service.
 */

import type { ServiceResult } from '@/services/courseService';
import { supabase } from '@/services/supabase';
import type { LessonProgress } from '@/types';

/**
 * Upsert progress for a user and lesson.
 * @param userId - User ID.
 * @param lessonId - Lesson ID.
 * @param pctComplete - Completion percentage from 0 to 100.
 * @returns Upserted progress row and error state.
 */
export async function upsertProgress(
  userId: string,
  lessonId: string,
  pctComplete: number
): Promise<ServiceResult<LessonProgress>> {
  try {
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          pct_complete: pctComplete,
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select('id, user_id, lesson_id, pct_complete, is_completed, completed_at')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as LessonProgress, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to upsert progress.' };
  }
}

/**
 * Mark a lesson complete for a user.
 * @param userId - User ID.
 * @param lessonId - Lesson ID.
 * @returns Upserted completion row and error state.
 */
export async function markLessonComplete(userId: string, lessonId: string): Promise<ServiceResult<LessonProgress>> {
  try {
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          pct_complete: 100,
          is_completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select('id, user_id, lesson_id, pct_complete, is_completed, completed_at')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as LessonProgress, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to mark lesson complete.' };
  }
}

/**
 * Fetch all progress rows for lessons in one course using a join query.
 * @param userId - User ID.
 * @param courseId - Course ID.
 * @returns Progress rows scoped to the course and error state.
 */
export async function getProgressByCourse(userId: string, courseId: string): Promise<ServiceResult<LessonProgress[]>> {
  try {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('id, user_id, lesson_id, pct_complete, is_completed, completed_at, lessons!inner(id, course_id)')
      .eq('user_id', userId)
      .eq('lessons.course_id', courseId);

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (data ?? []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      lesson_id: item.lesson_id,
      pct_complete: item.pct_complete,
      is_completed: item.is_completed,
      completed_at: item.completed_at,
    })) as LessonProgress[];

    return { data: rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch course progress.' };
  }
}

/**
 * Compute course completion percentage from lesson progress rows.
 * @param userId - User ID.
 * @param courseId - Course ID.
 * @returns Whole-number completion percentage and error state.
 */
export async function getCourseCompletionPct(userId: string, courseId: string): Promise<ServiceResult<number>> {
  try {
    const [progressResult, lessonsResult] = await Promise.all([
      getProgressByCourse(userId, courseId),
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
    ]);

    if (progressResult.error) {
      return { data: null, error: progressResult.error };
    }

    if (lessonsResult.error) {
      return { data: null, error: lessonsResult.error.message };
    }

    const totalLessons = lessonsResult.count ?? 0;
    if (totalLessons === 0) {
      return { data: 0, error: null };
    }

    const completedLessons = (progressResult.data ?? []).filter((row) => row.is_completed).length;
    const pct = Math.round((completedLessons / totalLessons) * 100);
    return { data: pct, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to compute completion percentage.' };
  }
}
