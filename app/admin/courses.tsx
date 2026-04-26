/**
 * @fileoverview Admin courses management
 */

import { COURSE_LOGO_THUMB } from '@/constants/courseBranding';
import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { surfaceListCard } from '@/constants/theme';
import { deleteCourse, getAllCourses, updateCourse } from '@/services/supabase';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Edit2, Eye, EyeOff, Sprout, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CourseFilter = 'all' | 'published' | 'unpublished';

export default function AdminCoursesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<CourseFilter>('all');

  const { data: courses = [], isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: getAllCourses,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      updateCourse(id, { is_published: !isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
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
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
      Alert.alert('Deleted', 'Course removed successfully.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete course. Please try again.');
    },
  });

  const filteredCourses = useMemo(() => {
    if (activeFilter === 'published') {
      return courses.filter((c) => c.is_published);
    }
    if (activeFilter === 'unpublished') {
      return courses.filter((c) => !c.is_published);
    }
    return courses;
  }, [activeFilter, courses]);

  const confirmDeleteCourse = (course: Course) => {
    Alert.alert('Delete course', `Are you sure you want to delete "${course.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCourseMutation.mutate(course.id) },
    ]);
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <View className={`${surfaceListCard} mb-4`}>
      <View className="flex-row items-start">
        <View className="w-16 h-16 rounded-2xl overflow-hidden items-center justify-center bg-primary-500/10">
          <Image source={COURSE_LOGO_THUMB} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
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
          {item.is_published ? <EyeOff size={15} color="#78716c" /> : <Eye size={15} color="#16a34a" />}
          <Text className="text-earth-600 text-xs ml-1">
            {item.is_published ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/admin/courses/[id]', params: { id: item.id } })}
          className="flex-row items-center mr-3"
          activeOpacity={0.85}
        >
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
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-4">
          <Text className="text-2xl font-bold text-black">All Courses</Text>
          <Text className="text-earth-700">Manage platform courses</Text>
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
                  className={`mr-2 px-3 py-1.5 rounded-full ${active ? 'bg-primary-600' : 'bg-earth-200/90'}`}
                  activeOpacity={0.9}
                >
                  <Text className={`text-xs ${active ? 'text-white font-semibold' : 'text-black'}`}>{filter.label}</Text>
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
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#a78bfa" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Sprout size={48} color="#94a3b8" />
              <Text className="text-earth-700 mt-4">No courses yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
