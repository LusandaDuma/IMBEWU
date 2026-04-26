/**
 * @fileoverview Student course discovery — search, catalogue enrol, join class.
 */

import { Button, CourseCard, EmptyState, SearchBar, ScreenHeader } from '@/components/shared';
import { addStudentToClass, enrollInCourse, getClassByJoinCode, getCourses } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Sprout, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['available-courses'],
    queryFn: getCourses,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) =>
      user ? enrollInCourse(user.id, courseId, 'independent') : Promise.resolve(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
      Alert.alert('Enrolled', 'You are now enrolled in this course.');
    },
    onError: () => {
      Alert.alert('Could not enrol', 'Please try again in a moment.');
    },
  });

  const joinClassMutation = useMutation({
    mutationFn: async (rawCode: string) => {
      if (!user) return { ok: false as const, reason: 'not-authenticated' };

      const classData = await getClassByJoinCode(rawCode.trim().toUpperCase());
      if (!classData) return { ok: false as const, reason: 'invalid-code' };

      const joined = await addStudentToClass(classData.id, user.id);
      if (!joined) return { ok: false as const, reason: 'join-failed' };

      return { ok: true as const };
    },
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.reason === 'invalid-code') {
          Alert.alert('Code not found', 'Double-check the join code with your coordinator.');
          return;
        }

        Alert.alert('Could not join class', 'Please try again in a moment.');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
      Alert.alert('Welcome', 'You have joined the class.');
      setJoinCode('');
      setShowJoinInput(false);
    },
    onError: () => {
      Alert.alert('Could not join class', 'Please try again in a moment.');
    },
  });

  const handleJoinClass = async () => {
    if (!joinCode.trim() || !user) return;
    joinClassMutation.mutate(joinCode);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader
          title="Discover"
          subtitle="Search the catalogue or join a class with a code."
          variant="light"
        />

        <View className="px-5 mb-4">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by course title or topic…"
            icon={Search}
            variant="light"
          />
        </View>

        <View className="px-5 mb-4">
          {!showJoinInput ? (
            <TouchableOpacity
              onPress={() => setShowJoinInput(true)}
              activeOpacity={0.92}
              className="flex-row items-center py-4 border-b border-earth-400/35"
            >
              <View className="w-12 h-12 items-center justify-center">
                <Users size={22} color="#d97706" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-medium text-earth-900 text-base tracking-tight">Join a class</Text>
                <Text className="text-earth-600 text-sm mt-0.5">Use the six-character code from your coordinator</Text>
              </View>
              <Plus size={22} color="#b45309" />
            </TouchableOpacity>
          ) : (
            <View className="pb-4 border-b border-earth-400/35">
              <Text className="font-medium text-earth-900 mb-3 tracking-tight">Enter join code</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border-b border-earth-400/50 py-2 text-earth-900 uppercase tracking-widest font-medium"
                  placeholder="CODE"
                  placeholderTextColor="#a8a29e"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  maxLength={10}
                />
                <Button
                  label={joinClassMutation.isPending ? 'Joining…' : 'Join'}
                  onPress={handleJoinClass}
                  variant="accent"
                  size="md"
                  isLoading={joinClassMutation.isPending}
                  disabled={joinClassMutation.isPending}
                />
              </View>
              <TouchableOpacity onPress={() => setShowJoinInput(false)} className="mt-3 py-2">
                <Text className="text-earth-800 text-center text-sm font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#22c55e" />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Sprout}
              title="No courses match"
              description="Try another search term or pull to refresh the catalogue."
              variant="light"
            />
          }
          renderItem={({ item }) => (
            <CourseCard
              title={item.title}
              description={item.description}
              variant="elevated"
              footer={
                <Button
                  label={enrollMutation.isPending ? 'Enrolling…' : 'Enrol in course'}
                  onPress={() => enrollMutation.mutate(item.id)}
                  isLoading={enrollMutation.isPending}
                  disabled={enrollMutation.isPending}
                  variant="primary"
                  fullWidth
                />
              }
            />
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
