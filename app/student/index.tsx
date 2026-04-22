/**
 * @fileoverview Student LMS home — enrolled courses and continue learning.
 */

import { CourseCard, EmptyState, ScreenHeader } from '@/components/shared';
import { getEnrolmentsByUser } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course, CourseEnrolment } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Sprout } from 'lucide-react-native';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: enrolments = [], isLoading, refetch } = useQuery<(CourseEnrolment & { courses: Course })[]>({
    queryKey: ['student-enrolments', user?.id],
    queryFn: () => (user ? getEnrolmentsByUser(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  return (
    <LinearGradient colors={['#f0fdf4', '#fafaf9']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader
          title="My learning"
          subtitle="Pick up where you left off in your enrolled courses."
          variant="light"
        />

        <FlatList
          data={enrolments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Sprout}
              title="No courses yet"
              description="Join a class with a code from your coordinator, or browse the catalogue to enrol."
              actionLabel="Discover courses"
              onAction={() => router.push('/student/discover')}
              variant="light"
            />
          }
          renderItem={({ item }) => (
            <CourseCard
              title={item.courses?.title ?? 'Course'}
              description={item.courses?.description}
              coverImageUri={item.courses?.cover_image ?? undefined}
              placeholderIcon={Sprout}
              variant="elevated"
              onPress={() =>
                router.push({ pathname: '/student/course/[id]', params: { id: item.course_id } })
              }
              footer={
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Clock size={14} color="#78716c" />
                    <Text className="text-earth-500 text-xs ml-1.5 font-medium">
                      Enrolled {new Date(item.enrolled_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#16a34a" />
                </View>
              }
            />
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
