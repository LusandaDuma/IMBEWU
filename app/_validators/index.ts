/**
 * @fileoverview Zod validation schemas
 */

import { z } from 'zod';
export { loginSchema, registerSchema } from './authSchemas';
export type { LoginFormData, RegisterFormData } from './authSchemas';

export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
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
  videoUrl: z
    .union([z.string().url('Use a full URL, e.g. https://www.youtube.com/watch?v=…'), z.literal('')])
    .optional(),
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

export type SignupFormData = z.infer<typeof signupSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
export type ClassFormData = z.infer<typeof classSchema>;
export type QuizAnswerData = z.infer<typeof quizAnswerSchema>;
