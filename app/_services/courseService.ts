/**
 * @fileoverview Course data access service.
 */

import { supabase } from '@/services/supabase';
import type { Course, Lesson } from '@/types';

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type PublishedCourse = Pick<Course, 'id' | 'title' | 'description' | 'created_at'>;
export type CourseWithLessons = Pick<Course, 'id' | 'title' | 'description' | 'offline_url'> & {
  lessons: Array<Pick<Lesson, 'id' | 'title' | 'order_index' | 'duration_mins'>>;
};

export interface CreateCourseInput {
  created_by: string;
  title: string;
  description?: string | null;
  offline_url?: string | null;
  is_published?: boolean;
}

export type UpdateCourseInput = Partial<Pick<Course, 'title' | 'description' | 'offline_url' | 'is_published'>>;

/**
 * Fetch all published courses for catalogue/discovery views.
 * @returns Published courses and error state.
 */
export async function getPublishedCourses(): Promise<ServiceResult<PublishedCourse[]>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as PublishedCourse[], error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch published courses.' };
  }
}

/**
 * Fetch one course with all lessons in a single nested query.
 * @param courseId - Course ID.
 * @returns Course with lesson summary rows and error state.
 */
export async function getCourseById(courseId: string): Promise<ServiceResult<CourseWithLessons>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, offline_url, lessons(id, title, order_index, duration_mins)')
      .eq('id', courseId)
      .order('order_index', { foreignTable: 'lessons', ascending: true })
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CourseWithLessons, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch course.' };
  }
}

/**
 * Create a course row.
 * @param input - Course payload.
 * @returns Created course and error state.
 */
export async function createCourse(input: CreateCourseInput): Promise<ServiceResult<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        created_by: input.created_by,
        title: input.title,
        description: input.description ?? null,
        offline_url: input.offline_url ?? null,
        is_published: input.is_published ?? false,
      })
      .select('id, created_by, title, description, offline_url, is_published, created_at, updated_at')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Course, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create course.' };
  }
}

/**
 * Update changed fields on a course.
 * @param courseId - Course ID.
 * @param updates - Patch payload.
 * @returns Updated course and error state.
 */
export async function updateCourse(courseId: string, updates: UpdateCourseInput): Promise<ServiceResult<Course>> {
  try {
    if (Object.keys(updates).length === 0) {
      return { data: null, error: 'No course changes provided.' };
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select('id, created_by, title, description, offline_url, is_published, created_at, updated_at')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Course, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update course.' };
  }
}

/**
 * Publish a course.
 * @param courseId - Course ID.
 * @returns Updated course and error state.
 */
export async function publishCourse(courseId: string): Promise<ServiceResult<Course>> {
  return updateCourse(courseId, { is_published: true });
}
