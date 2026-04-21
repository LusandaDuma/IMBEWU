/**
 * @fileoverview Explore courses for independent learners
 */

import { enrollInCourse, getCourses } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Filter, Search, Sprout, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categories = ['All', 'Farming', 'Livestock', 'Technology', 'Business'];

export default function ExploreScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['explore-courses'],
    queryFn: getCourses,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => 
      user ? enrollInCourse(user.id, courseId, 'independent') : Promise.resolve(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['independent-enrolments'] });
      Alert.alert('Success', 'You have been enrolled in the course!');
    },
  });

  const filteredCourses = courses.filter(course =>
    (course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/independent/course/[id]', params: { id: item.id } }) }
      className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg mb-4 border border-slate-700"
      style={{ elevation: 2 }}
    >
      <View className="h-32 bg-primary-600 items-center justify-center">
        <Sprout size={48} color="white" />
      </View>
      <View className="p-4">
        <Text className="text-lg font-bold text-earth-800" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-earth-500 text-sm mt-1" numberOfLines={2}>
          {item.description}
        </Text>
        <View className="flex-row items-center mt-3">
          <View className="flex-row items-center">
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-earth-600 text-sm ml-1">4.8</Text>
          </View>
          <View className="flex-1" />
          <TouchableOpacity
            onPress={() => enrollMutation.mutate(item.id)}
            disabled={enrollMutation.isPending}
            className="bg-cyan-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">Enroll</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#ecfeff', '#fafaf9']} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-800">Explore</Text>
        <Text className="text-earth-500">Find your next learning adventure</Text>
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
          <TouchableOpacity>
            <Filter size={20} color="#78716c" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 mb-4">
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === item ? 'bg-cyan-600' : 'bg-white'
              }`}
              style={{ elevation: selectedCategory === item ? 2 : 0 }}
            >
              <Text className={selectedCategory === item ? 'text-white' : 'text-earth-600'}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0891b2" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-earth-500">No courses found</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}