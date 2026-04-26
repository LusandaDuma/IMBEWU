/**
 * @fileoverview Independent learner lesson reader (same LMS flow as student).
 */

import { Button, ProgressBar, ScreenHeader } from '@/components/shared';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getLessonById, getLessonProgress, updateLessonProgress } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Clock } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndependentLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const { data: lesson, refetch: refetchLesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLessonById(id),
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
      queryClient.invalidateQueries({ queryKey: ['independent-course-progress', user.id, lesson.course_id] });
      queryClient.invalidateQueries({ queryKey: ['independent-enrolments', user.id] });
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

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <ScreenHeader
            title={lesson?.title ?? 'Lesson'}
            subtitle="Self-paced module — save progress as you go."
            variant="dark"
            onBack={() => router.back()}
          />
        </SafeAreaView>
      </LinearGradient>

      <View className="px-5 py-4 bg-white">
        <ProgressBar value={progress} tone="primary" showLabel />
      </View>

      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-4">
          <Clock size={16} color="#78716c" />
          <Text className="text-earth-500 text-sm ml-2 font-light">
            {lesson?.duration_mins ?? '—'} minutes estimated
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 mb-6">
          <Text className="text-xl font-light text-earth-900 mb-3 tracking-tight">{lesson?.title}</Text>
          <Text className="text-earth-600 leading-7 text-base font-light">
            {lesson?.content || 'No lesson body yet.'}
          </Text>
        </View>

        {lesson?.description ? (
          <View className="bg-cyan-500/8 rounded-3xl p-6 mb-8">
            <Text className="text-xs font-medium text-cyan-900/85 uppercase tracking-[0.2em] mb-3">Summary</Text>
            <Text className="text-earth-700 leading-6 text-sm font-light">{lesson.description}</Text>
          </View>
        ) : null}

        <Button
          label="Mark as complete"
          onPress={handleComplete}
          variant="accent"
          size="lg"
          fullWidth
          leftIcon={CheckCircle}
        />
      </ScrollView>
    </View>
  );
}
