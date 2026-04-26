/**
 * @fileoverview Create new course screen
 */

import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { createCourse } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, List, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateCourseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const createdCourse = await createCourse({
        title: title.trim(),
        description: description.trim(),
        offline_url: null,
        created_by: user.id,
        is_published: false,
      });
      if (!createdCourse) throw new Error('Course could not be created. Check permissions and try again.');
      return createdCourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
      Alert.alert('Success', 'Course created successfully!');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create course. Please try again.');
    },
  });

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    createMutation.mutate();
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-5 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
            activeOpacity={0.9}
          >
            <ChevronLeft size={20} color="white" />
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-2xl font-bold text-white">Create Course</Text>
            <Text className="text-slate-400">Add a new course to the platform</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="bg-white/95 rounded-2xl p-5">
            <Text className="text-earth-700 font-medium mb-2">Course Title</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-earth-800 border border-earth-200"
            placeholder="Enter course title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#a8a29e"
          />

            <Text className="text-earth-700 font-medium mb-2 mt-5">Description</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-earth-800 border border-earth-200"
            placeholder="Enter course description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
            placeholderTextColor="#a8a29e"
          />

            <Text className="text-earth-500 text-sm mt-5">
              After creating the course, you can add lessons and quizzes from the course detail page.
            </Text>
          </View>
        </ScrollView>

        <View className="px-5 py-5">
          <TouchableOpacity
            onPress={handleSave}
            disabled={createMutation.isPending}
            className={`rounded-xl py-4 items-center ${createMutation.isPending ? 'bg-primary-400' : 'bg-primary-600'}`}
            activeOpacity={0.9}
          >
            <View className="flex-row items-center">
              <Save size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                {createMutation.isPending ? 'Creating...' : 'Create Course'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/admin/courses')}
            className="rounded-xl py-4 items-center border border-white/20 bg-white/10 mt-3"
            activeOpacity={0.9}
          >
            <View className="flex-row items-center">
              <List size={20} color="#e2e8f0" />
              <Text className="text-slate-100 font-semibold text-base ml-2">Manage Courses (CRUD)</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
