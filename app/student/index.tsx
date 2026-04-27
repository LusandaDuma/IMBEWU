/**
 * @fileoverview Student LMS home — enrolled courses and continue learning.
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
import { BookOpen, ChevronRight, Clock, ListChecks, Sprout, Target } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: enrolments = [], isLoading, refetch } = useQuery<(CourseEnrolment & { courses: Course })[]>({
    queryKey: ['student-enrolments', user?.id],
    queryFn: () => (user ? getEnrolmentsByUser(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const { data: dashStats, isLoading: statsLoading } = useQuery({
    queryKey: ['learner-dashboard-stats', user?.id],
    queryFn: () => (user ? getLearnerDashboardStats(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void queryClient.invalidateQueries({ queryKey: ['student-course-progress', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['learner-dashboard-stats', user.id] });
      void refetch();
    }, [user?.id, queryClient, refetch])
  );

  const progressQueries = useQueries({
    queries: enrolments.map((enrolment) => ({
      queryKey: ['student-course-progress', user?.id, enrolment.course_id],
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

  const statItems = useMemo(
    () => [
      {
        label: 'Courses enrolled',
        value: `${dashStats?.coursesEnrolled ?? 0}`,
        change: 'Live',
        icon: BookOpen,
        iconColor: '#16a34a',
      },
      {
        label: 'Average progress',
        value: `${dashStats?.averageProgressPct ?? 0}%`,
        change: 'All courses',
        icon: Target,
        iconColor: '#0891b2',
      },
      {
        label: 'Lessons complete',
        value:
          (dashStats?.lessonsTotal ?? 0) > 0
            ? `${dashStats?.lessonsCompleted ?? 0}/${dashStats?.lessonsTotal ?? 0}`
            : '—',
        sublabel: 'Across your courses',
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

  const openStudentCourse = async (courseId: string, averagePctComplete: number) => {
    if (averagePctComplete >= 100 && user?.id) {
      const badgeSeenKey = `badge-first-opened:student:${user.id}:${courseId}`;
      const hasSeenBadge = await AsyncStorage.getItem(badgeSeenKey);
      if (!hasSeenBadge) {
        await AsyncStorage.setItem(badgeSeenKey, '1');
        router.push('/student/achievements');
        return;
      }
    }
    router.push({ pathname: '/student/course/[id]', params: { id: courseId } });
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
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
          ListHeaderComponent={
            <DashboardStatsGrid
              title="Your learning stats"
              items={statItems}
              isLoading={statsLoading}
              accent="green"
            />
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
                    void openStudentCourse(item.course_id, averagePctComplete);
                  }}
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
              );
            })()
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
