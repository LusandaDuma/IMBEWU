/**
 * @fileoverview Zod validation schemas
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'independent']),
});

export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  coverImage: z.string().optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  content: z.string().min(1, 'Content is required'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
});

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  courseId: z.string().min(1, 'Course is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

export const quizAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string().optional(),
  textAnswer: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
export type ClassFormData = z.infer<typeof classSchema>;
export type QuizAnswerData = z.infer<typeof quizAnswerSchema>;
