import { Button } from '@/components/shared';
import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { getCourseById, updateCourse } from '@/services/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CoordinatorCourseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = useMemo(() => (typeof id === 'string' ? id : ''), [id]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offlineUrl, setOfflineUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['coordinator-course', courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (!course) {
      return;
    }
    setTitle(course.title);
    setDescription(course.description || '');
    setOfflineUrl(course.offline_url || '');
    setIsPublished(course.is_published);
  }, [course?.id, course?.title, course?.description, course?.offline_url, course?.is_published]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      updateCourse(courseId, {
        title: title.trim(),
        description: description.trim() || undefined,
        offline_url: offlineUrl.trim() || undefined,
        is_published: isPublished,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-course', courseId] });
      invalidateAllCourseCatalogQueries(queryClient);
      Alert.alert('Saved', 'Course details updated.');
    },
    onError: () => Alert.alert('Could not save', 'Please try again.'),
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
          <Button label="Back" onPress={() => router.back()} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center">
            <ChevronLeft size={20} color="#14532d" />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text className="text-earth-900 text-xl font-semibold">Edit course</Text>
            <Text className="text-earth-500 text-sm">Update class-linked content settings</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
          <View className="bg-white/90 rounded-2xl p-5">
            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Course title"
              placeholderTextColor="#a8a29e"
              className="border border-stone-300 rounded-xl px-4 py-3 text-earth-900 mb-4"
            />
            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Course description"
              placeholderTextColor="#a8a29e"
              multiline
              className="border border-stone-300 rounded-xl px-4 py-3 text-earth-900 min-h-[96px] mb-4"
            />
            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Offline content URL</Text>
            <TextInput
              value={offlineUrl}
              onChangeText={setOfflineUrl}
              placeholder="https://..."
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
              autoCorrect={false}
              className="border border-stone-300 rounded-xl px-4 py-3 text-earth-900 mb-4"
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
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
