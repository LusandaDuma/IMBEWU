/**
 * @fileoverview Independent learner dashboard
 */

import { getEnrolmentsByUser } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Play, Sprout, Target } from 'lucide-react-native';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

export default function IndependentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: enrolments = [], isLoading, refetch } = useQuery({
    queryKey: ['independent-enrolments', user?.id],
    queryFn: () => user ? getEnrolmentsByUser(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const renderContinueCard = () => (
    <TouchableOpacity
      onPress={() => router.push('/independent/learn')}
      className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-5 mb-6"
      style={{ backgroundColor: '#0891b2' }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-cyan-100 text-sm mb-1">Continue Learning</Text>
          <Text className="text-white text-lg font-bold">Introduction to Sustainable Farming</Text>
          <View className="flex-row items-center mt-3">
            <View className="flex-1 h-2 bg-cyan-800 rounded-full overflow-hidden">
              <View className="w-3/5 h-full bg-white rounded-full" />
            </View>
            <Text className="text-white text-sm ml-3">60%</Text>
          </View>
        </View>
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
          <Play size={24} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCourseCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/independent/course/[id]', params: { id: item.course_id } }) }
      className="bg-slate-800 rounded-2xl p-4 shadow-lg mb-4 border border-slate-700"
      style={{ elevation: 2 }}
    >
      <View className="flex-row items-center">
        <View className="w-16 h-16 rounded-xl bg-cyan-100 items-center justify-center">
          <Sprout size={28} color="#0891b2" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold text-earth-800" numberOfLines={1}>
            {item.courses?.title}
          </Text>
          <Text className="text-earth-500 text-sm mt-1" numberOfLines={1}>
            {item.courses?.description}
          </Text>
          <View className="flex-row items-center mt-2">
            <Clock size={14} color="#78716c" />
            <Text className="text-earth-500 text-xs ml-1">
              Enrolled {new Date(item.enrolled_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color="#0891b2" />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#ecfeff', '#fafaf9']} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-800">Hello, {user?.first_name}</Text>
        <Text className="text-earth-500">Ready to learn something new?</Text>
      </View>

      <FlatList
        data={enrolments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderContinueCard}
        renderItem={renderCourseCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0891b2" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Target size={48} color="#0891b2" />
            <Text className="text-earth-700 font-medium mt-4 mb-2">Start Your Journey</Text>
            <Text className="text-earth-500 text-center px-8">
              Explore our courses and begin learning today
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/independent/explore')}
              className="mt-4 bg-cyan-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Browse Courses</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </LinearGradient>
  );
}
