/**
 * @fileoverview Independent learner course outline — mirrors student syllabus UX with cyan accents.
 */

import { LessonRow, ScreenHeader } from '@/components/shared';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { APP_BACKGROUND_COLOR, surfaceContentPanel } from '@/constants/theme';
import { getCourseById, getLessonProgressByLessonIds, getLessonsByCourse } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Lesson } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function isLessonComplete(p: { is_completed: boolean; pct_complete: number } | undefined): boolean {
  if (!p) return false;
  return p.is_completed || p.pct_complete >= 100;
}

export default function IndependentCourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: course, refetch: refetchCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourseById(id),
  });

  const { data: lessons = [], refetch: refetchLessons } = useQuery({
    queryKey: ['course-lessons', id],
    queryFn: () => getLessonsByCourse(id),
  });

  const lessonIds = useMemo(() => lessons.map((l) => l.id), [lessons]);
  const { data: progressByLesson = new Map(), refetch: refetchProgress } = useQuery({
    queryKey: ['course-lesson-progress', user?.id, id, lessonIds],
    queryFn: () =>
      user && lessonIds.length
        ? getLessonProgressByLessonIds(user.id, lessonIds)
        : Promise.resolve(new Map()),
    enabled: !!user && lessonIds.length > 0,
  });

  useRefetchOnFocus(
    () => {
      void refetchCourse();
      void refetchLessons();
      if (user && lessonIds.length) void refetchProgress();
    },
    Boolean(id)
  );

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-8"
      >
        <SafeAreaView edges={['top']}>
          <ScreenHeader
            title={course?.title ?? 'Course'}
            subtitle={course?.description ?? ' '}
            variant="transparent"
            onBack={() => router.back()}
          />
        </SafeAreaView>
      </LinearGradient>

      <ScrollView className="flex-1 px-5 -mt-4" showsVerticalScrollIndicator={false}>
        <View className={surfaceContentPanel}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1 min-w-0">
              <BookOpen size={18} color="#0891b2" strokeWidth={1.5} />
              <Text className="text-earth-800 font-light text-lg ml-2 tracking-tight">Course content</Text>
            </View>
            <View className="bg-cyan-500/12 px-3 py-1.5 rounded-full ml-2">
              <Text className="text-cyan-900 text-[11px] font-medium tracking-wide">{lessons.length} lessons</Text>
            </View>
          </View>
          <Text className="text-earth-500 text-sm leading-5">
            Work through lessons in order. Quizzes may appear after selected modules.
          </Text>
        </View>

        {lessons.map((lesson: Lesson, index: number) => {
          const prev = index > 0 ? progressByLesson.get(lessons[index - 1]!.id) : undefined;
          const unlocked = index === 0 || isLessonComplete(prev);
          const selfProgress = progressByLesson.get(lesson.id);
          const state = isLessonComplete(selfProgress) ? 'done' : unlocked ? 'open' : 'locked';
          return (
            <LessonRow
              key={lesson.id}
              index={index}
              title={lesson.title}
              durationMins={lesson.duration_mins}
              state={state}
              surface="light"
              onPress={
                state === 'locked'
                  ? undefined
                  : () =>
                      router.push({
                        pathname: '/independent/lesson/[id]',
                        params: { id: lesson.id },
                      })
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
