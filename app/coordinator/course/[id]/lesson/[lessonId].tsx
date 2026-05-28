/**
 * @fileoverview Coordinator edit lesson — luxury emerald & gold theme
 * Keeps all existing save/delete/quiz logic intact
 */

import { Button } from '@/components/shared';
import { withTimeout } from '@/lib/asyncTimeout';
import { asSingleParam } from '@/lib/expoParams';
import { parseLessonVideoUrlInput } from '@/lib/lessonVideoUrl';
import { createLesson, deleteLesson, updateLesson } from '@/services/lessonService';
import { createLessonQuiz, getLessonById, getLessonsByCourse, getQuizBundleByLesson } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, Clock, FileText, Link, Sparkles, Trash2, Youtube } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

const RLS_HINT = 'If this persists, make sure you have a class linked to this course.';
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

  const goToCourseEdit = useCallback(() => {
    if (courseId) router.replace(`/coordinator/course/${courseId}` as Href);
    else router.back();
  }, [courseId, router]);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [durationText, setDurationText] = useState('');
  const [videoText, setVideoText] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizPassScore, setQuizPassScore] = useState('60');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

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

  const { data: existingQuiz, refetch: refetchQuiz } = useQuery({
    queryKey: ['lesson-quiz-bundle', lessonId],
    queryFn: () => getQuizBundleByLesson(lessonId),
    enabled: !isNew && !!lessonId,
  });

  useEffect(() => {
    if (isNew) {
      setTitle(''); setSummary(''); setContent(''); setDurationText('');
      setVideoText(''); setQuizTitle(''); setQuizQuestion('');
      setQuizPassScore('60'); setOptionA(''); setOptionB('');
      setOptionC(''); setOptionD(''); setCorrectOption('A');
      return;
    }
    if (!existing) return;
    setTitle(existing.title ?? '');
    setSummary(existing.description ?? '');
    setContent(existing.content ?? '');
    setDurationText(existing.duration_mins != null && existing.duration_mins > 0 ? String(existing.duration_mins) : '');
    setVideoText(existing.video_url ?? '');
  }, [isNew, lessonId, existing?.id, existing?.title, existing?.description, existing?.content, existing?.video_url, existing?.duration_mins]);

  const onSave = async () => {
    if (!user?.id) { Alert.alert('Sign in required', 'Please sign in again.'); return; }
    if (!courseId?.trim()) { Alert.alert('Missing course', 'Go back and open from the course.'); return; }
    const t = title.trim();
    if (!t) { Alert.alert('Title required', 'Please enter a lesson title.'); return; }
    const videoParse = parseLessonVideoUrlInput(videoText);
    if (videoParse.error) { Alert.alert('YouTube link', videoParse.error); return; }
    setIsSaving(true);
    try {
      const durationParsed = parseInt(durationText.trim(), 10);
      const duration_mins = Number.isFinite(durationParsed) && durationParsed > 0 ? durationParsed : null;
      if (isNew) {
        const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order_index ?? 0), 0) + 1 : 0;
        const res = await withTimeout(createLesson({ course_id: courseId, order_index: nextOrder, title: t, description: summary.trim() || null, content: content.trim() || null, video_url: videoParse.value, duration_mins }), SAVE_TIMEOUT_MS, 'Save lesson');
        if (res.error) throw new Error(res.error);
      } else {
        const res = await withTimeout(updateLesson(lessonId, { title: t, description: summary.trim() || undefined, content: content.trim() || undefined, video_url: videoParse.value, duration_mins: duration_mins ?? undefined }), SAVE_TIMEOUT_MS, 'Save lesson');
        if (res.error) throw new Error(res.error);
      }
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
    if (isNew) return;
    Alert.alert('Delete lesson', 'This removes the lesson and related quizzes. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => void (async () => {
          setIsDeleting(true);
          try {
            const res = await deleteLesson(lessonId);
            if (res.error) throw new Error(res.error);
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
        })(),
      },
    ]);
  };

  const onCreateQuiz = async () => {
    if (isNew || !lessonId) { Alert.alert('Save lesson first', 'Create the lesson first, then add a quiz.'); return; }
    if (existingQuiz) { Alert.alert('Quiz exists', 'This lesson already has a quiz.'); return; }
    const titleTrimmed = quizTitle.trim();
    const questionTrimmed = quizQuestion.trim();
    if (!titleTrimmed || !questionTrimmed) { Alert.alert('Missing fields', 'Please add a quiz title and at least one question.'); return; }
    const passScore = Number.parseInt(quizPassScore.trim(), 10);
    if (!Number.isFinite(passScore) || passScore < 0 || passScore > 100) { Alert.alert('Invalid pass score', 'Must be between 0 and 100.'); return; }
    const optionMap = [{ key: 'A' as const, text: optionA.trim() }, { key: 'B' as const, text: optionB.trim() }, { key: 'C' as const, text: optionC.trim() }, { key: 'D' as const, text: optionD.trim() }];
    const options = optionMap.filter((o) => o.text.length > 0).map((o) => ({ text: o.text, isCorrect: o.key === correctOption }));
    if (options.length < 2) { Alert.alert('More options needed', 'Please provide at least two answer options.'); return; }
    if (!options.some((o) => o.isCorrect)) { Alert.alert('Select correct answer', 'Choose which option is correct.'); return; }
    setIsCreatingQuiz(true);
    try {
      const created = await createLessonQuiz({ lessonId, title: titleTrimmed, passScore, questionText: questionTrimmed, options });
      if (!created) throw new Error('Quiz could not be created.');
      await refetchQuiz();
      Alert.alert('Quiz created', 'Students can now answer this quiz.');
    } catch (error) {
      Alert.alert('Could not create quiz', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  if (!courseId) return null;

  if (!isNew && lessonLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  if (!isNew && !existing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }} edges={['top']}>
        <Text style={{ color: DARK, fontSize: 18, fontFamily: 'serif', marginBottom: 16 }}>Lesson not found</Text>
        <Button label="Go back" onPress={goToCourseEdit} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goToCourseEdit} style={s.backBtn} activeOpacity={0.85}>
          <ChevronLeft size={20} color={DARK} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerLabel}>{isNew ? 'New Lesson' : 'Edit Lesson'}</Text>
          <Text style={s.headerTitle}>Title, content & quiz</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Lesson Details Card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <FileText size={16} color={GOLD} />
            <Text style={s.cardTitle}>Lesson Details</Text>
          </View>

          {/* Title */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>LESSON TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Soil Preparation Basics"
              placeholderTextColor="#C4B89A"
              style={s.input}
            />
          </View>

          {/* Summary */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>SUMMARY (OPTIONAL)</Text>
            <TextInput
              value={summary}
              onChangeText={setSummary}
              placeholder="Short blurb shown in lesson list"
              placeholderTextColor="#C4B89A"
              multiline
              style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
            />
          </View>

          {/* Content */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>CONTENT</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Main reading, instructions, or notes shown to students..."
              placeholderTextColor="#C4B89A"
              multiline
              textAlignVertical="top"
              style={[s.input, { minHeight: 160 }]}
            />
          </View>

          {/* YouTube */}
          <View style={s.fieldGroup}>
            <View style={s.labelRow}>
              <Youtube size={12} color="#C4B89A" />
              <Text style={s.label}>YOUTUBE LINK (OPTIONAL)</Text>
            </View>
            <TextInput
              value={videoText}
              onChangeText={setVideoText}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              placeholderTextColor="#C4B89A"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={s.input}
            />
          </View>

          {/* Duration */}
          <View style={s.fieldGroup}>
            <View style={s.labelRow}>
              <Clock size={12} color="#C4B89A" />
              <Text style={s.label}>DURATION IN MINUTES (OPTIONAL)</Text>
            </View>
            <TextInput
              value={durationText}
              onChangeText={setDurationText}
              placeholder="e.g. 20"
              placeholderTextColor="#C4B89A"
              keyboardType="number-pad"
              style={[s.input, { width: 120 }]}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={() => void onSave()}
          disabled={isSaving}
          style={[s.saveBtn, isSaving && { opacity: 0.7 }]}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>
            {isSaving ? 'Saving...' : isNew ? 'Create Lesson' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {/* Delete Button */}
        {!isNew && (
          <TouchableOpacity
            onPress={onDelete}
            disabled={isDeleting}
            style={s.deleteBtn}
            activeOpacity={0.85}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={s.deleteBtnText}>
              {isDeleting ? 'Removing...' : 'Delete Lesson'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Quiz Section */}
        <View style={[s.card, { marginTop: 16 }]}>
          <View style={s.cardHeader}>
            <Sparkles size={16} color={GOLD} />
            <Text style={s.cardTitle}>Lesson Quiz</Text>
          </View>
          <Text style={s.quizSubtitle}>
            Add a multiple-choice quiz so students can test their knowledge after this lesson.
          </Text>

          {isNew ? (
            <View style={s.quizInfoBox}>
              <BookOpen size={16} color="#C4B89A" />
              <Text style={s.quizInfoText}>Save this lesson first, then create its quiz.</Text>
            </View>
          ) : existingQuiz ? (
            <View style={s.existingQuizBox}>
              <View style={s.existingQuizBadge}>
                <Sparkles size={12} color={GOLD} />
                <Text style={s.existingQuizBadgeText}>Quiz Active</Text>
              </View>
              <Text style={s.existingQuizTitle}>{existingQuiz.title}</Text>
              <Text style={s.existingQuizMeta}>
                Pass score: {existingQuiz.pass_score}% · {existingQuiz.questions.length} questions
              </Text>
            </View>
          ) : (
            <View>
              {/* Quiz Title */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>QUIZ TITLE</Text>
                <TextInput value={quizTitle} onChangeText={setQuizTitle} placeholder="e.g. Soil Preparation Quiz" placeholderTextColor="#C4B89A" style={s.input} />
              </View>

              {/* Question */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>QUESTION</Text>
                <TextInput value={quizQuestion} onChangeText={setQuizQuestion} placeholder="Enter your question here" placeholderTextColor="#C4B89A" style={s.input} />
              </View>

              {/* Pass Score */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>PASS SCORE (%)</Text>
                <TextInput value={quizPassScore} onChangeText={setQuizPassScore} placeholder="60" placeholderTextColor="#C4B89A" keyboardType="number-pad" style={[s.input, { width: 100 }]} />
              </View>

              {/* Options */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>ANSWER OPTIONS</Text>
                {[
                  { key: 'A' as const, value: optionA, setter: setOptionA },
                  { key: 'B' as const, value: optionB, setter: setOptionB },
                  { key: 'C' as const, value: optionC, setter: setOptionC, optional: true },
                  { key: 'D' as const, value: optionD, setter: setOptionD, optional: true },
                ].map(({ key, value, setter, optional }) => (
                  <View key={key} style={s.optionRow}>
                    <TouchableOpacity
                      onPress={() => setCorrectOption(key)}
                      style={[s.optionKey, correctOption === key && s.optionKeyActive]}
                      activeOpacity={0.85}
                    >
                      <Text style={[s.optionKeyText, correctOption === key && s.optionKeyTextActive]}>{key}</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={value}
                      onChangeText={setter}
                      placeholder={`Option ${key}${optional ? ' (optional)' : ''}`}
                      placeholderTextColor="#C4B89A"
                      style={[s.input, { flex: 1, marginBottom: 0 }]}
                    />
                  </View>
                ))}
                <Text style={s.correctHint}>Tap the letter to mark the correct answer</Text>
              </View>

              {/* Create Quiz Button */}
              <TouchableOpacity
                onPress={() => void onCreateQuiz()}
                disabled={isCreatingQuiz}
                style={[s.quizBtn, isCreatingQuiz && { opacity: 0.7 }]}
                activeOpacity={0.85}
              >
                <Text style={s.quizBtnText}>
                  {isCreatingQuiz ? 'Creating quiz...' : 'Create Quiz'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8DFD0' },
  headerLabel: { color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  headerTitle: { color: DARK, fontSize: 22, fontWeight: '300', fontFamily: 'serif' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E8DFD0', marginBottom: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0EAE0' },
  cardTitle: { color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' },
  fieldGroup: { marginBottom: 16 },
  label: { color: '#8B7355', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  input: { backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: DARK, marginBottom: 0 },
  saveBtn: { backgroundColor: EMERALD, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 10, borderWidth: 1, borderColor: `${GOLD}40` },
  saveBtnText: { color: GOLD, fontWeight: '700', fontSize: 15 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#fecdd3', backgroundColor: '#fff1f2', marginBottom: 4 },
  deleteBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  quizSubtitle: { color: '#8B7355', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  quizInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CREAM, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E8DFD0' },
  quizInfoText: { color: '#8B7355', fontSize: 13, flex: 1 },
  existingQuizBox: { backgroundColor: `${EMERALD}08`, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${EMERALD}20` },
  existingQuizBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${GOLD}20`, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${GOLD}40`, marginBottom: 8 },
  existingQuizBadgeText: { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  existingQuizTitle: { color: DARK, fontWeight: '600', fontSize: 15, marginBottom: 4 },
  existingQuizMeta: { color: '#8B7355', fontSize: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  optionKey: { width: 36, height: 36, borderRadius: 18, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8DFD0' },
  optionKeyActive: { backgroundColor: EMERALD, borderColor: EMERALD },
  optionKeyText: { color: '#8B7355', fontWeight: '700', fontSize: 13 },
  optionKeyTextActive: { color: GOLD },
  correctHint: { color: '#C4B89A', fontSize: 11, marginTop: 4, marginBottom: 8 },
  quizBtn: { backgroundColor: EMERALD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: `${GOLD}40` },
  quizBtnText: { color: GOLD, fontWeight: '700', fontSize: 14 },
});
