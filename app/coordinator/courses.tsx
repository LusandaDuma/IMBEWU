/**
 * @fileoverview Available courses for coordinators
 */

import { COURSE_LOGO_THUMB } from '@/constants/courseBranding';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getCourses } from '@/services/supabase';
import type { Course } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

export default function CoordinatorCoursesScreen() {
  const router = useRouter();

  const { data: courses = [], isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: getCourses,
  });

  useRefetchOnFocus(refetch, true);

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity
      onPress={() => router.push(`/coordinator/course/${item.id}`)}
      className="py-4 mb-1 border-b border-earth-400/40"
    >
      <View className="flex-row items-center">
        <View className="w-16 h-16 rounded-2xl overflow-hidden items-center justify-center bg-primary-500/10">
          <Image source={COURSE_LOGO_THUMB} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold text-earth-900" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-earth-600 text-sm mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <ChevronRight size={20} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-900">Available courses</Text>
        <Text className="text-earth-600">Browse and assign to classes</Text>
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
            <Text className="text-earth-500 mt-4">No courses available</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}
