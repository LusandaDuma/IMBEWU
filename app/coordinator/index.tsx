/**
 * @fileoverview Coordinator LMS — classes, join codes, roster entry.
 */

import { Button, EmptyState, ScreenHeader } from '@/components/shared';
import { createClass, getClassesByCoordinator, getCourses } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Class, Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Copy, Plus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CoordinatorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [className, setClassName] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: classes = [], isLoading, refetch } = useQuery<Class[]>({
    queryKey: ['coordinator-classes', user?.id],
    queryFn: () => (user ? getClassesByCoordinator(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
  const { data: courses = [], refetch: refetchCatalog } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: getCourses,
  });

  useRefetchOnFocus(
    () => {
      void refetch();
      void refetchCatalog();
    },
    !!user
  );

  const createClassMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedCourseId) {
        throw new Error('Missing class details');
      }
      return createClass({
        created_by: user.id,
        course_id: selectedCourseId,
        name: className.trim(),
      });
    },
    onSuccess: (createdClass) => {
      if (!createdClass) {
        Alert.alert('Could not create class', 'Please try again.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['coordinator-classes', user?.id] });
      setClassName('');
      setSelectedCourseId(null);
      setShowCreate(false);
      Alert.alert('Class created', `Join code: ${createdClass.join_code}`);
    },
    onError: () => {
      Alert.alert('Could not create class', 'Please check your details and try again.');
    },
  });

  const handleCopyCode = (code: string) => {
    Alert.alert('Join code', code);
  };

  const openCreateModal = () => {
    setShowCreate(true);
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  };

  const handleCreateClass = () => {
    if (!className.trim()) {
      Alert.alert('Class name required', 'Enter a class name before creating.');
      return;
    }
    if (!selectedCourseId) {
      Alert.alert('Course required', 'Select a course for this class.');
      return;
    }
    createClassMutation.mutate();
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader
          title="My classes"
          subtitle="Create cohorts, share join codes, and monitor learner progress."
          variant="light"
          rightSlot={
            <TouchableOpacity
              onPress={openCreateModal}
              className="w-12 h-12 rounded-full bg-primary-600/95 items-center justify-center"
              style={{ elevation: 3 }}
            >
              <Plus size={24} color="white" />
            </TouchableOpacity>
          }
        />

        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title="No classes yet"
              description="Create a class to link learners to a published course and track their journey."
              actionLabel="Create class"
              onAction={openCreateModal}
              variant="light"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/coordinator/class/${item.id}`)}
              activeOpacity={0.9}
              className="bg-white/75 rounded-3xl p-5 mb-4"
              style={{ elevation: 1 }}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 min-w-0 pr-2">
                  <Text className="text-lg font-light text-earth-900 tracking-tight" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="text-primary-700 text-xs font-semibold mt-1 uppercase tracking-wide">
                    Course · {item.course_id.slice(0, 8)}…
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCopyCode(item.join_code)}
                  className="bg-accent-500/12 px-3 py-2 rounded-full flex-row items-center"
                >
                  <Text className="text-accent-800 font-bold mr-2">{item.join_code}</Text>
                  <Copy size={14} color="#b45309" />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center mt-5 pt-1">
                <Calendar size={16} color="#78716c" />
                <Text className="text-earth-500 text-sm ml-2 font-medium">
                  Created {new Date(item.start_date ?? item.created_at).toLocaleDateString()}
                </Text>
                <View className="flex-1" />
                <View className="flex-row items-center">
                  <Users size={16} color="#78716c" />
                  <Text className="text-earth-500 text-sm ml-1.5 font-medium">Roster</Text>
                </View>
                <ChevronRight size={20} color="#16a34a" style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>

      {showCreate ? (
        <View className="absolute inset-0 bg-black/40 justify-end">
          <View className="bg-white/95 rounded-t-[28px] p-7">
            <Text className="text-lg font-bold text-earth-900 mb-1">Create class</Text>
            <Text className="text-earth-500 text-sm mb-4">Name your class and choose a course.</Text>

            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">
              Class name
            </Text>
            <TextInput
              value={className}
              onChangeText={setClassName}
              placeholder="e.g. Grade 11 Agriculture"
              placeholderTextColor="#a8a29e"
              className="border border-stone-300 rounded-xl px-4 py-3 text-earth-900 mb-4"
            />

            <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">
              Course
            </Text>
            <View className="mb-5">
              {courses.map((course) => {
                const isSelected = selectedCourseId === course.id;
                return (
                  <TouchableOpacity
                    key={course.id}
                    onPress={() => setSelectedCourseId(course.id)}
                    className={`rounded-xl px-4 py-3 mb-2 border ${isSelected ? 'border-primary-600 bg-primary-50' : 'border-stone-300 bg-white'}`}
                  >
                    <Text className={`font-semibold ${isSelected ? 'text-primary-800' : 'text-earth-800'}`}>
                      {course.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {courses.length === 0 ? (
                <Text className="text-earth-500 text-sm">No published courses available yet.</Text>
              ) : null}
            </View>

            <Button
              label={createClassMutation.isPending ? 'Creating...' : 'Create class'}
              onPress={handleCreateClass}
              disabled={createClassMutation.isPending || courses.length === 0}
              fullWidth
            />
            <View className="h-3" />
            <Button label="Close" variant="outline" onPress={() => setShowCreate(false)} fullWidth />
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}
