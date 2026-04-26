/**
 * @fileoverview Course enrolment data access service.
 */

import type { Course, CourseEnrolment } from '@/types';
import { supabase } from '@/services/supabase';
import type { ServiceResult } from '@/services/courseService';

export type EnrolmentWithCourse = Pick<CourseEnrolment, 'id' | 'user_id' | 'course_id' | 'enrolment_type' | 'enrolled_at'> & {
  courses: Pick<Course, 'id' | 'title' | 'description' | 'offline_url' | 'is_published' | 'created_at'> | null;
};

type EnrolmentWithCourseRow = Pick<
  CourseEnrolment,
  'id' | 'user_id' | 'course_id' | 'enrolment_type' | 'enrolled_at'
> & {
  courses:
    | Array<Pick<Course, 'id' | 'title' | 'description' | 'offline_url' | 'is_published' | 'created_at'>>
    | Pick<Course, 'id' | 'title' | 'description' | 'offline_url' | 'is_published' | 'created_at'>
    | null;
};

/**
 * Enrol a user as an independent learner.
 * @param userId - User ID.
 * @param courseId - Course ID.
 * @returns Enrolment row and error state.
 */
export async function enrolIndependent(userId: string, courseId: string): Promise<ServiceResult<CourseEnrolment>> {
  try {
    const { data, error } = await supabase
      .from('course_enrolments')
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          enrolment_type: 'independent',
        },
        { onConflict: 'user_id,course_id' }
      )
      .select('id, user_id, course_id, enrolment_type, enrolled_at')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CourseEnrolment, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to enrol independent learner.' };
  }
}

/**
 * Enrol a user as class-based learner.
 * @param userId - User ID.
 * @param courseId - Course ID.
 * @returns Enrolment row and error state.
 */
export async function enrolClassBased(userId: string, courseId: string): Promise<ServiceResult<CourseEnrolment>> {
  try {
    const { data, error } = await supabase
      .from('course_enrolments')
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          enrolment_type: 'class_based',
        },
        { onConflict: 'user_id,course_id' }
      )
      .select('id, user_id, course_id, enrolment_type, enrolled_at')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CourseEnrolment, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to enrol class-based learner.' };
  }
}

/**
 * Fetch all enrolments for one user with nested course data.
 * @param userId - User ID.
 * @returns Enrolments with course summaries and error state.
 */
export async function getMyEnrolments(userId: string): Promise<ServiceResult<EnrolmentWithCourse[]>> {
  try {
    const { data, error } = await supabase
      .from('course_enrolments')
      .select(
        'id, user_id, course_id, enrolment_type, enrolled_at, courses(id, title, description, offline_url, is_published, created_at)'
      )
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as EnrolmentWithCourseRow[];
    const enrolments: EnrolmentWithCourse[] = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      course_id: row.course_id,
      enrolment_type: row.enrolment_type,
      enrolled_at: row.enrolled_at,
      courses: Array.isArray(row.courses) ? (row.courses[0] ?? null) : row.courses,
    }));

    return { data: enrolments, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch enrolments.' };
  }
}

/**
 * Check whether a user is already enrolled in a course.
 * @param userId - User ID.
 * @param courseId - Course ID.
 * @returns Boolean enrolment flag and error state.
 */
export async function isEnrolled(userId: string, courseId: string): Promise<ServiceResult<boolean>> {
  try {
    const { data, error } = await supabase
      .from('course_enrolments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: Boolean(data), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to check enrolment.' };
  }
}
