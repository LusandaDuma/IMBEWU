import { Button } from '@/components/shared';
import { fieldPlain } from '@/constants/theme';
import { withTimeout } from '@/lib/asyncTimeout';
import { asSingleParam } from '@/lib/expoParams';
import { parseLessonVideoUrlInput } from '@/lib/lessonVideoUrl';
import {
  getLessonById,
  getLessonsByCourse,
  getQuizEditorBundleByLesson,
} from '@/services/supabase';
import { createLesson, deleteLesson, updateLesson } from '@/services/lessonService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SAVE_TIMEOUT_MS = 60_000;

export default function AdminEditLessonScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: courseIdParam, lessonId: lessonIdParam } = useLocalSearchParams<{
    id: string | string[];
    lessonId: string | string[];
  }>();
  const courseId = useMemo(() => asSingleParam(courseIdParam), [courseIdParam]);
  const lessonId = useMemo(() => asSingleParam(lessonIdParam), [lessonIdParam]);
  const isNew = lessonId === 'new';

  const goToCourseEdit = useCallback(() => {
    if (courseId) {
      router.replace(`/admin/courses/${courseId}`);
    } else {
      router.back();
    }
  }, [courseId, router]);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [durationText, setDurationText] = useState('');
  const [videoText, setVideoText] = useState('');

  const { data: lessons = [] } = useQuery({
    queryKey: ['admin-course-lessons', courseId],
    queryFn: () => getLessonsByCourse(courseId),
    enabled: !!courseId,
  });

  const { data: existing, isLoading: lessonLoading } = useQuery({
    queryKey: ['admin-edit-lesson', lessonId],
    queryFn: () => getLessonById(lessonId),
    enabled: !isNew && !!lessonId,
  });

  const { data: existingQuiz, refetch: refetchQuiz } = useQuery({
    queryKey: ['admin-lesson-quiz-editor', lessonId],
    queryFn: () => getQuizEditorBundleByLesson(lessonId),
    enabled: !isNew && !!lessonId,
  });

  useEffect(() => {
    if (isNew) {
      setTitle('');
      setSummary('');
      setContent('');
      setDurationText('');
      setVideoText('');
      return;
    }
    if (!existing) return;
    setTitle(existing.title ?? '');
    setSummary(existing.description ?? '');
    setContent(existing.content ?? '');
    setDurationText(existing.duration_mins != null && existing.duration_mins > 0 ? String(existing.duration_mins) : '');
    setVideoText(existing.video_url ?? '');
  }, [isNew, existing?.id, existing?.title, existing?.description, existing?.content, existing?.video_url, existing?.duration_mins]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onSave = async () => {
    if (!courseId?.trim()) {
      Alert.alert('Missing course', 'Go back and open this screen from the course again.');
      return;
    }
    const t = title.trim();
    if (!t) {
      Alert.alert('Title required', 'Please enter a lesson title.');
      return;
    }
    const videoParse = parseLessonVideoUrlInput(videoText);
    if (videoParse.error) {
      Alert.alert('YouTube link', videoParse.error);
      return;
    }
    setIsSaving(true);
    try {
      const durationParsed = parseInt(durationText.trim(), 10);
      const duration_mins = Number.isFinite(durationParsed) && durationParsed > 0 ? durationParsed : null;
      if (isNew) {
        const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order_index ?? 0), 0) + 1 : 0;
        const res = await withTimeout(
          createLesson({
            course_id: courseId,
            order_index: nextOrder,
            title: t,
            description: summary.trim() || null,
            content: content.trim() || null,
            video_url: videoParse.value,
            duration_mins,
          }),
          SAVE_TIMEOUT_MS,
          'Save lesson'
        );
        if (res.error) throw new Error(res.error);
      } else {
        const res = await withTimeout(
          updateLesson(lessonId, {
            title: t,
            description: summary.trim() || undefined,
            content: content.trim() || undefined,
            video_url: videoParse.value,
            duration_mins: duration_mins ?? undefined,
          }),
          SAVE_TIMEOUT_MS,
          'Save lesson'
        );
        if (res.error) throw new Error(res.error);
      }
      void queryClient.invalidateQueries({ queryKey: ['admin-course-lessons', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      if (!isNew) {
        void queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
        void queryClient.invalidateQueries({ queryKey: ['admin-edit-lesson', lessonId] });
      }
      Alert.alert('Saved', isNew ? 'Lesson created.' : 'Lesson updated.');
      goToCourseEdit();
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Please try again.';
      Alert.alert('Could not save', m);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = () => {
    if (isNew) return;
    Alert.alert('Delete lesson', 'This removes the lesson and related quizzes from the course. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsDeleting(true);
            try {
              const res = await deleteLesson(lessonId);
              if (res.error) throw new Error(res.error);
              void queryClient.invalidateQueries({ queryKey: ['admin-course-lessons', courseId] });
              void queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
              goToCourseEdit();
            } catch (e) {
              const m = e instanceof Error ? e.message : 'Please try again.';
              Alert.alert('Could not delete', m);
            } finally {
              setIsDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  if (!courseId) return null;

  if (!isNew && lessonLoading) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
          <ActivityIndicator size="large" color="#16a34a" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!isNew && !existing) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-5" edges={['top']}>
          <Text className="text-earth-800 text-lg font-semibold mb-3">Lesson not found</Text>
          <Button label="Back" onPress={goToCourseEdit} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 py-4 flex-row items-center">
          <TouchableOpacity
            onPress={goToCourseEdit}
            className="w-10 h-10 rounded-full bg-earth-900/5 items-center justify-center"
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color="#1c1917" strokeWidth={1.5} />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text className="text-black text-xl font-semibold">{isNew ? 'New lesson' : 'Edit lesson'}</Text>
            <Text className="text-earth-800 text-sm">Admin lesson and quiz editor</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Lesson title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Lesson title" placeholderTextColor="#a8a29e" className={`${fieldPlain} mb-4`} />
          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Summary (optional)</Text>
          <TextInput value={summary} onChangeText={setSummary} placeholder="Summary" placeholderTextColor="#a8a29e" multiline className={`${fieldPlain} min-h-[72px] mb-4`} />
          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Content</Text>
          <TextInput value={content} onChangeText={setContent} placeholder="Lesson content" placeholderTextColor="#a8a29e" multiline className={`${fieldPlain} min-h-[160px] mb-4`} textAlignVertical="top" />
          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">YouTube link (optional)</Text>
          <TextInput value={videoText} onChangeText={setVideoText} placeholder="https://..." placeholderTextColor="#a8a29e" autoCapitalize="none" autoCorrect={false} keyboardType="url" className={`${fieldPlain} mb-4`} />
          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Duration (minutes, optional)</Text>
          <TextInput value={durationText} onChangeText={setDurationText} placeholder="e.g. 20" placeholderTextColor="#a8a29e" keyboardType="number-pad" className={`${fieldPlain} mb-6`} />

          <Button label={isSaving ? 'Saving...' : isNew ? 'Create lesson' : 'Save changes'} onPress={() => void onSave()} disabled={isSaving} fullWidth />
          {!isNew ? (
            <View className="mt-4">
              <Button label={isDeleting ? 'Removing...' : 'Delete lesson'} onPress={onDelete} disabled={isDeleting} variant="outline" fullWidth />
            </View>
          ) : null}

          <View className="mt-8 pt-5 border-t border-earth-300/60">
            <Text className="text-earth-900 text-base font-semibold mb-1">Lesson quiz</Text>
            <Text className="text-earth-600 text-sm mb-2">Create or edit a quiz in a dedicated quiz editor screen.</Text>
            {isNew ? (
              <Text className="text-earth-500 text-sm">Save this lesson first, then create its quiz.</Text>
            ) : (
              <View>
                <Text className="text-earth-700 text-sm mb-3">
                  {existingQuiz ? `Current quiz: ${existingQuiz.title}` : 'No quiz yet for this lesson.'}
                </Text>
                <Button
                  label={existingQuiz ? 'Edit quiz' : 'Create quiz'}
                  onPress={() => router.push(`/admin/courses/${courseId}/lesson-quiz/${lessonId}`)}
                  fullWidth
                />
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
