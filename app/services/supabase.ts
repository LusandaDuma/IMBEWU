/**
 * @fileoverview Supabase client and service functions
 */

import type {
    Class,
    Course,
    CourseEnrolment,
    Lesson,
    LessonProgress,
    Profile,
    Question,
    QuestionOption,
    Quiz
} from '@/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
export { supabase };
export default supabase;

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

// Course services
export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  return data || [];
}

export async function getAllCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
  return data || [];
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }
  return data;
}

export async function createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating course:', error);
    return null;
  }
  return data;
}

export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating course:', error);
    return null;
  }
  return data;
}

// Lesson services
export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
  return data || [];
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();
  
  if (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
  return data;
}

// Progress services
export async function getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lesson progress:', error);
    return null;
  }
  return data;
}

export async function updateLessonProgress(
  userId: string, 
  lessonId: string, 
  percentage: number
): Promise<LessonProgress | null> {
  const isCompleted = percentage >= 100;
  const completedAt = isCompleted ? new Date().toISOString() : null;
  
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      pct_complete: percentage,
      is_completed: isCompleted,
      completed_at: completedAt,
    }, {
      onConflict: 'user_id,lesson_id'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating lesson progress:', error);
    return null;
  }
  return data;
}

// Quiz services
export async function getQuizByLesson(lessonId: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quiz:', error);
    return null;
  }
  return data;
}

export async function getQuestionsByQuiz(quizId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
  return data || [];
}

export async function getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
  const { data, error } = await supabase
    .from('question_options')
    .select('*')
    .eq('question_id', questionId)
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching question options:', error);
    return [];
  }
  return data || [];
}

// Enrolment services
export async function getEnrolmentsByUser(userId: string): Promise<(CourseEnrolment & { courses: Course })[]> {
  const { data, error } = await supabase
    .from('course_enrolments')
    .select('*, courses(*)')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching enrolments:', error);
    return [];
  }
  return data || [];
}

export async function enrollInCourse(
  userId: string, 
  courseId: string, 
  enrolmentType: 'independent' | 'class_based'
): Promise<CourseEnrolment | null> {
  const { data, error } = await supabase
    .from('course_enrolments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolment_type: enrolmentType,
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error enrolling in course:', error);
    return null;
  }
  return data;
}

// Class services
export async function getClassesByCoordinator(coordinatorId: string): Promise<Class[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('created_by', coordinatorId);
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  return data || [];
}

export async function getClassByJoinCode(joinCode: string): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('join_code', joinCode)
    .single();
  
  if (error) {
    console.error('Error fetching class by join code:', error);
    return null;
  }
  return data;
}

export async function createClass(classData: Omit<Class, 'id' | 'created_at'>): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .insert(classData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating class:', error);
    return null;
  }
  return data;
}
