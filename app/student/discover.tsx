/**
 * @fileoverview Student course discovery — search, catalogue enrol, join class.
 */

import { Button, CourseCard, EmptyState, SearchBar, ScreenHeader } from '@/components/shared';
import { enrollInCourse, getClassByJoinCode, getCourses } from '@/services/supabase';
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

  const handleJoinClass = async () => {
    if (!joinCode.trim() || !user) return;

    const classData = await getClassByJoinCode(joinCode.trim().toUpperCase());
    if (classData) {
      const result = await enrollInCourse(user.id, classData.course_id, 'class_based');
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
        Alert.alert('Welcome', 'You have joined the class.');
        setJoinCode('');
        setShowJoinInput(false);
      }
    } else {
      Alert.alert('Code not found', 'Double-check the join code with your coordinator.');
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader
          title="Discover"
          subtitle="Search the catalogue or join a class with a code."
          variant="dark"
        />

        <View className="px-5 mb-4">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by course title or topic…"
            icon={Search}
            variant="dark"
          />
        </View>

        <View className="px-5 mb-4">
          {!showJoinInput ? (
            <TouchableOpacity
              onPress={() => setShowJoinInput(true)}
              activeOpacity={0.92}
              className="flex-row items-center rounded-3xl p-4 bg-accent-500/12"
            >
              <View className="w-12 h-12 rounded-2xl bg-accent-600/95 items-center justify-center">
                <Users size={22} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-medium text-white text-base tracking-tight">Join a class</Text>
                <Text className="text-slate-400 text-sm mt-0.5">Use the six-character code from your coordinator</Text>
              </View>
              <Plus size={22} color="#fbbf24" />
            </TouchableOpacity>
          ) : (
            <View className="rounded-3xl p-5 bg-white/8">
              <Text className="font-medium text-white mb-3 tracking-tight">Enter join code</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-white/6 rounded-full px-5 py-3.5 text-white uppercase tracking-widest font-medium"
                  placeholder="CODE"
                  placeholderTextColor="#64748b"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  maxLength={10}
                />
                <Button label="Join" onPress={handleJoinClass} variant="accent" size="md" />
              </View>
              <TouchableOpacity onPress={() => setShowJoinInput(false)} className="mt-3 py-2">
                <Text className="text-slate-400 text-center text-sm font-medium">Cancel</Text>
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
              variant="dark"
            />
          }
          renderItem={({ item }) => (
            <CourseCard
              title={item.title}
              description={item.description}
              placeholderIcon={Sprout}
              variant="dark"
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
