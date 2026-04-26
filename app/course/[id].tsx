/**
 * @fileoverview Public read-only course preview — browse syllabus; enrol requires sign-in.
 */

import { Button, ScreenHeader } from '@/components/shared';
import { APP_BACKGROUND_COLOR, surfaceContentPanel } from '@/constants/theme';
import { getCourseById, getLessonsByCourse } from '@/services/supabase';
import type { Lesson } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicCoursePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: course } = useQuery({
    queryKey: ['public-course', id],
    queryFn: () => getCourseById(id),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['public-course-lessons', id],
    queryFn: () => getLessonsByCourse(id),
  });

  const promptEnrol = () => {
    Alert.alert(
      'Sign in to enrol',
      'An account lets you enrol, track progress, and complete lessons.',
      [
        { text: 'Back', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.replace('/auth/login') },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]} className="pb-10">
        <SafeAreaView edges={['top']}>
          <ScreenHeader
            title={course?.title ?? 'Course'}
            subtitle={course?.description ?? 'Preview — sign in to study and save progress.'}
            variant="transparent"
            onBack={() => router.back()}
          />
        </SafeAreaView>
      </LinearGradient>

      <ScrollView className="flex-1 px-5 -mt-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className={surfaceContentPanel}>
          <View className="flex-row items-center mb-3">
            <BookOpen size={18} color="#16a34a" strokeWidth={1.5} />
            <Text className="text-earth-800 font-light text-lg ml-2 tracking-tight">Outline</Text>
            <View className="flex-1" />
            <Text className="text-primary-800 text-xs font-medium">{lessons.length} lessons</Text>
          </View>
          {lessons.map((lesson: Lesson, i: number) => (
            <View
              key={lesson.id}
              className={`py-3 ${i < lessons.length - 1 ? 'border-b border-earth-400/30' : ''}`}
            >
              <Text className="text-earth-800 font-light">
                {i + 1}. {lesson.title}
              </Text>
              {lesson.duration_mins != null ? (
                <Text className="text-earth-500 text-xs mt-1 font-light">{lesson.duration_mins} min</Text>
              ) : null}
            </View>
          ))}
          {lessons.length === 0 ? (
            <Text className="text-earth-500 font-light text-sm">No lessons listed yet.</Text>
          ) : null}
        </View>

        <Button label="Enrol in this course" onPress={promptEnrol} variant="primary" size="lg" fullWidth />
        <Text className="text-earth-500 text-xs text-center mt-4 font-light px-4">
          Enrolling updates your profile and requires a signed-in session.
        </Text>
      </ScrollView>
    </View>
  );
}
