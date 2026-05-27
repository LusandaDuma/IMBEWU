/**
 * @fileoverview Persist courses the same way as manual admin creation:
 * createCourse → createLesson (per row) → createLessonQuiz (when provided).
 */

import { createCourse } from '@/services/courseService';
import { createLesson } from '@/services/lessonService';
import { createLessonQuiz } from '@/services/supabase';

export type CourseLessonQuizInput = {
  title: string;
  passScore?: number;
  questions: Array<{
    text: string;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>;
};

export type CourseLessonInput = {
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  duration_mins?: number | null;
  quiz?: CourseLessonQuizInput;
};

export type PersistCourseInput = {
  createdBy: string;
  title: string;
  description: string;
  offline_url?: string | null;
  is_published?: boolean;
  lessons: CourseLessonInput[];
  onProgress?: (message: string) => void;
};

export type PersistCourseResult =
  | { ok: true; courseId: string; lessonCount: number; quizCount: number }
  | { ok: false; error: string };

/**
 * Saves a course using the same service calls as the manual admin editors.
 */
export async function persistCourseWithLessonsAndQuizzes(
  input: PersistCourseInput
): Promise<PersistCourseResult> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: 'Course title is required.' };
  }

  input.onProgress?.('Creating course record…');

  const courseResult = await createCourse({
    created_by: input.createdBy,
    title,
    description: input.description.trim() || null,
    offline_url: input.offline_url ?? null,
    is_published: input.is_published ?? false,
  });

  if (courseResult.error || !courseResult.data) {
    return {
      ok: false,
      error: courseResult.error ?? 'Could not save course. Check your Supabase permissions.',
    };
  }

  const courseId = courseResult.data.id;
  let quizCount = 0;

  for (let i = 0; i < input.lessons.length; i++) {
    const lesson = input.lessons[i]!;
    input.onProgress?.(`Saving lesson ${i + 1} of ${input.lessons.length}…`);

    const lessonResult = await createLesson({
      course_id: courseId,
      order_index: i,
      title: lesson.title.trim() || `Lesson ${i + 1}`,
      description: lesson.description?.trim() || null,
      content: lesson.content?.trim() || null,
      video_url: lesson.video_url ?? null,
      duration_mins: lesson.duration_mins ?? null,
    });

    if (lessonResult.error || !lessonResult.data) {
      return {
        ok: false,
        error: lessonResult.error ?? `Could not save lesson ${i + 1}.`,
      };
    }

    const quiz = lesson.quiz;
    if (quiz && quiz.questions.length > 0) {
      input.onProgress?.(`Saving quiz for lesson ${i + 1}…`);
      const created = await createLessonQuiz({
        lessonId: lessonResult.data.id,
        title: quiz.title.trim() || `Quiz: ${lesson.title}`,
        passScore: quiz.passScore ?? 70,
        questions: quiz.questions,
      });
      if (!created) {
        return { ok: false, error: `Could not save quiz for lesson ${i + 1}.` };
      }
      quizCount += 1;
    }
  }

  return {
    ok: true,
    courseId,
    lessonCount: input.lessons.length,
    quizCount,
  };
}

/**
 * Manual path: create an empty course shell, then add lessons in the course editor.
 */
export async function createEmptyCourseForManualEditing(input: {
  createdBy: string;
  title: string;
  description?: string;
}): Promise<PersistCourseResult> {
  return persistCourseWithLessonsAndQuizzes({
    createdBy: input.createdBy,
    title: input.title,
    description: input.description ?? '',
    lessons: [],
  });
}
