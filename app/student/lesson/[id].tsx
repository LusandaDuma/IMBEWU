/**
 * @fileoverview Lesson reader — progress, content, completion (LMS).
 */

import { Button, LessonVideoCallout, ProgressBar, ScreenHeader } from '@/components/shared';
import { APP_BACKGROUND_COLOR, surfaceProse } from '@/constants/theme';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getLessonById, getLessonProgress, getLessonsByCourse, updateLessonProgress } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CheckCircle, Clock } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const { data: lesson, refetch: refetchLesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLessonById(id),
  });

  const { data: courseLessons = [] } = useQuery({
    queryKey: ['course-lessons', lesson?.course_id],
    queryFn: () => getLessonsByCourse(lesson!.course_id),
    enabled: !!lesson?.course_id,
  });

  const { data: existingProgress, refetch: refetchProgress } = useQuery({
    queryKey: ['lesson-progress', user?.id, id],
    queryFn: () => (user ? getLessonProgress(user.id, id) : Promise.resolve(null)),
    enabled: !!user,
  });

  useRefetchOnFocus(
    () => {
      void refetchLesson();
      if (user) void refetchProgress();
    },
    Boolean(id)
  );

  const existingPct = useMemo(() => existingProgress?.pct_complete ?? 0, [existingProgress]);

  const progressMutation = useMutation({
    mutationFn: (percentage: number) =>
      user ? updateLessonProgress(user.id, id, percentage) : Promise.resolve(null),
    onSuccess: () => {
      if (!user || !lesson) return;
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', user.id, id] });
      queryClient.invalidateQueries({ queryKey: ['student-course-progress', user.id, lesson.course_id] });
      queryClient.invalidateQueries({ queryKey: ['course-lesson-progress', user.id, lesson.course_id] });
      queryClient.invalidateQueries({ queryKey: ['student-enrolments', user.id] });
    },
  });

  useEffect(() => {
    setProgress(existingPct);
  }, [existingPct]);

  const handleComplete = () => {
    if (progress >= 100 || progressMutation.isPending) return;
    setProgress(100);
    progressMutation.mutate(100);
  };

  const nextLessonId = useMemo(() => {
    if (!lesson || !courseLessons.length) return null;
    const idx = courseLessons.findIndex((l) => l.id === lesson.id);
    if (idx < 0 || idx >= courseLessons.length - 1) return null;
    return courseLessons[idx + 1]!.id;
  }, [lesson, courseLessons]);

  const isComplete = progress >= 100;

  const goToCourse = () => {
    if (lesson?.course_id) {
      router.push({ pathname: '/student/course/[id]', params: { id: lesson.course_id } });
    } else {
      router.back();
    }
  };

  const goToNextLesson = () => {
    if (!nextLessonId) return;
    router.replace({ pathname: '/student/lesson/[id]', params: { id: nextLessonId } });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]}>
        <SafeAreaView edges={['top']}>
          <ScreenHeader
            title={lesson?.title ?? 'Lesson'}
            subtitle="Read, reflect, then mark complete to unlock the next step."
            variant="light"
            onBack={goToCourse}
          />
        </SafeAreaView>
      </LinearGradient>

      <View className="px-5 py-4 border-b border-earth-400/40 bg-transparent">
        <ProgressBar value={progress} tone="primary" showLabel />
      </View>

      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-4">
          <Clock size={16} color="#78716c" />
          <Text className="text-earth-500 text-sm ml-2 font-light">
            {lesson?.duration_mins ?? '—'} minutes estimated
          </Text>
        </View>

        <LessonVideoCallout videoUrl={lesson?.video_url} variant="primary" />

        <View className={surfaceProse}>
          <Text className="text-xl font-light text-earth-900 mb-3 tracking-tight">{lesson?.title}</Text>
          <Text className="text-earth-600 leading-7 text-base font-light">
            {lesson?.content || 'No lesson body yet. Your instructor will add reading or video notes here.'}
          </Text>
        </View>

        {lesson?.description ? (
          <View className="mb-8 pl-3 border-l-2 border-l-primary-500/50 py-1">
            <Text className="text-xs font-medium text-primary-900/80 uppercase tracking-[0.2em] mb-3">
              Summary
            </Text>
            <Text className="text-earth-700 leading-6 text-sm font-light">{lesson.description}</Text>
          </View>
        ) : null}

        <Button
          label="Mark as complete"
          onPress={handleComplete}
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={CheckCircle}
          disabled={isComplete}
        />
        {isComplete && nextLessonId ? (
          <View className="mt-3">
            <Button
              label="Next lesson"
              onPress={goToNextLesson}
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={ArrowRight}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
