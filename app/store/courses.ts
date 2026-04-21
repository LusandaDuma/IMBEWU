/**
 * @fileoverview Course state management with Zustand
 */

import type { Course, Lesson, LessonProgress } from '@/types';
import { create } from 'zustand';

interface CourseState {
  enrolledCourses: Course[];
  availableCourses: Course[];
  currentCourse: Course | null;
  currentLessons: Lesson[];
  lessonProgress: Record<string, LessonProgress>;
  setEnrolledCourses: (courses: Course[]) => void;
  setAvailableCourses: (courses: Course[]) => void;
  setCurrentCourse: (course: Course | null) => void;
  setCurrentLessons: (lessons: Lesson[]) => void;
  updateLessonProgress: (lessonId: string, progress: LessonProgress) => void;
  addEnrolledCourse: (course: Course) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  enrolledCourses: [],
  availableCourses: [],
  currentCourse: null,
  currentLessons: [],
  lessonProgress: {},
  
  setEnrolledCourses: (courses: Course[]) => set({ enrolledCourses: courses }),
  setAvailableCourses: (courses: Course[]) => set({ availableCourses: courses }),
  setCurrentCourse: (course: Course | null) => set({ currentCourse: course }),
  setCurrentLessons: (lessons: Lesson[]) => set({ currentLessons: lessons }),
  
  updateLessonProgress: (lessonId: string, progress: LessonProgress) => {
    set((state) => ({
      lessonProgress: {
        ...state.lessonProgress,
        [lessonId]: progress,
      },
    }));
  },
  
  addEnrolledCourse: (course: Course) => {
    set((state) => ({
      enrolledCourses: [...state.enrolledCourses, course],
      availableCourses: state.availableCourses.filter(c => c.id !== course.id),
    }));
  },
}));
