/**
 * @fileoverview Admin edit course — luxury emerald & gold theme
 * Keeps all existing save/update/lesson logic intact
 */

import { Button } from '@/components/shared';
import { asSingleParam } from '@/lib/expoParams';
import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { getCourseById, getLessonsByCourse, updateCourse } from '@/services/supabase';
import type { Lesson } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, ChevronRight, FileText, Globe, Plus, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

export default function AdminCourseEditorScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const courseId = useMemo(() => asSingleParam(id), [id]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offlineUrl, setOfflineUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !!courseId,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['admin-course-lessons', courseId],
    queryFn: () => getLessonsByCourse(courseId),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (!course) return;
    setTitle(course.title);
    setDescription(course.description || '');
    setOfflineUrl(course.offline_url || '');
    setIsPublished(course.is_published);
  }, [course?.id, course?.title, course?.description, course?.offline_url, course?.is_published]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updated = await updateCourse(courseId, {
        title: title.trim(),
        description: description.trim() || undefined,
        offline_url: offlineUrl.trim() || undefined,
        is_published: isPublished,
      });
      if (updated == null) throw new Error('Update failed or no access.');
      return updated;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-course', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
      Alert.alert('Saved', 'Course details updated.');
    },
    onError: (err) => {
      const detail = err instanceof Error ? ` ${err.message}` : '';
      Alert.alert('Could not save', `Please try again.${detail}`);
    },
  });

  const onSave = () => {
    if (!title.trim()) { Alert.alert('Title required', 'Please enter a course title.'); return; }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }} edges={['top']}>
        <Text style={{ color: DARK, fontSize: 18, fontFamily: 'serif', marginBottom: 16 }}>Course not found</Text>
        <Button label="Back" onPress={() => router.replace('/admin/courses')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/admin/courses')} style={s.backBtn} activeOpacity={0.85}>
          <ChevronLeft size={20} color={DARK} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerLabel}>Curriculum</Text>
          <Text style={s.headerTitle}>Edit Course</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Course Details Card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <FileText size={16} color={GOLD} />
            <Text style={s.cardTitle}>Course Details</Text>
          </View>

          {/* Title */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Course title"
              placeholderTextColor="#C4B89A"
              style={s.input}
            />
          </View>

          {/* Description */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Course description"
              placeholderTextColor="#C4B89A"
              multiline
              textAlignVertical="top"
              style={[s.input, { minHeight: 100 }]}
            />
          </View>

          {/* Offline URL */}
          <View style={s.fieldGroup}>
            <View style={s.labelRow}>
              <Globe size={12} color="#C4B89A" />
              <Text style={s.label}>OFFLINE CONTENT URL (OPTIONAL)</Text>
            </View>
            <TextInput
              value={offlineUrl}
              onChangeText={setOfflineUrl}
              placeholder="https://..."
              placeholderTextColor="#C4B89A"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={s.input}
            />
          </View>

          {/* Published Toggle */}
          <View style={s.publishRow}>
            <View>
              <Text style={s.publishLabel}>Published</Text>
              <Text style={s.publishHint}>
                {isPublished ? 'Visible to enrolled students' : 'Hidden from students'}
              </Text>
            </View>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: '#E8DFD0', true: `${GOLD}60` }}
              thumbColor={isPublished ? GOLD : '#C4B89A'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={onSave}
          disabled={saveMutation.isPending}
          style={[s.saveBtn, saveMutation.isPending && { opacity: 0.7 }]}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>
            {saveMutation.isPending ? 'Saving...' : 'Save Course'}
          </Text>
        </TouchableOpacity>

        {/* Lessons Section */}
        <View style={[s.card, { marginTop: 16 }]}>
          <View style={s.lessonsHeader}>
            <View style={s.cardHeader}>
              <BookOpen size={16} color={GOLD} />
              <Text style={s.cardTitle}>Lessons</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/admin/courses/${courseId}/lesson/new`)}
              style={s.addBtn}
              activeOpacity={0.85}
            >
              <Plus size={16} color={GOLD} />
              <Text style={s.addBtnText}>Add lesson</Text>
            </TouchableOpacity>
          </View>

          {lessonsLoading ? (
            <ActivityIndicator size="small" color={GOLD} style={{ paddingVertical: 20 }} />
          ) : lessons.length === 0 ? (
            <View style={s.emptyLessons}>
              <Sparkles size={32} color="#C4B89A" />
              <Text style={s.emptyLessonsText}>No lessons yet</Text>
              <Text style={s.emptyLessonsHint}>Add lessons to build the learning path</Text>
            </View>
          ) : (
            <View>
              {lessons.map((lesson, index) => (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() => router.push(`/admin/courses/${courseId}/lesson/${lesson.id}`)}
                  style={[s.lessonRow, index < lessons.length - 1 && s.lessonRowBorder]}
                  activeOpacity={0.75}
                >
                  <View style={s.lessonNum}>
                    <Text style={s.lessonNumText}>{(lesson.order_index ?? 0) + 1}</Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={s.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
                    {lesson.duration_mins != null && lesson.duration_mins > 0 && (
                      <Text style={s.lessonMeta}>{lesson.duration_mins} min</Text>
                    )}
                  </View>
                  <ChevronRight size={18} color="#C4B89A" />
                </TouchableOpacity>
              ))}
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
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E8DFD0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0EAE0' },
  cardTitle: { color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif', flex: 1 },
  fieldGroup: { marginBottom: 16 },
  label: { color: '#8B7355', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  input: { backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: DARK },
  publishRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  publishLabel: { color: DARK, fontWeight: '600', fontSize: 14, marginBottom: 2 },
  publishHint: { color: '#8B7355', fontSize: 11 },
  saveBtn: { backgroundColor: EMERALD, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 4, borderWidth: 1, borderColor: `${GOLD}40` },
  saveBtnText: { color: GOLD, fontWeight: '700', fontSize: 15 },
  lessonsHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${EMERALD}10`, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: `${EMERALD}20`, marginTop: 4 },
  addBtnText: { color: EMERALD, fontSize: 13, fontWeight: '600' },
  emptyLessons: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyLessonsText: { color: DARK, fontSize: 15, fontWeight: '600' },
  emptyLessonsHint: { color: '#8B7355', fontSize: 13 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  lessonRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0EAE0' },
  lessonNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: EMERALD, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${GOLD}40` },
  lessonNumText: { color: GOLD, fontSize: 12, fontWeight: '700' },
  lessonTitle: { color: DARK, fontWeight: '600', fontSize: 14, marginBottom: 2 },
  lessonMeta: { color: '#8B7355', fontSize: 11 },
});
