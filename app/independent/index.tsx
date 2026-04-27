/**
 * @fileoverview Independent learner LMS home — enrolments and continue learning.
 */

import { CourseCard, DashboardStatsGrid, EmptyState, ScreenHeader } from '@/components/shared';
import { getLearnerDashboardStats } from '@/services/learnerDashboardStats';
import { getCourseProgressSummary, getEnrolmentsByUser } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course, CourseEnrolment } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Clock, ListChecks, Play, Sprout, Target } from 'lucide-react-native';
import { Fragment, useCallback, useMemo } from 'react';
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

  const { data: dashStats, isLoading: statsLoading } = useQuery({
    queryKey: ['learner-dashboard-stats', 'indep', user?.id],
    queryFn: () => (user ? getLearnerDashboardStats(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void queryClient.invalidateQueries({ queryKey: ['independent-course-progress', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['learner-dashboard-stats', 'indep', user.id] });
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

  const statItems = useMemo(
    () => [
      {
        label: 'Courses',
        value: `${dashStats?.coursesEnrolled ?? 0}`,
        change: 'Enrolled',
        icon: BookOpen,
        iconColor: '#0891b2',
      },
      {
        label: 'Average progress',
        value: `${dashStats?.averageProgressPct ?? 0}%`,
        change: 'Overall',
        icon: Target,
        iconColor: '#0e7490',
      },
      {
        label: 'Lessons',
        value:
          (dashStats?.lessonsTotal ?? 0) > 0
            ? `${dashStats?.lessonsCompleted ?? 0}/${dashStats?.lessonsTotal ?? 0}`
            : '—',
        sublabel: 'Complete across courses',
        change: 'Progress',
        icon: ListChecks,
        iconColor: '#d97706',
      },
      {
        label: 'In progress',
        value: `${enrolments.filter((e) => {
          const p = progressByCourseId.get(e.course_id);
          return p && p.averagePctComplete > 0 && p.averagePctComplete < 100;
        }).length}`,
        change: 'Active',
        icon: Sprout,
        iconColor: '#7c3aed',
      },
    ],
    [dashStats, enrolments, progressByCourseId],
  );

  const openIndependentCourse = async (courseId: string, averagePctComplete: number) => {
    if (averagePctComplete >= 100 && user?.id) {
      const badgeSeenKey = `badge-first-opened:independent:${user.id}:${courseId}`;
      const hasSeenBadge = await AsyncStorage.getItem(badgeSeenKey);
      if (!hasSeenBadge) {
        await AsyncStorage.setItem(badgeSeenKey, '1');
        router.push('/independent/achievements');
        return;
      }
    }
    router.push({ pathname: '/independent/course/[id]', params: { id: courseId } });
  };

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
          variant="light"
        />

        <FlatList
          data={enrolments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0891b2" />
          }
          ListHeaderComponent={
            <Fragment>
              <DashboardStatsGrid
                title="Your stats"
                items={statItems}
                isLoading={statsLoading}
                accent="cyan"
              />
              {firstCourse ? (
                <TouchableOpacity
                  onPress={() => {
                    void openIndependentCourse(firstCourse.course_id, progressPct);
                  }}
                  activeOpacity={0.93}
                  className="mb-6 pb-6 border-b border-earth-400/40"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-earth-600 text-xs font-medium uppercase tracking-[0.18em] mb-1.5">
                        Continue learning
                      </Text>
                      <Text className="text-earth-900 text-lg font-light tracking-tight" numberOfLines={2}>
                        {firstCourse.courses?.title ?? 'Course'}
                      </Text>
                      <View className="mt-4 h-1.5 w-full bg-earth-300/50 rounded-full overflow-hidden">
                        <View className="h-full bg-cyan-600 rounded-full" style={{ width: `${progressPct}%` }} />
                      </View>
                      <Text className="text-earth-600 text-xs mt-2">
                        {totalLessons > 0
                          ? `${completedLessons}/${totalLessons} lessons complete (${progressPct}%)`
                          : 'No lessons yet for this course'}
                      </Text>
                    </View>
                    <View className="w-14 h-14 items-center justify-center">
                      <Play size={28} color="#0891b2" fill="#0891b2" />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : null}
            </Fragment>
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
            (() => {
              const summary = progressByCourseId.get(item.course_id);
              const averagePctComplete = Math.max(0, Math.min(100, summary?.averagePctComplete ?? 0));
              const isCompleted = averagePctComplete >= 100;
              const lessonMeta =
                (summary?.totalLessons ?? 0) > 0
                  ? `${summary?.completedLessons ?? 0}/${summary?.totalLessons ?? 0} lessons complete`
                  : 'No lessons yet';

              return (
                <CourseCard
                  title={item.courses?.title ?? 'Course'}
                  description={item.courses?.description}
                  coverImageUri={item.courses?.cover_image ?? undefined}
                  progress={averagePctComplete}
                  meta={isCompleted ? `Completed • ${lessonMeta}` : lessonMeta}
                  variant="elevated"
                  onPress={() => {
                    void openIndependentCourse(item.course_id, averagePctComplete);
                  }}
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
              );
            })()
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
