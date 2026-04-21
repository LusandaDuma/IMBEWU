/**
 * @fileoverview Student dashboard - enrolled courses
 */

import { getEnrolmentsByUser } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course, CourseEnrolment } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Sprout } from 'lucide-react-native';
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: enrolments = [], isLoading, refetch } = useQuery<(CourseEnrolment & { courses: Course })[]>({
    queryKey: ['student-enrolments', user?.id],
    queryFn: () => user ? getEnrolmentsByUser(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const renderCourseCard = ({ item }: { item: CourseEnrolment & { courses: Course } }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/student/course/[id]', params: { id: item.course_id } }) }
      className="bg-white rounded-2xl shadow-md overflow-hidden mb-4"
      style={{ elevation: 2 }}
    >
      <View className="h-32 bg-primary-100">
        {item.courses?.cover_image ? (
          <Image
            source={{ uri: item.courses.cover_image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Sprout size={48} color="#16a34a" />
          </View>
        )}
      </View>
      <View className="p-4">
        <Text className="text-lg font-bold text-earth-800" numberOfLines={1}>
          {item.courses?.title}
        </Text>
        <Text className="text-earth-500 text-sm mt-1" numberOfLines={2}>
          {item.courses?.description}
        </Text>
        <View className="flex-row items-center mt-3">
          <Clock size={14} color="#78716c" />
          <Text className="text-earth-500 text-xs ml-1">
            Enrolled {new Date(item.enrolled_at).toLocaleDateString()}
          </Text>
          <View className="flex-1" />
          <ChevronRight size={18} color="#16a34a" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#f0fdf4', '#fafaf9']} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-800">My Learning</Text>
        <Text className="text-earth-500">Continue where you left off</Text>
      </View>

      <FlatList
        data={enrolments}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16a34a" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <View className="w-20 h-20 rounded-full bg-earth-100 items-center justify-center mb-4">
              <Sprout size={36} color="#a8a29e" />
            </View>
            <Text className="text-earth-700 font-medium mb-2">No courses yet</Text>
            <Text className="text-earth-500 text-center px-8">
              Join a class or explore available courses to start learning
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/student/discover')}
              className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Browse Courses</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </LinearGradient>
  );
}
