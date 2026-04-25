/**
 * @fileoverview Available courses for coordinators
 */

import { getCourses } from '@/services/supabase';
import type { Course } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Sprout } from 'lucide-react-native';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

export default function CoordinatorCoursesScreen() {
  const router = useRouter();

  const { data: courses = [], isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: getCourses,
  });

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity
      onPress={() => router.push(`/coordinator/course/${item.id}`)}
      className="bg-slate-800 rounded-2xl p-4 shadow-lg mb-4 border border-slate-700"
      style={{ elevation: 2 }}
    >
      <View className="flex-row items-center">
        <View className="w-14 h-14 rounded-xl bg-primary-600 items-center justify-center">
          <Sprout size={28} color="white" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold text-white" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-slate-400 text-sm mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <ChevronRight size={20} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#f0fdf4', '#fafaf9']} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-white">Available Courses</Text>
        <Text className="text-slate-400">Browse and assign to classes</Text>
      </View>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16a34a" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <BookOpen size={48} color="#d6d3d1" />
            <Text className="text-slate-400 mt-4">No courses available</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}
