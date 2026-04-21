/**
 * @fileoverview Course discovery for students
 */

import { enrollInCourse, getClassByJoinCode, getCourses } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Plus, Search, Sprout, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DiscoverScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
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
      Alert.alert('Success', 'You have been enrolled in the course!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to enroll in course. Please try again.');
    },
  });

  const handleJoinClass = async () => {
    if (!joinCode.trim() || !user) return;
    
    const classData = await getClassByJoinCode(joinCode.trim().toUpperCase());
    if (classData) {
      const result = await enrollInCourse(user.id, classData.course_id, 'class_based');
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
        Alert.alert('Success', 'You have joined the class!');
        setJoinCode('');
        setShowJoinInput(false);
      }
    } else {
      Alert.alert('Error', 'Invalid join code. Please check and try again.');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCourseCard = ({ item }: { item: Course }) => (
    <View className="bg-white rounded-2xl p-4 shadow-md mb-4">
      <View className="flex-row items-start">
        <View className="w-16 h-16 rounded-xl bg-primary-100 items-center justify-center">
          <Sprout size={28} color="#16a34a" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold text-earth-800" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-earth-500 text-sm mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => enrollMutation.mutate(item.id)}
        disabled={enrollMutation.isPending}
        className="mt-4 bg-primary-600 py-3 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">
          {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-white">Discover</Text>
        <Text className="text-slate-400 mt-1">Explore new courses</Text>
      </View>

      <View className="px-5 mb-4">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <Search size={20} color="#78716c" />
          <TextInput
            className="flex-1 ml-3 text-earth-800"
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#a8a29e"
          />
        </View>
      </View>

      <View className="px-5 mb-4">
        {!showJoinInput ? (
          <TouchableOpacity
            onPress={() => setShowJoinInput(true)}
            className="flex-row items-center bg-accent-100 rounded-xl p-4"
          >
            <View className="w-10 h-10 rounded-full bg-accent-500 items-center justify-center">
              <Users size={20} color="white" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-earth-800">Join a Class</Text>
              <Text className="text-earth-500 text-sm">Enter a join code from your teacher</Text>
            </View>
            <Plus size={20} color="#d97706" />
          </TouchableOpacity>
        ) : (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="font-semibold text-earth-800 mb-2">Enter Join Code</Text>
            <View className="flex-row">
              <TextInput
                className="flex-1 bg-earth-50 rounded-xl px-4 py-3 text-earth-800 uppercase"
                placeholder="ABC123"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={10}
              />
              <TouchableOpacity
                onPress={handleJoinClass}
                className="ml-2 bg-accent-600 px-4 rounded-xl items-center justify-center"
              >
                <Text className="text-white font-semibold">Join</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowJoinInput(false)}
              className="mt-2"
            >
              <Text className="text-earth-500 text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16a34a" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-earth-500">No courses available</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}