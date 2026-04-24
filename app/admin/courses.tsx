/**
 * @fileoverview Admin courses management
 */

import { deleteCourse, getAllCourses, updateCourse } from '@/services/supabase';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Edit2, Eye, EyeOff, Plus, Sprout, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CourseFilter = 'all' | 'published' | 'unpublished';

export default function AdminCoursesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<CourseFilter>('all');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: courses = [], isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: getAllCourses,
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      updateCourse(id, { is_published: !isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const editCourseMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description: string }) =>
      updateCourse(id, { title, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setEditingCourse(null);
      Alert.alert('Success', 'Course updated successfully.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update course. Please try again.');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: (ok) => {
      if (!ok) {
        Alert.alert('Error', 'Failed to delete course. Please try again.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      Alert.alert('Deleted', 'Course removed successfully.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete course. Please try again.');
    },
  });

  const filteredCourses = useMemo(() => {
    if (activeFilter === 'published') return courses.filter((course) => course.is_published);
    if (activeFilter === 'unpublished') return courses.filter((course) => !course.is_published);
    return courses;
  }, [activeFilter, courses]);

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title ?? '');
    setEditDescription(course.description ?? '');
  };

  const handleUpdateCourse = () => {
    if (!editingCourse) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Missing fields', 'Please add both title and description.');
      return;
    }
    editCourseMutation.mutate({
      id: editingCourse.id,
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
  };

  const confirmDeleteCourse = (course: Course) => {
    Alert.alert(
      'Delete course',
      `Are you sure you want to delete "${course.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCourseMutation.mutate(course.id) },
      ]
    );
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <View className="bg-white rounded-2xl p-4 shadow-md mb-4">
      <View className="flex-row items-start">
        <View className="w-16 h-16 rounded-xl bg-violet-100 items-center justify-center">
          <Sprout size={28} color="#7c3aed" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold text-earth-800" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-earth-500 text-sm mt-1" numberOfLines={2}>
            {item.description}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className={`px-2 py-1 rounded-full ${item.is_published ? 'bg-green-100' : 'bg-earth-100'}`}>
              <Text className={`text-xs ${item.is_published ? 'text-green-700' : 'text-earth-600'}`}>
                {item.is_published ? 'Published' : 'Draft'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row justify-end mt-4 pt-4 border-t border-earth-100">
        <TouchableOpacity
          onPress={() => togglePublishMutation.mutate({ id: item.id, isPublished: item.is_published })}
          className="flex-row items-center mr-3"
          activeOpacity={0.85}
        >
          {item.is_published ? (
            <EyeOff size={15} color="#78716c" />
          ) : (
            <Eye size={15} color="#16a34a" />
          )}
          <Text className="text-earth-600 text-xs ml-1">
            {item.is_published ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEditModal(item)} className="flex-row items-center mr-3" activeOpacity={0.85}>
          <Edit2 size={15} color="#0891b2" />
          <Text className="text-cyan-600 text-xs ml-1">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDeleteCourse(item)} className="flex-row items-center" activeOpacity={0.85}>
          <Trash2 size={15} color="#dc2626" />
          <Text className="text-red-600 text-xs ml-1">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white">All Courses</Text>
            <Text className="text-slate-400">Manage platform courses</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/courses/new')}
            className="w-12 h-12 rounded-full bg-primary-600/95 items-center justify-center"
            style={{ elevation: 4 }}
            activeOpacity={0.9}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-5 mb-4">
          <View className="flex-row">
            {[
              { key: 'all', label: 'All' },
              { key: 'published', label: 'Published' },
              { key: 'unpublished', label: 'Unpublished' },
            ].map((filter) => {
              const active = activeFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key as CourseFilter)}
                  className={`mr-2 px-3 py-1.5 rounded-full border ${active ? 'bg-primary-600 border-primary-500' : 'bg-white/10 border-white/20'}`}
                  activeOpacity={0.9}
                >
                  <Text className={`text-xs ${active ? 'text-white font-semibold' : 'text-slate-200'}`}>{filter.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourseCard}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#a78bfa" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Sprout size={48} color="#94a3b8" />
              <Text className="text-slate-300 mt-4">No courses yet</Text>
            </View>
          }
        />

        <Modal visible={!!editingCourse} transparent animationType="fade" onRequestClose={() => setEditingCourse(null)}>
          <View className="flex-1 bg-black/50 justify-center px-5">
            <View className="bg-white rounded-2xl p-4">
              <Text className="text-lg font-semibold text-earth-800 mb-3">Edit Course</Text>
              <Text className="text-earth-700 text-sm mb-2">Title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                className="bg-white rounded-xl px-4 py-2.5 text-earth-800 border border-earth-200"
                placeholder="Course title"
                placeholderTextColor="#a8a29e"
              />
              <Text className="text-earth-700 text-sm mt-3 mb-2">Description</Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                className="bg-white rounded-xl px-4 py-2.5 text-earth-800 border border-earth-200"
                placeholder="Course description"
                placeholderTextColor="#a8a29e"
                multiline
                textAlignVertical="top"
                style={{ minHeight: 90 }}
              />
              <View className="flex-row justify-end mt-4">
                <TouchableOpacity onPress={() => setEditingCourse(null)} className="px-3 py-2 rounded-lg bg-earth-100 mr-2">
                  <Text className="text-earth-700 text-xs">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateCourse} className="px-3 py-2 rounded-lg bg-primary-600">
                  <Text className="text-white text-xs">{editCourseMutation.isPending ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
