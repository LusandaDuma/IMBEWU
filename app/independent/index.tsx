/**
 * @fileoverview Independent learner LMS home — enrolments and continue learning.
 */

import { CourseCard, EmptyState, ScreenHeader } from '@/components/shared';
import { getCourseProgressSummary, getEnrolmentsByUser } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course, CourseEnrolment } from '@/types';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Clock, Play, Sprout, Target } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndependentDashboard() {
  const { user, profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: enrolments = [], isLoading, refetch } = useQuery<(CourseEnrolment & { courses: Course })[]>({
    queryKey: ['independent-enrolments', user?.id],
    queryFn: () => (user ? getEnrolmentsByUser(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void queryClient.invalidateQueries({ queryKey: ['independent-course-progress', user.id] });
      void refetch();
    }, [user?.id, queryClient, refetch])
  );

  const firstCourse = enrolments[0];
  const progressQueries = useQueries({
    queries: enrolments.map((enrolment) => ({
      queryKey: ['independent-course-progress', user?.id, enrolment.course_id],
      queryFn: () =>
        user
          ? getCourseProgressSummary(user.id, enrolment.course_id)
          : Promise.resolve({ courseId: enrolment.course_id, totalLessons: 0, completedLessons: 0, averagePctComplete: 0 }),
      enabled: !!user,
    })),
  });

  const progressByCourseId = useMemo(
    () =>
      new Map(
        progressQueries
          .map((query) => query.data)
          .filter((summary): summary is NonNullable<typeof summary> => Boolean(summary))
          .map((summary) => [summary.courseId, summary])
      ),
    [progressQueries]
  );

  const firstCourseProgress = firstCourse ? progressByCourseId.get(firstCourse.course_id) : null;
  const progressPct = Math.max(0, Math.min(100, firstCourseProgress?.averagePctComplete ?? 0));
  const completedLessons = firstCourseProgress?.completedLessons ?? 0;
  const totalLessons = firstCourseProgress?.totalLessons ?? 0;

  return (
    <LinearGradient
      colors={['#D6D6D6', '#D6D6D6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader
          title={`Hello, ${profile?.first_name ?? 'Learner'}`}
          subtitle="Your self-paced workspace — courses, progress, and achievements."
          variant="dark"
        />

        <FlatList
          data={enrolments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0891b2" />
          }
          ListHeaderComponent={
            firstCourse ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/independent/course/[id]',
                    params: { id: firstCourse.course_id },
                  })
                }
                activeOpacity={0.93}
                className="rounded-3xl p-6 mb-6 bg-cyan-600/95"
                style={{ elevation: 3 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-cyan-100/95 text-xs font-medium uppercase tracking-[0.18em] mb-1.5">
                      Continue learning
                    </Text>
                    <Text className="text-white text-lg font-light tracking-tight" numberOfLines={2}>
                      {firstCourse.courses?.title ?? 'Course'}
                    </Text>
                    <View className="mt-4 h-2 w-full bg-cyan-800 rounded-full overflow-hidden">
                      <View className="h-full bg-white rounded-full" style={{ width: `${progressPct}%` }} />
                    </View>
                    <Text className="text-cyan-100 text-xs mt-2">
                      {totalLessons > 0
                        ? `${completedLessons}/${totalLessons} lessons complete (${progressPct}%)`
                        : 'No lessons yet for this course'}
                    </Text>
                  </View>
                  <View className="w-14 h-14 rounded-full bg-white/15 items-center justify-center">
                    <Play size={28} color="white" fill="white" />
                  </View>
                </View>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={Target}
              title="Start your journey"
              description="Browse the catalogue and enrol in a course to see it here with your progress."
              actionLabel="Explore courses"
              onAction={() => router.push('/independent/explore')}
              variant="light"
            />
          }
          renderItem={({ item }) => (
            <CourseCard
              title={item.courses?.title ?? 'Course'}
              description={item.courses?.description}
              coverImageUri={item.courses?.cover_image ?? undefined}
              placeholderIcon={Sprout}
              progress={Math.max(0, Math.min(100, progressByCourseId.get(item.course_id)?.averagePctComplete ?? 0))}
              meta={
                (progressByCourseId.get(item.course_id)?.totalLessons ?? 0) > 0
                  ? `${progressByCourseId.get(item.course_id)?.completedLessons ?? 0}/${progressByCourseId.get(item.course_id)?.totalLessons ?? 0} lessons complete`
                  : 'No lessons yet'
              }
              variant="solid"
              onPress={() =>
                router.push({ pathname: '/independent/course/[id]', params: { id: item.course_id } })
              }
              footer={
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Clock size={14} color="#78716c" />
                    <Text className="text-earth-500 text-xs ml-1.5 font-medium">
                      Enrolled {new Date(item.enrolled_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#0891b2" />
                </View>
              }
            />
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
