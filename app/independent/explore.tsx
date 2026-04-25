/**
 * @fileoverview Independent course catalogue — search, filters, enrolment.
 */

import { Button, CourseCard, EmptyState, SearchBar, ScreenHeader } from '@/components/shared';
import { enrollInCourse, getCourses } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Filter, Search, Sprout, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      Alert.alert('Enrolled', 'Open the course from your Learn tab to begin.');
    },
    onError: () => Alert.alert('Enrolment failed', 'Try again shortly.'),
  });

  const filteredCourses = courses.filter((course) => {
    const matchesText =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesText) return false;
    if (selectedCategory === 'All') return true;
    return (
      course.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      course.description.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  const listHeader = (
    <View>
      <ScreenHeader
        title="Explore catalogue"
        subtitle="Search published courses and enrol in one tap."
        variant="dark"
      />
      <View className="px-5 mb-3">
        <View className="flex-row items-center">
          <View className="flex-1">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by title, skill, or topic…"
              icon={Search}
              variant="dark"
            />
          </View>
          <TouchableOpacity className="ml-2 w-12 h-12 rounded-full bg-white/10 items-center justify-center">
            <Filter size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="px-5 mb-5">
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.88}
                className={`px-4 py-2.5 rounded-full mr-2 ${
                  selectedCategory === item ? 'bg-cyan-600/95' : 'bg-white/10'
                }`}
              style={{ elevation: selectedCategory === item ? 2 : 0 }}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedCategory === item ? 'text-white' : 'text-slate-200'
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0891b2" />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Sprout}
              title="No courses found"
              description="Try another search or category, or pull to refresh."
              variant="dark"
            />
          }
          renderItem={({ item }) => (
            <View className="px-5">
              <CourseCard
                title={item.title}
                description={item.description}
                placeholderIcon={Sprout}
                variant="solid"
                onPress={() =>
                  router.push({ pathname: '/independent/course/[id]', params: { id: item.id } })
                }
                footer={
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-earth-600 text-sm ml-1 font-medium">4.8</Text>
                    </View>
                    <Button
                      label={enrollMutation.isPending ? '…' : 'Enrol'}
                      onPress={() => enrollMutation.mutate(item.id)}
                      variant="accent"
                      size="sm"
                      isLoading={enrollMutation.isPending}
                      disabled={enrollMutation.isPending}
                    />
                  </View>
                }
              />
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
