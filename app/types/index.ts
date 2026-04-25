/**
 * @fileoverview Core type definitions for AgroLearn
 */

/** Matches `profiles.role` check constraint in Supabase (see migrations). */
export type UserRole = 'admin' | 'coordinator' | 'student' | 'independent';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  language: string;
  is_active: boolean;
  last_login: string | null;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  offline_url: string | null;
  created_by: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  course_id: string;
  created_by: string;
  name: string;
  join_code: string;
  is_active: boolean;
  start_date?: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  duration_mins: number;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  pct_complete: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CourseEnrolment {
  id: string;
  user_id: string;
  course_id: string;
  enrolment_type: 'independent' | 'class_based';
  enrolled_at: string;
}

export interface ClassMember {
  id: string;
  class_id: string;
  user_id: string;
  role: 'coordinator' | 'student';
  joined_at: string;
  profile?: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  pass_score: number;
  max_attempts: number | null;
  due_date: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  order_index: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  criteria: string;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}
