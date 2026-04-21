/**
 * @fileoverview Course detail screen for students
 */

import { getCourseById, getLessonsByCourse } from '@/services/supabase';
import type { Lesson } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, ChevronLeft, Clock, Lock, Play } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

  const renderLessonItem = ({ item, index }: { item: Lesson; index: number }) => {
    const isLocked = index > 0;
    const isCompleted = false;

    return (
      <TouchableOpacity
        onPress={() => !isLocked && router.push({ pathname: '/student/lesson/[id]', params: { id: item.id } }) }
        disabled={isLocked}
        className={`flex-row items-center bg-slate-800 rounded-xl p-4 mb-3 border border-slate-700 ${
          isLocked ? 'opacity-60' : ''
        }`}
        style={{ elevation: 1 }}
      >
        <View className="w-10 h-10 rounded-full bg-primary-700 items-center justify-center">
          {isCompleted ? (
            <CheckCircle size={20} color="#22c55e" />
          ) : isLocked ? (
            <Lock size={18} color="#94a3b8" />
          ) : (
            <Play size={18} color="#22c55e" />
          )}
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-white">
            {index + 1}. {item.title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Clock size={12} color="#78716c" />
                <Text className="text-earth-500 text-xs ml-1">{item.duration_mins} min</Text>
          </View>
        </View>
        {!isLocked && (
          <ChevronLeft size={20} color="#78716c" style={{ transform: [{ rotate: '180deg' }] }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-earth-50">
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient colors={['#16a34a', '#15803d']} className="pt-14 pb-6 px-5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-4"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">{course?.title}</Text>
        <Text className="text-white/80 mt-2" numberOfLines={2}>
          {course?.description}
        </Text>
        <View className="flex-row items-center mt-4">
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-sm">{lessons.length} lessons</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-lg font-bold text-earth-800 mb-3">Course Content</Text>
        {lessons.map((lesson, index) => (
          <View key={lesson.id}>
            {renderLessonItem({ item: lesson, index })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}