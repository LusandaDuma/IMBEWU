import { Button } from '@/components/shared';
import { fieldPlain } from '@/constants/theme';
import { asSingleParam } from '@/lib/expoParams';
import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { getCourseById, getLessonsByCourse, updateCourse } from '@/services/supabase';
import type { Lesson } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a course title.');
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-earth-600">Loading course…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!course) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Text className="text-earth-800 text-lg font-semibold mb-2">Course not found</Text>
          <Button label="Back" onPress={() => router.replace('/admin/courses')} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 py-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.replace('/admin/courses')}
            className="w-10 h-10 rounded-full bg-earth-900/5 items-center justify-center"
          >
            <ChevronLeft size={22} color="#1c1917" strokeWidth={1.5} />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text className="text-black text-xl font-semibold">Edit course</Text>
            <Text className="text-earth-800 text-sm">Admin content and lesson management</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          <View className="mb-2 pb-4 border-b border-earth-400/40">
            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Course title"
              placeholderTextColor="#a8a29e"
              className={`${fieldPlain} mb-4`}
            />
            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Course description"
              placeholderTextColor="#a8a29e"
              multiline
              className={`${fieldPlain} min-h-[96px] mb-4`}
            />
            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Offline content URL</Text>
            <TextInput
              value={offlineUrl}
              onChangeText={setOfflineUrl}
              placeholder="https://..."
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
              autoCorrect={false}
              className={`${fieldPlain} mb-4`}
            />
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-earth-700">Published</Text>
              <Switch value={isPublished} onValueChange={setIsPublished} />
            </View>
            <Button
              label={saveMutation.isPending ? 'Saving...' : 'Save course'}
              onPress={onSave}
              disabled={saveMutation.isPending}
              fullWidth
            />
          </View>

          <View className="pt-2">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <BookOpen size={18} color="#166534" />
                <Text className="text-earth-900 font-semibold ml-2">Lessons</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/admin/courses/${courseId}/lesson/new`)}
                className="flex-row items-center bg-primary-600/15 px-3 py-2 rounded-full"
                activeOpacity={0.8}
              >
                <Plus size={18} color="#166534" />
                <Text className="text-primary-800 font-medium text-sm ml-1">Add lesson</Text>
              </TouchableOpacity>
            </View>
            {lessonsLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#16a34a" />
              </View>
            ) : lessons.length === 0 ? (
              <Text className="text-earth-500 text-sm py-2">No lessons yet. Add a lesson to build the learning path.</Text>
            ) : (
              <View>
                {lessons.map((lesson) => (
                  <TouchableOpacity
                    key={lesson.id}
                    onPress={() => router.push(`/admin/courses/${courseId}/lesson/${lesson.id}`)}
                    className="py-3 border-b border-earth-400/30 flex-row items-center"
                    activeOpacity={0.7}
                  >
                    <View className="w-7 h-7 rounded-full bg-earth-200/60 items-center justify-center mr-3">
                      <Text className="text-earth-800 text-xs font-semibold">{(lesson.order_index ?? 0) + 1}</Text>
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="text-earth-900 font-medium" numberOfLines={2}>
                        {lesson.title}
                      </Text>
                      {lesson.duration_mins != null && lesson.duration_mins > 0 ? (
                        <Text className="text-earth-500 text-xs mt-0.5">{lesson.duration_mins} min</Text>
                      ) : null}
                    </View>
                    <ChevronRight size={18} color="#78716c" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
