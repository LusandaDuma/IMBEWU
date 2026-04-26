/**
 * @fileoverview Lesson data access service.
 */

import { supabase } from '@/services/supabase';
import type { Lesson, Question, Quiz } from '@/types';
import type { ServiceResult } from '@/services/courseService';

type QuizWithQuestions = Pick<Quiz, 'id' | 'title' | 'pass_score' | 'max_attempts' | 'due_date' | 'created_at'> & {
  questions: Array<Pick<Question, 'id' | 'text' | 'type' | 'order_index'>>;
};

export type LessonWithQuiz = Pick<
  Lesson,
  'id' | 'course_id' | 'order_index' | 'title' | 'description' | 'content' | 'video_url' | 'duration_mins' | 'created_at' | 'updated_at'
> & {
  quizzes: QuizWithQuestions[];
};

export interface CreateLessonInput {
  course_id: string;
  order_index: number;
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  duration_mins?: number | null;
}

export type UpdateLessonInput = Partial<Pick<Lesson, 'order_index' | 'title' | 'description' | 'content' | 'video_url' | 'duration_mins'>>;

/**
 * Fetch a lesson and its quiz payload with a single nested query.
 * @param lessonId - Lesson ID.
 * @returns Lesson + nested quiz data and error state.
 */
export async function getLessonById(lessonId: string): Promise<ServiceResult<LessonWithQuiz>> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select(
        'id, course_id, order_index, title, description, content, video_url, duration_mins, created_at, updated_at, quizzes(id, title, pass_score, max_attempts, due_date, created_at, questions(id, text, type, order_index))'
      )
      .eq('id', lessonId)
      .order('order_index', { foreignTable: 'quizzes.questions', ascending: true })
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as LessonWithQuiz, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch lesson.' };
  }
}

/**
 * Create a lesson.
 * @param input - Lesson payload.
 * @returns Created lesson and error state.
 */
export async function createLesson(input: CreateLessonInput): Promise<ServiceResult<Lesson>> {
  try {
    const { data: rows, error } = await supabase
      .from('lessons')
      .insert({
        course_id: input.course_id,
        order_index: input.order_index,
        title: input.title,
        description: input.description ?? null,
        content: input.content ?? null,
        video_url: input.video_url ?? null,
        duration_mins: input.duration_mins ?? null,
      })
      .select('id, course_id, order_index, title, description, content, video_url, duration_mins, created_at, updated_at');

    if (error) {
      return { data: null, error: error.message };
    }
    const row = rows?.[0];
    if (!row) {
      return { data: null, error: 'No row returned after insert. Check RLS policy for select on lessons.' };
    }
    return { data: row as Lesson, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create lesson.' };
  }
}

/**
 * Patch an existing lesson.
 * @param lessonId - Lesson ID.
 * @param updates - Changed fields only.
 * @returns Updated lesson and error state.
 */
export async function updateLesson(lessonId: string, updates: UpdateLessonInput): Promise<ServiceResult<Lesson>> {
  try {
    if (Object.keys(updates).length === 0) {
      return { data: null, error: 'No lesson changes provided.' };
    }

    const { data: rows, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', lessonId)
      .select('id, course_id, order_index, title, description, content, video_url, duration_mins, created_at, updated_at');

    if (error) {
      return { data: null, error: error.message };
    }
    const row = rows?.[0];
    if (!row) {
      return { data: null, error: 'No row returned after update. Check RLS and lesson id.' };
    }
    return { data: row as Lesson, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update lesson.' };
  }
}

/**
 * Batch update lesson ordering.
 * @param lessons - Lesson IDs with target order_index values.
 * @returns True if all updates succeeded.
 */
/**
 * Remove a lesson (quizzes and related rows cascade in the database when configured).
 */
export async function deleteLesson(lessonId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to delete lesson.' };
  }
}

export async function reorderLessons(lessons: Array<{ id: string; order_index: number }>): Promise<ServiceResult<boolean>> {
  try {
    if (lessons.length === 0) {
      return { data: true, error: null };
    }

    const updates = await Promise.all(
      lessons.map((lesson) =>
        supabase.from('lessons').update({ order_index: lesson.order_index }).eq('id', lesson.id).select('id').single()
      )
    );

    const failed = updates.find((result) => result.error);
    if (failed?.error) {
      return { data: false, error: failed.error.message };
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: error instanceof Error ? error.message : 'Failed to reorder lessons.' };
  }
}
