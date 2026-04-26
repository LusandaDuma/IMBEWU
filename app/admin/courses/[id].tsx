/**
 * @fileoverview Edit an existing course (admin) — same fields as create, full screen.
 */

import { fieldPlain } from '@/constants/theme';
import { asSingleParam } from '@/lib/expoParams';
import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { getCourseById, updateCourse } from '@/services/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADMIN_COURSES_HREF = '/admin/courses' as const;

export default function AdminEditCourseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const courseId = useMemo(() => asSingleParam(id), [id]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const goToCourses = () => {
    router.replace(ADMIN_COURSES_HREF);
  };

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin-course-edit', courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (!course) {
      return;
    }
    setTitle(course.title ?? '');
    setDescription(course.description ?? '');
  }, [course?.id, course?.title, course?.description]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updated = await updateCourse(courseId, {
        title: title.trim(),
        description: description.trim(),
      });
      if (updated == null) {
        throw new Error('Update failed or no access.');
      }
      return updated;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-course-edit', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
      Alert.alert('Success', 'Course updated successfully.', [{ text: 'OK', onPress: goToCourses }]);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Error', `Failed to update course. ${message}`);
    },
  });

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Please add both title and description.');
      return;
    }
    saveMutation.mutate();
  };

  if (!courseId) {
    return null;
  }

  if (isLoading) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!course) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 justify-center px-5" edges={['top']}>
          <Text className="text-earth-800 text-lg font-semibold text-center">Course not found</Text>
          <TouchableOpacity onPress={goToCourses} className="mt-4 rounded-xl bg-primary-600 py-3 items-center" activeOpacity={0.9}>
            <Text className="text-white font-semibold">Back to courses</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-5 flex-row items-center">
          <TouchableOpacity
            onPress={goToCourses}
            className="w-10 h-10 rounded-full bg-earth-900/5 items-center justify-center"
            activeOpacity={0.9}
          >
            <ChevronLeft size={20} color="#1c1917" />
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-2xl font-bold text-black">Edit course</Text>
            <Text className="text-earth-800">Update title and description</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text className="text-earth-700 font-medium mb-2">Course title</Text>
          <TextInput
            className={fieldPlain}
            placeholder="Course title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#a8a29e"
          />

          <Text className="text-earth-700 font-medium mb-2 mt-5">Description</Text>
          <TextInput
            className={fieldPlain}
            placeholder="Course description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
            placeholderTextColor="#a8a29e"
          />
        </ScrollView>

        <View className="px-5 py-5">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saveMutation.isPending}
            className={`rounded-xl py-4 items-center ${saveMutation.isPending ? 'bg-primary-400' : 'bg-primary-600'}`}
            activeOpacity={0.9}
          >
            <View className="flex-row items-center">
              <Save size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                {saveMutation.isPending ? 'Saving...' : 'Save changes'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
