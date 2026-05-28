/**
 * @fileoverview Student lesson reader — luxury UI with structured content,
 * proper section headings, bullet rendering, image placeholders, and quiz.
 */

import { LessonVideoCallout, NolwaziActionsModal, ProgressBar } from '@/components/shared';
import { LessonContent } from '@/components/shared/molecules/LessonContent';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import {
  checkAndAwardCourseBadges,
  getLessonById,
  getLessonProgress,
  getLessonsByCourse,
  getQuizBundleByLesson,
  submitQuizAttempt,
  updateLessonProgress,
} from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowRight,
  Award,
  CheckCircle,
  ChevronLeft,
  Clock,
  MessageCircle,
  Sparkles,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const GOLD = '#C9A84C';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [nolwaziContextLabel, setNolwaziContextLabel] = useState<string | null>(null);
  const [badgeAwarded, setBadgeAwarded] = useState(false);

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
  const { data: quizBundle, refetch: refetchQuiz } = useQuery({
    queryKey: ['lesson-quiz-bundle', id],
    queryFn: () => getQuizBundleByLesson(id),
  });

  const [selectedOptionByQuestionId, setSelectedOptionByQuestionId] = useState<Record<string, string>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{ passed: boolean; score: number } | null>(null);

  useRefetchOnFocus(() => {
    void refetchLesson();
    if (user) void refetchProgress();
    void refetchQuiz();
  }, Boolean(id));

  useEffect(() => {
    setProgress(0);
    setSelectedOptionByQuestionId({});
    setQuizResult(null);
    setBadgeAwarded(false);
  }, [id]);

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
      queryClient.invalidateQueries({ queryKey: ['student-course-progress', user.id, lesson.course_id] });
      queryClient.invalidateQueries({ queryKey: ['course-lesson-progress', user.id, lesson.course_id] });
      queryClient.invalidateQueries({ queryKey: ['student-enrolments', user.id] });
      queryClient.invalidateQueries({ queryKey: ['earned-course-badges', user.id] });
      if (awardedCount > 0) {
        Alert.alert('🏅 Completion badge earned', 'You completed this course and unlocked your badge!');
      }
    },
  });

  useEffect(() => {
    setProgress((prev) => Math.max(prev, existingPct));
  }, [existingPct]);

  const lessonIndex = courseLessons.findIndex((l) => l.id === lesson?.id);
  const lessonNumber = lessonIndex >= 0 ? lessonIndex + 1 : null;

  const nextLessonId = useMemo(() => {
    if (!lesson || !courseLessons.length) return null;
    const idx = courseLessons.findIndex((l) => l.id === lesson.id);
    if (idx < 0 || idx >= courseLessons.length - 1) return null;
    return courseLessons[idx + 1]!.id;
  }, [lesson, courseLessons]);

  const isFinalLesson = lessonIndex >= 0 && courseLessons.length > 0 && lessonIndex === courseLessons.length - 1;

  const isComplete = progress >= 100 || Boolean(existingProgress?.is_completed);

  const goToCourse = () => {
    if (lesson?.course_id) router.push({ pathname: '/student/course/[id]', params: { id: lesson.course_id } });
    else router.back();
  };

  const goToNextLesson = () => {
    if (!nextLessonId) return;
    router.replace({ pathname: '/student/lesson/[id]', params: { id: nextLessonId } });
  };

  const handleComplete = async () => {
    if (progress >= 100 || progressMutation.isPending) return;
    setProgress(100);
    try {
      await progressMutation.mutateAsync(100);
      if (nextLessonId) goToNextLesson();
    } catch { /* silent */ }
  };

  const handleCourseComplete = async () => {
    if (!user || !lesson?.course_id) return;
    try {
      const awarded = await checkAndAwardCourseBadges(user.id, lesson.course_id);
      setBadgeAwarded(true);
      queryClient.invalidateQueries({ queryKey: ['earned-course-badges', user.id] });
      queryClient.invalidateQueries({ queryKey: ['student-course-progress', user.id, lesson.course_id] });
      if (awarded > 0) {
        Alert.alert(
          '🏅 Badge Earned!',
          'You completed the course and earned your achievement badge!',
          [
            { text: 'View Achievements', onPress: () => router.push('/student/achievements') },
            { text: 'Stay here', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          '🎓 Course Complete!',
          'Your progress has been recorded. Check your Achievements page.',
          [
            { text: 'View Achievements', onPress: () => router.push('/student/achievements') },
            { text: 'Done', style: 'cancel' },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Could not record completion. Please try again.');
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizBundle || !user) return;
    if (!isComplete) {
      Alert.alert('Complete lesson first', 'Mark this lesson as complete before writing the quiz.');
      return;
    }
    const unanswered = quizBundle.questions.some(
      (q) => q.type !== 'short_answer' && !selectedOptionByQuestionId[q.id]
    );
    if (unanswered) {
      Alert.alert('Quiz incomplete', 'Please answer all questions before submitting.');
      return;
    }
    setIsSubmittingQuiz(true);
    try {
      const answers = quizBundle.questions.map((q) => ({
        question_id: q.id,
        option_id: selectedOptionByQuestionId[q.id],
      }));
      const result = await submitQuizAttempt(user.id, quizBundle.id, answers);
      if (!result) { Alert.alert('Could not submit quiz', 'Please try again.'); return; }
      setQuizResult({ passed: result.passed, score: result.score });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const openNolwaziActions = () => {
    const contextLabel = `lesson "${lesson?.title ?? 'this lesson'}" in course "${lesson?.course_id ?? 'current course'}" (courseId: ${lesson?.course_id ?? ''})`;
    setNolwaziContextLabel(contextLabel);
  };

  const handleNolwaziAction = (prompt: string) => {
    setNolwaziContextLabel(null);
    router.push({ pathname: '/nolwazi', params: { q: prompt } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#D6D6D6' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#0a2416', '#0d3020']} style={{ paddingBottom: 0 }}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>

            {/* Back + Nolwazi row */}
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

            {/* Lesson number badge */}
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

            {/* Title */}
            <Text style={{
              color: '#f5f0e8', fontSize: 20, fontWeight: '200',
              letterSpacing: -0.3, lineHeight: 26, marginBottom: 12,
            }}>
              {lesson?.title ?? 'Loading…'}
            </Text>

            {/* Meta row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={13} color="rgba(245,240,232,0.4)" strokeWidth={1.5} />
              <Text style={{ color: 'rgba(245,240,232,0.4)', fontSize: 11, fontWeight: '300', marginLeft: 6 }}>
                {lesson?.duration_mins ?? '—'} min estimated
              </Text>
            </View>

            {/* Progress bar */}
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: 'rgba(245,240,232,0.35)', fontSize: 9, letterSpacing: 2, fontWeight: '400' }}>
                  PROGRESS
                </Text>
                <Text style={{ color: isComplete ? '#d4af37' : 'rgba(245,240,232,0.35)', fontSize: 9, letterSpacing: 1, fontWeight: '400' }}>
                  {isComplete ? '✓ COMPLETE' : `${progress}%`}
                </Text>
              </View>
              <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
                <View style={{
                  height: '100%', borderRadius: 1,
                  backgroundColor: isComplete ? '#d4af37' : '#4ade80',
                  width: `${progress}%`,
                }} />
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
        {/* Video callout */}
        {lesson?.video_url && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <LessonVideoCallout videoUrl={lesson.video_url} variant="primary" />
          </View>
        )}

        {/* Summary strip */}
        {lesson?.description && (
          <View style={{
            marginHorizontal: 16, marginTop: 16,
            backgroundColor: 'rgba(22,163,74,0.06)',
            borderLeftWidth: 3, borderLeftColor: '#16a34a',
            borderRadius: 10, padding: 14,
          }}>
            <Text style={{ color: '#166534', fontSize: 9, letterSpacing: 2.5, fontWeight: '600', marginBottom: 6 }}>
              LESSON SUMMARY
            </Text>
            <Text style={{ color: '#292524', fontSize: 13, fontWeight: '300', lineHeight: 21 }}>
              {lesson.description}
            </Text>
          </View>
        )}

        {/* Main content card */}
        <View style={{
          margin: 16,
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: 24, padding: 24,
        }}>
          <LessonContent content={lesson?.content ?? ''} />
        </View>

        {/* ── Quiz section ──────────────────────────────────────────────── */}
        {quizBundle && (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <LinearGradient
              colors={['#0a2416', '#0d3020']}
              style={{ borderRadius: 24, padding: 24 }}
            >
              {/* Quiz header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{
                  borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
                  borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{ color: '#d4af37', fontSize: 9, letterSpacing: 2.5, fontWeight: '400' }}>
                    LESSON QUIZ
                  </Text>
                </View>
              </View>

              <Text style={{
                color: '#f5f0e8', fontSize: 18, fontWeight: '200',
                letterSpacing: -0.2, marginBottom: 4, marginTop: 10,
              }}>
                {quizBundle.title}
              </Text>
              <Text style={{
                color: 'rgba(245,240,232,0.4)', fontSize: 12,
                fontWeight: '300', marginBottom: 24,
              }}>
                Pass mark: {quizBundle.pass_score}% · {quizBundle.questions.length} question{quizBundle.questions.length !== 1 ? 's' : ''}
              </Text>

              {/* Quiz result banner */}
              {quizResult && (
                <View style={{
                  backgroundColor: quizResult.passed ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                  borderWidth: 1,
                  borderColor: quizResult.passed ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)',
                  borderRadius: 14, padding: 16, marginBottom: 20,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: quizResult.passed ? '#4ade80' : '#f87171',
                    fontSize: 24, fontWeight: '200', letterSpacing: -1, marginBottom: 4,
                  }}>
                    {quizResult.score}%
                  </Text>
                  <Text style={{
                    color: quizResult.passed ? '#4ade80' : '#f87171',
                    fontSize: 11, fontWeight: '500', letterSpacing: 2,
                  }}>
                    {quizResult.passed ? '✓ PASSED' : '✗ NOT YET PASSED'}
                  </Text>
                </View>
              )}

              {/* Questions */}
              {quizBundle.questions.map((question, qi) => (
                <View key={question.id} style={{ marginBottom: 24 }}>
                  <Text style={{
                    color: '#f5f0e8', fontSize: 14, fontWeight: '300',
                    lineHeight: 22, marginBottom: 14,
                  }}>
                    <Text style={{ color: '#d4af37', fontWeight: '500' }}>{qi + 1}. </Text>
                    {question.text}
                  </Text>

                  {question.options.map((option) => {
                    const isSelected = selectedOptionByQuestionId[question.id] === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => setSelectedOptionByQuestionId((prev) => ({ ...prev, [question.id]: option.id }))}
                        activeOpacity={0.85}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          borderWidth: 1,
                          borderColor: isSelected ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)',
                          borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
                          backgroundColor: isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                          marginBottom: 8,
                        }}
                      >
                        <View style={{
                          width: 20, height: 20, borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#d4af37' : 'rgba(255,255,255,0.25)',
                          backgroundColor: isSelected ? 'rgba(212,175,55,0.2)' : 'transparent',
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 12, flexShrink: 0,
                        }}>
                          {isSelected && (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#d4af37' }} />
                          )}
                        </View>
                        <Text style={{
                          flex: 1, color: isSelected ? '#f5f0e8' : 'rgba(245,240,232,0.65)',
                          fontSize: 13, fontWeight: isSelected ? '400' : '300',
                          lineHeight: 20,
                        }}>
                          {option.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {/* Submit */}
              {!isComplete && (
                <Text style={{
                  color: 'rgba(245,240,232,0.3)', fontSize: 11,
                  fontWeight: '300', textAlign: 'center', marginBottom: 12,
                }}>
                  Complete the lesson above to unlock quiz submission.
                </Text>
              )}

              <TouchableOpacity
                onPress={() => void handleSubmitQuiz()}
                disabled={isSubmittingQuiz || !isComplete}
                style={{
                  backgroundColor: isComplete ? '#d4af37' : 'rgba(212,175,55,0.25)',
                  borderRadius: 14, paddingVertical: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                }}
                activeOpacity={0.9}
              >
                <Sparkles size={15} color={isComplete ? '#0a2416' : 'rgba(212,175,55,0.5)'} strokeWidth={2} />
                <Text style={{
                  color: isComplete ? '#0a2416' : 'rgba(212,175,55,0.5)',
                  fontSize: 15, fontWeight: '600', marginLeft: 8,
                }}>
                  {isSubmittingQuiz ? 'Submitting…' : 'Submit quiz'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ── Complete / Next ───────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          {!isComplete ? (
            <TouchableOpacity
              onPress={() => void handleComplete()}
              disabled={progressMutation.isPending}
              style={{
                backgroundColor: '#16a34a',
                borderRadius: 16, paddingVertical: 17,
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
              backgroundColor: 'rgba(22,163,74,0.1)',
              borderWidth: 1, borderColor: 'rgba(22,163,74,0.25)',
              borderRadius: 16, paddingVertical: 14,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={16} color="#16a34a" strokeWidth={1.5} />
              <Text style={{ color: '#16a34a', fontSize: 14, fontWeight: '400', marginLeft: 8 }}>
                Lesson completed
              </Text>
            </View>
          )}

          {isComplete && nextLessonId && (
            <TouchableOpacity
              onPress={goToNextLesson}
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 16, paddingVertical: 17,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              }}
              activeOpacity={0.9}
            >
              <Text style={{ color: '#1c1917', fontSize: 15, fontWeight: '400', marginRight: 8 }}>
                Next lesson
              </Text>
              <ArrowRight size={18} color="#1c1917" strokeWidth={1.5} />
            </TouchableOpacity>
          )}

          {/* ── Course Completed button — final lesson only ────────────── */}
          {isFinalLesson && isComplete && (
            <TouchableOpacity
              onPress={() => void handleCourseComplete()}
              disabled={badgeAwarded}
              style={{
                backgroundColor: badgeAwarded ? 'rgba(201,168,76,0.15)' : GOLD,
                borderRadius: 16,
                paddingVertical: 17,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: GOLD,
                marginTop: 4,
              }}
              activeOpacity={0.9}
            >
              <Award size={18} color={badgeAwarded ? GOLD : '#022418'} strokeWidth={1.5} />
              <Text style={{
                color: badgeAwarded ? GOLD : '#022418',
                fontSize: 15,
                fontWeight: '700',
                marginLeft: 8,
              }}>
                {badgeAwarded ? '🏅 Badge Awarded!' : '🎓 Complete Course & Earn Badge'}
              </Text>
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
