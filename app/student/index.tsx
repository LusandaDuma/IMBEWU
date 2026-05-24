/**
 * @fileoverview Student LMS home — luxury emerald & gold theme
 * Keeps all existing data fetching, replaces UI with premium design.
 */

import { getLearnerDashboardStats } from '@/services/learnerDashboardStats';
import { getCourseProgressSummary, getEnrolmentsByUser } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course, CourseEnrolment } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  ListChecks,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

export default function StudentDashboard() {
  const { user, profile } = useAuthStore();
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
          .map((q) => q.data)
          .filter((s): s is NonNullable<typeof s> => Boolean(s))
          .map((s) => [s.courseId, s])
      ),
    [progressQueries]
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

  const firstName = profile?.first_name ?? 'Student';

  const stats = [
    { label: 'Enrolled', value: `${dashStats?.coursesEnrolled ?? 0}`, icon: BookOpen },
    { label: 'Avg Progress', value: `${dashStats?.averageProgressPct ?? 0}%`, icon: Target },
    { label: 'Lessons Done', value: dashStats?.lessonsTotal ? `${dashStats.lessonsCompleted}/${dashStats.lessonsTotal}` : '—', icon: ListChecks },
    { label: 'In Progress', value: `${enrolments.filter(e => { const p = progressByCourseId.get(e.course_id); return p && p.averagePctComplete > 0 && p.averagePctComplete < 100; }).length}`, icon: TrendingUp },
  ];

  const renderCourseCard = ({ item }: { item: CourseEnrolment & { courses: Course } }) => {
    const summary = progressByCourseId.get(item.course_id);
    const pct = Math.max(0, Math.min(100, summary?.averagePctComplete ?? 0));
    const isCompleted = pct >= 100;
    const lessonMeta = (summary?.totalLessons ?? 0) > 0
      ? `${summary?.completedLessons ?? 0}/${summary?.totalLessons ?? 0} lessons`
      : 'No lessons yet';

    return (
      <TouchableOpacity
        onPress={() => void openStudentCourse(item.course_id, pct)}
        style={{
          backgroundColor: EMERALD,
          borderRadius: 20,
          marginBottom: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: `${GOLD}40`,
        }}
        activeOpacity={0.85}
      >
        {/* Card Header */}
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{
              backgroundColor: `${GOLD}20`, paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 20, borderWidth: 1, borderColor: `${GOLD}40`,
            }}>
              <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                {isCompleted ? 'Completed' : 'In Progress'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isCompleted ? GOLD : '#22c55e' }} />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{pct}%</Text>
            </View>
          </View>

          <Text style={{ color: 'white', fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginBottom: 8, lineHeight: 28 }}>
            {item.courses?.title ?? 'Course'}
          </Text>

          {item.courses?.description && (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 }} numberOfLines={2}>
              {item.courses.description}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${pct}%`, backgroundColor: GOLD, borderRadius: 2 }} />
          </View>
        </View>

        {/* Card Footer */}
        <View style={{
          backgroundColor: DARK, paddingHorizontal: 20, paddingVertical: 14,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderTopWidth: 1, borderTopColor: `${GOLD}20`,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="rgba(255,255,255,0.4)" />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {lessonMeta} • Enrolled {new Date(item.enrolled_at).toLocaleDateString()}
            </Text>
          </View>
          <ChevronRight size={18} color={GOLD} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <FlatList
        data={enrolments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={GOLD} />
        }
        ListHeaderComponent={
          <View>
            {/* Hero Banner */}
            <View style={{
              backgroundColor: EMERALD, borderRadius: 20, padding: 24,
              marginBottom: 20, marginTop: 8,
              borderWidth: 1, borderColor: `${GOLD}40`,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Sparkles size={12} color={GOLD} />
                <Text style={{ color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
                  Learning Journey
                </Text>
              </View>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: '300', fontFamily: 'serif', marginBottom: 8 }}>
                Welcome back, {firstName}.
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                Continue cultivating your craft. Pick up where you left off.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/student/discover')}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: GOLD, paddingHorizontal: 16,
                  paddingVertical: 10, borderRadius: 10,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: DARK, fontSize: 12, fontWeight: '700' }}>Discover Courses</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              {stats.map((stat) => (
                <View key={stat.label} style={{
                  width: '47%', backgroundColor: 'white', borderRadius: 16,
                  padding: 16, borderWidth: 1, borderColor: '#E8DFD0',
                }}>
                  <stat.icon size={16} color={GOLD} />
                  <Text style={{ color: DARK, fontSize: 24, fontWeight: '700', fontFamily: 'serif', marginTop: 10 }}>
                    {statsLoading ? '—' : stat.value}
                  </Text>
                  <Text style={{ color: '#8B7355', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Section Title */}
            {enrolments.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
                  My Courses
                </Text>
                <Text style={{ color: DARK, fontSize: 22, fontWeight: '300', fontFamily: 'serif' }}>
                  Continue Learning
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Sprout size={48} color={GOLD} />
            <Text style={{ color: DARK, fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginTop: 16, textAlign: 'center' }}>
              No courses yet
            </Text>
            <Text style={{ color: '#8B7355', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              Join a class with a code from your coordinator,{'\n'}or browse the catalogue to enrol.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/student/discover')}
              style={{
                backgroundColor: EMERALD, borderRadius: 12, paddingHorizontal: 24,
                paddingVertical: 14, marginTop: 20, borderWidth: 1, borderColor: `${GOLD}40`,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: GOLD, fontWeight: '700', fontSize: 14 }}>Discover Courses</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderCourseCard}
      />
    </SafeAreaView>
  );
}
