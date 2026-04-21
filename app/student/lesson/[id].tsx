/**
 * @fileoverview Lesson detail screen
 */

import { getLessonById, updateLessonProgress } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, ChevronLeft, Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  const { data: lesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLessonById(id),
  });

  const progressMutation = useMutation({
    mutationFn: (percentage: number) => 
      user ? updateLessonProgress(user.id, id, percentage) : Promise.resolve(null),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(50);
      progressMutation.mutate(50);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    setProgress(100);
    progressMutation.mutate(100);
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient colors={['#f0fdf4', '#ffffff']} className="pt-14 pb-4 px-5">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
          >
            <ChevronLeft size={24} color="#57534e" />
          </TouchableOpacity>
          <View className="flex-1 ml-3">
            <Text className="text-lg font-bold text-earth-800" numberOfLines={1}>
              {lesson?.title}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-5 py-2 bg-primary-50">
        <View className="h-2 bg-primary-200 rounded-full overflow-hidden">
          <View 
            className="h-full bg-primary-600 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-primary-700 text-xs mt-1">{progress}% completed</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row items-center mb-4">
          <Clock size={16} color="#78716c" />
            <Text className="text-earth-500 text-sm ml-2">{lesson?.duration_mins} minutes</Text>
        </View>

        <Text className="text-xl font-bold text-earth-800 mb-4">{lesson?.title}</Text>
        
        <Text className="text-earth-600 leading-relaxed text-base mb-6">
          {lesson?.content || 'No content available for this lesson.'}
        </Text>

        {lesson?.description && (
          <>
            <Text className="text-lg font-semibold text-earth-800 mb-3">Summary</Text>
            <Text className="text-earth-600 leading-relaxed mb-8">
              {lesson.description}
            </Text>
          </>
        )}

        <TouchableOpacity
          onPress={handleComplete}
          className="bg-primary-600 py-4 rounded-xl items-center mb-6"
        >
          <View className="flex-row items-center">
            <CheckCircle size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Mark as Complete</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
