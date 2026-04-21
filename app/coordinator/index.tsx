/**
 * @fileoverview Coordinator dashboard - manage classes
 */

import { createClass, getClassesByCoordinator } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Class } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Copy, Plus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

export default function CoordinatorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: classes = [], isLoading, refetch } = useQuery<Class[]>({
    queryKey: ['coordinator-classes', user?.id],
    queryFn: () => user ? getClassesByCoordinator(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const createClassMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-classes'] });
      setShowCreate(false);
      Alert.alert('Success', 'Class created successfully!');
    },
  });

  const handleCopyCode = (code: string) => {
    Alert.alert('Copied!', `Join code "${code}" copied to clipboard`);
  };

  const renderClassCard = ({ item }: { item: Class }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/coordinator/class/[id]', params: { id: item.id } })}
      className="bg-slate-800 rounded-2xl p-4 shadow-lg mb-4 border border-slate-700"
      style={{ elevation: 2 }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">{item.name}</Text>
          <Text className="text-primary-400 text-sm mt-1">Course ID: {item.course_id}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleCopyCode(item.join_code)}
          className="bg-accent-100 px-3 py-2 rounded-lg flex-row items-center"
        >
          <Text className="text-accent-700 font-semibold mr-2">{item.join_code}</Text>
          <Copy size={14} color="#d97706" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center mt-4 pt-4 border-t border-earth-100">
        <View className="flex-row items-center">
          <Calendar size={16} color="#78716c" />
          <Text className="text-earth-500 text-sm ml-2">
            {new Date(item.start_date).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row items-center ml-6">
          <Users size={16} color="#78716c" />
          <Text className="text-earth-500 text-sm ml-2">Students</Text>
        </View>
        <View className="flex-1" />
        <ChevronRight size={20} color="#16a34a" />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#f0fdf4', '#fafaf9']} className="flex-1">
      <View className="pt-14 px-5 pb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-earth-800">My Classes</Text>
          <Text className="text-earth-500">Manage your student groups</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          className="w-12 h-12 rounded-full bg-primary-600 items-center justify-center shadow-md"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        renderItem={renderClassCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16a34a" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <View className="w-20 h-20 rounded-full bg-earth-100 items-center justify-center mb-4">
              <Users size={36} color="#a8a29e" />
            </View>
            <Text className="text-earth-700 font-medium mb-2">No classes yet</Text>
            <Text className="text-earth-500 text-center px-8">
              Create your first class to start managing students
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreate(true)}
              className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Create Class</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </LinearGradient>
  );
}
