/**
 * @fileoverview Lesson reader — progress, content, completion (LMS).
 */

import { Button, LessonVideoCallout, NolwaziActionsModal, ProgressBar, ScreenHeader } from '@/components/shared';
import { APP_BACKGROUND_COLOR, surfaceProse } from '@/constants/theme';
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
import { ArrowRight, CheckCircle, Clock, MessageCircle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LessonScreen() {
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
  const { data: quizBundle, refetch: refetchQuiz } = useQuery({
    queryKey: ['lesson-quiz-bundle', id],
    queryFn: () => getQuizBundleByLesson(id),
  });
  const [selectedOptionByQuestionId, setSelectedOptionByQuestionId] = useState<Record<string, string>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  useRefetchOnFocus(
    () => {
      void refetchLesson();
      if (user) void refetchProgress();
      void refetchQuiz();
    },
    Boolean(id)
  );

  useEffect(() => {
    setProgress(0);
    setSelectedOptionByQuestionId({});
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
        Alert.alert('Completion badge earned', 'You completed this course and unlocked your course badge.');
      }
    },
  });

  useEffect(() => {
    setProgress((prev) => Math.max(prev, existingPct));
  }, [existingPct]);

  const handleComplete = async () => {
    if (progress >= 100 || progressMutation.isPending) return;
    setProgress(100);
    try {
      await progressMutation.mutateAsync(100);
      if (nextLessonId) {
        goToNextLesson();
      }
    } catch {
      // Error feedback is handled by mutation/query state; keep user on current lesson.
    }
  };

  const nextLessonId = useMemo(() => {
    if (!lesson || !courseLessons.length) return null;
    const idx = courseLessons.findIndex((l) => l.id === lesson.id);
    if (idx < 0 || idx >= courseLessons.length - 1) return null;
    return courseLessons[idx + 1]!.id;
  }, [lesson, courseLessons]);

  const isComplete = progress >= 100 || Boolean(existingProgress?.is_completed);

  const goToCourse = () => {
    if (lesson?.course_id) {
      router.push({ pathname: '/student/course/[id]', params: { id: lesson.course_id } });
    } else {
      router.back();
    }
  };

  const goToNextLesson = () => {
    if (!nextLessonId) return;
    router.replace({ pathname: '/student/lesson/[id]', params: { id: nextLessonId } });
  };

  const handleSubmitQuiz = async () => {
    if (!quizBundle || !user) return;
    if (!isComplete) {
      Alert.alert('Complete lesson first', 'Mark this lesson as complete before writing the quiz.');
      return;
    }
    const unanswered = quizBundle.questions.some(
      (question) => question.type !== 'short_answer' && !selectedOptionByQuestionId[question.id]
    );
    if (unanswered) {
      Alert.alert('Quiz incomplete', 'Please answer all quiz questions first.');
      return;
    }
    setIsSubmittingQuiz(true);
    try {
      const answers = quizBundle.questions.map((question) => ({
        question_id: question.id,
        option_id: selectedOptionByQuestionId[question.id],
      }));
      const result = await submitQuizAttempt(user.id, quizBundle.id, answers);
      if (!result) {
        Alert.alert('Could not submit quiz', 'Please try again.');
        return;
      }
      Alert.alert(
        result.passed ? 'Quiz passed' : 'Quiz submitted',
        `Score: ${result.score}% (Attempt ${result.attemptNumber})`
      );
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const openNolwaziActions = () => {
    const courseIdNote = lesson?.course_id ? ` (courseId: ${lesson.course_id})` : '';
    const contextLabel = `lesson "${lesson?.title ?? 'this lesson'}" in course "${lesson?.course_id ?? 'current course'}"${courseIdNote}`;
    setNolwaziContextLabel(contextLabel);
  };

  const handleNolwaziAction = (prompt: string) => {
    setNolwaziContextLabel(null);
    router.push({
      pathname: '/nolwazi',
      params: { q: prompt },
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]}>
        <SafeAreaView edges={['top']}>
          <ScreenHeader
            title={lesson?.title ?? 'Lesson'}
            subtitle="Read, reflect, then mark complete to unlock the next step."
            variant="light"
            onBack={goToCourse}
          />
        </SafeAreaView>
      </LinearGradient>

      <View className="px-5 py-4 border-b border-earth-400/40 bg-transparent">
        <ProgressBar value={progress} tone="primary" showLabel />
      </View>

      <ScrollView
        className="flex-1 px-5 py-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 168 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center mb-4">
          <Clock size={16} color="#78716c" />
          <Text className="text-earth-500 text-sm ml-2 font-light">
            {lesson?.duration_mins ?? '—'} minutes estimated
          </Text>
          <View className="flex-1" />
          <Button
            label="Nolwazi"
            onPress={openNolwaziActions}
            variant="ghost"
            size="sm"
            leftIcon={MessageCircle}
          />
        </View>

        <LessonVideoCallout videoUrl={lesson?.video_url} variant="primary" />

        <View className={surfaceProse}>
          <Text className="text-xl font-light text-earth-900 mb-3 tracking-tight">{lesson?.title}</Text>
          <Text className="text-earth-600 leading-7 text-base font-light">
            {lesson?.content || 'No lesson body yet. Your instructor will add reading or video notes here.'}
          </Text>
        </View>

        {lesson?.description ? (
          <View className="mb-8 pl-3 border-l-2 border-l-primary-500/50 py-1">
            <Text className="text-xs font-medium text-primary-900/80 uppercase tracking-[0.2em] mb-3">
              Summary
            </Text>
            <Text className="text-earth-700 leading-6 text-sm font-light">{lesson.description}</Text>
          </View>
        ) : null}

        {quizBundle ? (
          <View className="mb-8 rounded-2xl border border-earth-300/60 p-4">
            <Text className="text-earth-900 font-semibold text-base mb-1">{quizBundle.title}</Text>
            <Text className="text-earth-600 text-sm mb-4">Pass score: {quizBundle.pass_score}%</Text>
            {quizBundle.questions.map((question, questionIndex) => (
              <View key={question.id} className="mb-4">
                <Text className="text-earth-800 font-medium mb-2">
                  {questionIndex + 1}. {question.text}
                </Text>
                {question.options.map((option) => {
                  const isSelected = selectedOptionByQuestionId[question.id] === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() =>
                        setSelectedOptionByQuestionId((prev) => ({
                          ...prev,
                          [question.id]: option.id,
                        }))
                      }
                      className={`mb-2 rounded-xl px-3 py-2 border ${isSelected ? 'border-primary-600 bg-primary-600/10' : 'border-earth-300/70'}`}
                    >
                      <Text className={isSelected ? 'text-primary-900 font-medium' : 'text-earth-700'}>
                        {option.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <Button
              label={isSubmittingQuiz ? 'Submitting quiz...' : 'Submit quiz'}
              onPress={() => {
                void handleSubmitQuiz();
              }}
              disabled={isSubmittingQuiz || !isComplete}
              variant="primary"
              fullWidth
            />
            {!isComplete ? (
              <Text className="text-earth-500 text-xs mt-2">Complete the lesson first to unlock quiz submission.</Text>
            ) : null}
          </View>
        ) : null}

        <View className="mb-8">
          <Button
            label="Mark as complete"
            onPress={handleComplete}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={CheckCircle}
            disabled={isComplete}
          />
          {isComplete && nextLessonId ? (
            <View className="mt-3">
              <Button
                label="Next lesson"
                onPress={goToNextLesson}
                variant="secondary"
                size="lg"
                fullWidth
                leftIcon={ArrowRight}
                disabled={false}
              />
            </View>
          ) : null}
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
