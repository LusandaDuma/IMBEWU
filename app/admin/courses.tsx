/**
 * @fileoverview Admin courses management
 */

import { getAllCourses, updateCourse } from '@/services/supabase';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Edit2, Eye, EyeOff, Plus, Sprout, Trash2 } from 'lucide-react-native';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminCoursesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
          className="flex-row items-center mr-4"
        >
          {item.is_published ? (
            <EyeOff size={18} color="#78716c" />
          ) : (
            <Eye size={18} color="#16a34a" />
          )}
          <Text className="text-earth-600 text-sm ml-1">
            {item.is_published ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center mr-4">
          <Edit2 size={18} color="#0891b2" />
          <Text className="text-cyan-600 text-sm ml-1">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center">
          <Trash2 size={18} color="#dc2626" />
          <Text className="text-red-600 text-sm ml-1">Delete</Text>
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

        <FlatList
          data={courses}
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
      </SafeAreaView>
    </LinearGradient>
  );
}
