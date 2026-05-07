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
import { Fragment, useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Modal, Platform, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAYSTACK_TEST_PUBLIC_KEY = 'pk_test_0553ae959cc7caa09e540a64fef7a6e62cbbbe43';
const PAYSTACK_TEST_CHECKOUT_URL = `https://paystack.com/?pk=${PAYSTACK_TEST_PUBLIC_KEY}`;

export default function IndependentDashboard() {
  const { user, profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [paymentCourseId, setPaymentCourseId] = useState<string | null>(null);
  const [paymentProgressPct, setPaymentProgressPct] = useState(0);
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);

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

  const paymentStorageKey = useCallback(
    (courseId: string) => `independent:paystack:paid:${user?.id ?? 'guest'}:${courseId}`,
    [user?.id]
  );

  const markFakePaymentAsComplete = async () => {
    if (!paymentCourseId) return;
    if (!paymentWindowOpened) {
      Alert.alert('Open checkout first', 'Please open the Paystack checkout window before confirming payment.');
      return;
    }
    await AsyncStorage.setItem(
      paymentStorageKey(paymentCourseId),
      JSON.stringify({
        provider: 'paystack',
        mode: 'test-fake',
        publicKey: PAYSTACK_TEST_PUBLIC_KEY,
        paidAt: new Date().toISOString(),
      })
    );
    const courseId = paymentCourseId;
    const progressPctToUse = paymentProgressPct;
    setPaymentCourseId(null);
    setPaymentWindowOpened(false);
    await openIndependentCourse(courseId, progressPctToUse);
  };

  const openPaystackWindow = () => {
    setPaymentWindowOpened(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(PAYSTACK_TEST_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    void Linking.openURL(PAYSTACK_TEST_CHECKOUT_URL);
  };

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
    if (!user?.id) return;

    const hasPaid = await AsyncStorage.getItem(paymentStorageKey(courseId));
    if (!hasPaid) {
      Alert.alert(
        'Payment required',
        'Independent learners must complete Paystack payment before starting this course.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay with Paystack',
            onPress: () => {
              setPaymentProgressPct(averagePctComplete);
              setPaymentCourseId(courseId);
              setPaymentWindowOpened(false);
            },
          },
        ]
      );
      return;
    }

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
        <Modal
          visible={Boolean(paymentCourseId)}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setPaymentCourseId(null);
            setPaymentWindowOpened(false);
            Alert.alert('Payment required', 'Close without paying does not unlock the course.');
          }}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-earth-300 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-earth-900 text-base font-semibold">Paystack test checkout</Text>
                <Text className="text-earth-600 text-xs mt-1">
                  Complete test payment before starting this course.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setPaymentCourseId(null);
                  setPaymentWindowOpened(false);
                  Alert.alert('Payment required', 'Close without paying does not unlock the course.');
                }}
                className="px-3 py-2 rounded-lg bg-earth-200"
                activeOpacity={0.85}
              >
                <Text className="text-earth-800 text-xs font-medium">Close</Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === 'web' ? (
              <View className="flex-1 px-5 py-4 bg-earth-100">
                <View className="rounded-xl overflow-hidden border border-earth-300 bg-white flex-1 min-h-[320px]">
                  <iframe
                    src={PAYSTACK_TEST_CHECKOUT_URL}
                    title="Paystack checkout"
                    style={{ border: 'none', width: '100%', height: '100%' }}
                  />
                </View>
                <TouchableOpacity
                  onPress={openPaystackWindow}
                  className="mt-3 rounded-xl bg-earth-800 py-3 items-center justify-center"
                  activeOpacity={0.9}
                >
                  <Text className="text-white font-medium">Open Paystack in secure window</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <WebView source={{ uri: PAYSTACK_TEST_CHECKOUT_URL }} className="flex-1" onLoadStart={() => setPaymentWindowOpened(true)} />
            )}

            <View className="px-5 py-4 border-t border-earth-300 bg-white">
              <TouchableOpacity
                onPress={() => {
                  void markFakePaymentAsComplete();
                }}
                className={`w-full rounded-xl py-3.5 items-center justify-center ${paymentWindowOpened ? 'bg-cyan-600' : 'bg-cyan-300'}`}
                activeOpacity={0.9}
                disabled={!paymentWindowOpened}
              >
                <Text className="text-white font-semibold">I completed the test payment</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
