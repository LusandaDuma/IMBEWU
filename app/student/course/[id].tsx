/**
 * @fileoverview Student course outline — ordered lessons and progress context.
 */

import { LessonRow, ScreenHeader } from '@/components/shared';
import { getCourseById, getLessonsByCourse } from '@/services/supabase';
import type { Lesson } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: course } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourseById(id),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['course-lessons', id],
    queryFn: () => getLessonsByCourse(id),
  });

  return (
    <View className="flex-1 bg-earth-50">
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#16a34a', '#15803d']} className="pb-8">
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
        <View className="bg-white/75 rounded-3xl p-6 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1 min-w-0">
              <BookOpen size={18} color="#16a34a" strokeWidth={1.5} />
              <Text className="text-earth-800 font-light text-lg ml-2 tracking-tight">Course content</Text>
            </View>
            <View className="bg-primary-500/12 px-3 py-1.5 rounded-full ml-2">
              <Text className="text-primary-900 text-[11px] font-medium tracking-wide">{lessons.length} lessons</Text>
            </View>
          </View>
          <Text className="text-earth-500 text-sm leading-5">
            Lessons unlock in order. Complete each lesson and quiz before moving on.
          </Text>
        </View>

        {lessons.map((lesson: Lesson, index: number) => {
          const isLocked = index > 0;
          return (
            <LessonRow
              key={lesson.id}
              index={index}
              title={lesson.title}
              durationMins={lesson.duration_mins}
              state={isLocked ? 'locked' : 'open'}
              surface="light"
              onPress={
                isLocked
                  ? undefined
                  : () => router.push({ pathname: '/student/lesson/[id]', params: { id: lesson.id } })
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
