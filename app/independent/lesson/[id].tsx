/**
 * @fileoverview Independent learner lesson reader — luxury UI.
 * Same visual treatment as student lesson; no quiz section.
 */

import { LessonVideoCallout, NolwaziActionsModal } from '@/components/shared';
import { LessonContent } from '@/components/shared/molecules/LessonContent';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import {
  checkAndAwardCourseBadges,
  getLessonById,
  getLessonProgress,
  getLessonsByCourse,
  updateLessonProgress,
} from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CheckCircle, ChevronLeft, Clock, MessageCircle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IndependentLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [nolwaziContextLabel, setNolwaziContextLabel] = useState<string | null>(null);

  const { data: lesson, refetch: refetchLesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLessonById(id),
  });
  const { data: courseLessons = [] } = useQuery({
    queryKey: ['course-lessons', lesson?.course_id],
    queryFn: () => getLessonsByCourse(lesson!.course_id),
    enabled: !!lesson?.course_id,
  });
  const { data: existingProgress, refetch: refetchProgress } = useQuery({
    queryKey: ['lesson-progress', user?.id, id],
    queryFn: () => (user ? getLessonProgress(user.id, id) : Promise.resolve(null)),
    enabled: !!user,
  });

  useRefetchOnFocus(() => {
    void refetchLesson();
    if (user) void refetchProgress();
  }, Boolean(id));

  useEffect(() => { setProgress(0); }, [id]);

  const existingPct = useMemo(() => {
    if (existingProgress?.is_completed) return 100;
    return existingProgress?.pct_complete ?? 0;
  }, [existingProgress]);

  const progressMutation = useMutation({
    mutationFn: async (percentage: number) => {
      if (!user) return { awardedCount: 0 };
      const progressRow = await updateLessonProgress(user.id, id, percentage);
      let awardedCount = 0;
      if (progressRow && percentage >= 100 && lesson?.course_id) {
        awardedCount = await checkAndAwardCourseBadges(user.id, lesson.course_id);
      }
      return { awardedCount };
    },
    onSuccess: ({ awardedCount }) => {
      if (!user || !lesson) return;
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', user.id, id] });
      queryClient.invalidateQueries({ queryKey: ['independent-course-progress', user.id, lesson.course_id] });
      queryClient.invalidateQueries({ queryKey: ['course-lesson-progress', user.id, lesson.course_id] });
      queryClient.invalidateQueries({ queryKey: ['independent-enrolments', user.id] });
      queryClient.invalidateQueries({ queryKey: ['earned-course-badges', user.id] });
      if (awardedCount > 0) {
        Alert.alert('🏅 Completion badge earned', 'You completed this course and unlocked your badge!');
      }
    },
  });

  useEffect(() => { setProgress((prev) => Math.max(prev, existingPct)); }, [existingPct]);

  const nextLessonId = useMemo(() => {
    if (!lesson || !courseLessons.length) return null;
    const idx = courseLessons.findIndex((l) => l.id === lesson.id);
    if (idx < 0 || idx >= courseLessons.length - 1) return null;
    return courseLessons[idx + 1]!.id;
  }, [lesson, courseLessons]);

  const isComplete = progress >= 100 || Boolean(existingProgress?.is_completed);

  const goToCourse = () => {
    if (lesson?.course_id) router.push({ pathname: '/independent/course/[id]', params: { id: lesson.course_id } });
    else router.back();
  };
  const goToNextLesson = () => {
    if (!nextLessonId) return;
    router.replace({ pathname: '/independent/lesson/[id]', params: { id: nextLessonId } });
  };
  const handleComplete = async () => {
    if (progress >= 100 || progressMutation.isPending) return;
    setProgress(100);
    try {
      await progressMutation.mutateAsync(100);
      if (nextLessonId) goToNextLesson();
    } catch { /* silent */ }
  };
  const openNolwaziActions = () => {
    setNolwaziContextLabel(`lesson "${lesson?.title ?? 'this lesson'}" in course "${lesson?.course_id ?? ''}" (courseId: ${lesson?.course_id ?? ''})`);
  };
  const handleNolwaziAction = (prompt: string) => {
    setNolwaziContextLabel(null);
    router.push({ pathname: '/nolwazi', params: { q: prompt } });
  };

  const lessonIndex = courseLessons.findIndex((l) => l.id === lesson?.id);
  const lessonNumber = lessonIndex >= 0 ? lessonIndex + 1 : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#D6D6D6' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Dark green top bar ──────────────────────────────────────────── */}
      <LinearGradient colors={['#0a2416', '#0d3020']} style={{ paddingBottom: 0 }}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <TouchableOpacity
                onPress={goToCourse}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <ChevronLeft size={20} color="#f5f0e8" strokeWidth={1.5} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={openNolwaziActions}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: 'rgba(212,175,55,0.12)',
                  borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
                  borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
                }}
                activeOpacity={0.8}
              >
                <MessageCircle size={13} color="#d4af37" strokeWidth={1.5} />
                <Text style={{ color: '#d4af37', fontSize: 11, fontWeight: '500', marginLeft: 5, letterSpacing: 0.5 }}>
                  Nolwazi
                </Text>
              </TouchableOpacity>
            </View>

            {lessonNumber && (
              <View style={{
                borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
                borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
                alignSelf: 'flex-start', marginBottom: 10,
              }}>
                <Text style={{ color: '#d4af37', fontSize: 9, letterSpacing: 2.5, fontWeight: '400' }}>
                  LESSON {lessonNumber} OF {courseLessons.length}
                </Text>
              </View>
            )}

            <Text style={{
              color: '#f5f0e8', fontSize: 20, fontWeight: '200',
              letterSpacing: -0.3, lineHeight: 26, marginBottom: 12,
            }}>
              {lesson?.title ?? 'Loading…'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={13} color="rgba(245,240,232,0.4)" strokeWidth={1.5} />
              <Text style={{ color: 'rgba(245,240,232,0.4)', fontSize: 11, fontWeight: '300', marginLeft: 6 }}>
                {lesson?.duration_mins ?? '—'} min estimated · Self-paced
              </Text>
            </View>

            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: 'rgba(245,240,232,0.35)', fontSize: 9, letterSpacing: 2, fontWeight: '400' }}>PROGRESS</Text>
                <Text style={{ color: isComplete ? '#d4af37' : 'rgba(245,240,232,0.35)', fontSize: 9, letterSpacing: 1, fontWeight: '400' }}>
                  {isComplete ? '✓ COMPLETE' : `${progress}%`}
                </Text>
              </View>
              <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 1, backgroundColor: isComplete ? '#d4af37' : '#22d3ee', width: `${progress}%` }} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {lesson?.video_url && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <LessonVideoCallout videoUrl={lesson.video_url} variant="accent" />
          </View>
        )}

        {lesson?.description && (
          <View style={{
            marginHorizontal: 16, marginTop: 16,
            backgroundColor: 'rgba(8,145,178,0.06)',
            borderLeftWidth: 3, borderLeftColor: '#0891b2',
            borderRadius: 10, padding: 14,
          }}>
            <Text style={{ color: '#0e7490', fontSize: 9, letterSpacing: 2.5, fontWeight: '600', marginBottom: 6 }}>
              LESSON SUMMARY
            </Text>
            <Text style={{ color: '#292524', fontSize: 13, fontWeight: '300', lineHeight: 21 }}>
              {lesson.description}
            </Text>
          </View>
        )}

        <View style={{ margin: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 24 }}>
          <LessonContent content={lesson?.content ?? ''} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          {!isComplete ? (
            <TouchableOpacity
              onPress={() => void handleComplete()}
              disabled={progressMutation.isPending}
              style={{
                backgroundColor: '#0891b2', borderRadius: 16, paddingVertical: 17,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              }}
              activeOpacity={0.9}
            >
              <CheckCircle size={18} color="white" strokeWidth={1.5} />
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '500', marginLeft: 8 }}>
                {progressMutation.isPending ? 'Saving…' : 'Mark as complete'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{
              backgroundColor: 'rgba(8,145,178,0.1)',
              borderWidth: 1, borderColor: 'rgba(8,145,178,0.25)',
              borderRadius: 16, paddingVertical: 14,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={16} color="#0891b2" strokeWidth={1.5} />
              <Text style={{ color: '#0891b2', fontSize: 14, fontWeight: '400', marginLeft: 8 }}>
                Lesson completed
              </Text>
            </View>
          )}

          {isComplete && nextLessonId && (
            <TouchableOpacity
              onPress={goToNextLesson}
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, paddingVertical: 17,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              }}
              activeOpacity={0.9}
            >
              <Text style={{ color: '#1c1917', fontSize: 15, fontWeight: '400', marginRight: 8 }}>Next lesson</Text>
              <ArrowRight size={18} color="#1c1917" strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <NolwaziActionsModal
        visible={Boolean(nolwaziContextLabel)}
        contextLabel={nolwaziContextLabel ?? ''}
        onClose={() => setNolwaziContextLabel(null)}
        onSelect={(action) => handleNolwaziAction(action.prompt)}
      />
    </View>
  );
}
