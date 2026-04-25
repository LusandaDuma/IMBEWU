/**
 * @fileoverview Admin users management
 */

import { getAdminUsers, updateAdminUserRole } from '@/services/adminService';
import type { UserRole } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, GraduationCap, Plus, Search, Shield, User, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const roleIcons = {
  admin: Shield,
  coordinator: Users,
  student: GraduationCap,
  independent: User,
};

const roleColors = {
  admin: '#7c3aed',
  coordinator: '#d97706',
  student: '#16a34a',
  independent: '#0891b2',
};

const roleLabels = {
  admin: 'Admin',
  coordinator: 'Coordinator',
  student: 'Student',
  independent: 'Independent',
};

type FilterKey = 'all' | 'admin' | 'coordinator' | 'student' | 'independent' | 'active' | 'inactive';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All users' },
  { key: 'admin', label: 'Admins' },
  { key: 'coordinator', label: 'Coordinators' },
  { key: 'student', label: 'Students' },
  { key: 'independent', label: 'Independent' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

function formatFullName(firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Unnamed user';
}

function shortId(id: string): string {
  return id.length <= 10 ? id : `${id.slice(0, 8)}...`;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      await updateAdminUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
    },
    onError: (error) => {
      Alert.alert('Could not update role', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const handleUserCardPress = (user: (typeof filteredUsers)[number]) => {
    if (updateRoleMutation.isPending) {
      return;
    }

    Alert.alert(
      `Edit role: ${formatFullName(user.firstName, user.lastName)}`,
      'Select a new role for this user.',
      [
        {
          text: 'Admin',
          onPress: () => {
            if (user.role !== 'admin') updateRoleMutation.mutate({ userId: user.id, role: 'admin' });
          },
        },
        {
          text: 'Coordinator',
          onPress: () => {
            if (user.role !== 'coordinator') updateRoleMutation.mutate({ userId: user.id, role: 'coordinator' });
          },
        },
        {
          text: 'Student',
          onPress: () => {
            if (user.role !== 'student') updateRoleMutation.mutate({ userId: user.id, role: 'student' });
          },
        },
        {
          text: 'Independent',
          onPress: () => {
            if (user.role !== 'independent') updateRoleMutation.mutate({ userId: user.id, role: 'independent' });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const name = formatFullName(user.firstName, user.lastName).toLowerCase();
      const searchable = `${name} ${user.role} ${user.id}`.toLowerCase();
      const matchesSearch = query.length === 0 || searchable.includes(query);

      let matchesFilter = true;
      if (activeFilter === 'active') matchesFilter = user.isActive;
      else if (activeFilter === 'inactive') matchesFilter = !user.isActive;
      else if (activeFilter !== 'all') matchesFilter = user.role === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, searchQuery, users]);

  const renderUserCard = ({ item }: { item: (typeof filteredUsers)[number] }) => {
    const Icon = roleIcons[item.role as keyof typeof roleIcons];
    const color = roleColors[item.role as keyof typeof roleColors];
    const label = roleLabels[item.role as keyof typeof roleLabels];

    return (
      <TouchableOpacity
        onPress={() => handleUserCardPress(item)}
        className="bg-white/95 rounded-2xl p-4 shadow-md mb-4"
        activeOpacity={0.9}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={20} color={color} />
          </View>
          <View className="flex-1 ml-4">
            <Text className="font-bold text-earth-800">{formatFullName(item.firstName, item.lastName)}</Text>
            <Text className="text-earth-500 text-sm">ID: {shortId(item.id)}</Text>
          </View>
          <View className="items-end">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${color}15` }}
            >
              <Text style={{ color }} className="text-xs capitalize font-medium">
                {label}
              </Text>
            </View>
            <View className={`mt-2 px-2 py-1 rounded-full ${item.isActive ? 'bg-green-100' : 'bg-earth-100'}`}>
              <Text className={`text-xs ${item.isActive ? 'text-green-700' : 'text-earth-600'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-4 flex-row items-start justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
              activeOpacity={0.9}
            >
              <ChevronLeft size={20} color="white" />
            </TouchableOpacity>
            <View className="ml-3">
              <Text className="text-2xl font-bold text-white">Users</Text>
              <Text className="text-slate-400">Manage platform users</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/users-new')}
            className="mt-1 w-12 h-12 rounded-full bg-primary-600/95 items-center justify-center"
            style={{ elevation: 4 }}
            activeOpacity={0.9}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-5 mb-3">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
            <Search size={20} color="#78716c" />
            <TextInput
              className="flex-1 ml-3 text-earth-800"
              placeholder="Search by name, role, or ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#a8a29e"
            />
          </View>
        </View>

        <View className="pl-5 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {filters.map((filter) => {
              const active = activeFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  className={`mr-2 px-3 py-1.5 rounded-full border ${active ? 'bg-primary-600 border-primary-500' : 'bg-white/10 border-white/20'}`}
                  activeOpacity={0.9}
                >
                  <Text className={`text-xs ${active ? 'text-white font-semibold' : 'text-slate-200'}`}>{filter.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserCard}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <User size={48} color="#d6d3d1" />
              <Text className="text-slate-300 mt-4">
                {isError ? 'Could not load users. Pull to refresh.' : 'No users found'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
