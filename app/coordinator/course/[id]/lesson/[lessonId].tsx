import { Button } from '@/components/shared';
import { fieldPlain } from '@/constants/theme';
import { withTimeout } from '@/lib/asyncTimeout';
import { asSingleParam } from '@/lib/expoParams';
import { parseLessonVideoUrlInput } from '@/lib/lessonVideoUrl';
import { getLessonById, getLessonsByCourse } from '@/services/supabase';
import { createLesson, deleteLesson, updateLesson } from '@/services/lessonService';
import { useAuthStore } from '@/store/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RLS_HINT =
  'If this persists, create a class for this course from the dashboard (you need a class linked to the course to edit content).';

const SAVE_TIMEOUT_MS = 60_000;

export default function CoordinatorEditLessonScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: courseIdParam, lessonId: lessonIdParam } = useLocalSearchParams<{
    id: string | string[];
    lessonId: string | string[];
  }>();
  const courseId = useMemo(() => asSingleParam(courseIdParam), [courseIdParam]);
  const lessonId = useMemo(() => asSingleParam(lessonIdParam), [lessonIdParam]);
  const isNew = lessonId === 'new';
  const { user } = useAuthStore();

  /** Tab navigator can make `router.back()` skip the course screen; always return to this course. */
  const goToCourseEdit = useCallback(() => {
    if (courseId) {
      router.replace(`/coordinator/course/${courseId}` as Href);
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
    queryKey: ['coordinator-course-lessons', courseId],
    queryFn: () => getLessonsByCourse(courseId),
    enabled: !!courseId,
  });

  const { data: existing, isLoading: lessonLoading } = useQuery({
    queryKey: ['coordinator-edit-lesson', lessonId],
    queryFn: () => getLessonById(lessonId!),
    enabled: !isNew && !!lessonId,
  });

  useEffect(() => {
    if (isNew) {
      // Same screen can be reused when switching from "edit" to "add"; clear stale fields.
      setTitle('');
      setSummary('');
      setContent('');
      setDurationText('');
      setVideoText('');
      return;
    }
    if (!existing) {
      return;
    }
    setTitle(existing.title ?? '');
    setSummary(existing.description ?? '');
    setContent(existing.content ?? '');
    setDurationText(existing.duration_mins != null && existing.duration_mins > 0 ? String(existing.duration_mins) : '');
    setVideoText(existing.video_url ?? '');
  }, [
    isNew,
    lessonId,
    existing?.id,
    existing?.title,
    existing?.description,
    existing?.content,
    existing?.video_url,
    existing?.duration_mins,
  ]);

  /** Avoid @tanstack/react-query useMutation: on RN, mutations can stay "pending" when online detection is wrong. */
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onSave = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in again.');
      return;
    }
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
        if (res.error) {
          throw new Error(res.error);
        }
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
        if (res.error) {
          throw new Error(res.error);
        }
      }
      setIsSaving(false);
      void queryClient.invalidateQueries({ queryKey: ['coordinator-course-lessons', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['class-lessons'] });
      void queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      if (!isNew) {
        void queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
        void queryClient.invalidateQueries({ queryKey: ['coordinator-edit-lesson', lessonId] });
      }
      void queryClient.invalidateQueries({ queryKey: ['public-course-lessons'] });
      void queryClient.invalidateQueries({ queryKey: ['class-course'] });
      Alert.alert('Saved', isNew ? 'Lesson created.' : 'Lesson updated.');
      goToCourseEdit();
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Please try again.';
      Alert.alert('Could not save', `${m} ${RLS_HINT}`);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = () => {
    if (isNew) {
      return;
    }
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
              if (res.error) {
                throw new Error(res.error);
              }
              void queryClient.invalidateQueries({ queryKey: ['coordinator-course-lessons', courseId] });
              void queryClient.invalidateQueries({ queryKey: ['class-lessons'] });
              void queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
              void queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
              void queryClient.invalidateQueries({ queryKey: ['public-course-lessons'] });
              void queryClient.invalidateQueries({ queryKey: ['class-course'] });
              goToCourseEdit();
            } catch (e) {
              const m = e instanceof Error ? e.message : 'Please try again.';
              Alert.alert('Could not delete', `${m} ${RLS_HINT}`);
            } finally {
              setIsDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  if (!courseId) {
    return null;
  }

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
            <Text className="text-earth-800 text-sm">Title, summary, and body for learners</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Lesson title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Soil preparation basics"
            placeholderTextColor="#a8a29e"
            className={`${fieldPlain} mb-4`}
          />

          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Summary (optional)</Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Short blurb for the lesson list"
            placeholderTextColor="#a8a29e"
            multiline
            className={`${fieldPlain} min-h-[72px] mb-4`}
          />

          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Content</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Main reading, instructions, or notes (shown to students)"
            placeholderTextColor="#a8a29e"
            multiline
            className={`${fieldPlain} min-h-[160px] mb-4`}
            textAlignVertical="top"
          />

          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">YouTube link (optional)</Text>
          <TextInput
            value={videoText}
            onChangeText={setVideoText}
            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
            placeholderTextColor="#a8a29e"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className={`${fieldPlain} mb-4`}
          />

          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Duration (minutes, optional)</Text>
          <TextInput
            value={durationText}
            onChangeText={setDurationText}
            placeholder="e.g. 20"
            placeholderTextColor="#a8a29e"
            keyboardType="number-pad"
            className={`${fieldPlain} mb-6`}
          />

          <Button
            label={isSaving ? 'Saving...' : isNew ? 'Create lesson' : 'Save changes'}
            onPress={() => {
              void onSave();
            }}
            disabled={isSaving}
            fullWidth
          />
          {!isNew ? (
            <View className="mt-4">
              <Button
                label={isDeleting ? 'Removing...' : 'Delete lesson'}
                onPress={onDelete}
                disabled={isDeleting}
                variant="outline"
                fullWidth
              />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
