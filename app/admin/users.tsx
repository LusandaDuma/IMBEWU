/**
 * @fileoverview Admin users — luxury emerald & gold theme
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getAdminUsers, updateAdminUserRole } from '@/services/adminService';
import type { UserRole } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { GraduationCap, Plus, Search, Shield, User, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';
const DARK = '#022418';

const roleIcons = { admin: Shield, coordinator: Users, student: GraduationCap, independent: User };
const roleColors = { admin: GOLD, coordinator: '#60a5fa', student: '#34d399', independent: '#f472b6' };
const roleLabels = { admin: 'Admin', coordinator: 'Coordinator', student: 'Student', independent: 'Independent' };

type FilterKey = 'all' | 'admin' | 'coordinator' | 'student' | 'independent' | 'active' | 'inactive';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'coordinator', label: 'Coordinators' },
  { key: 'student', label: 'Students' },
  { key: 'independent', label: 'Growers' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim() || 'Unnamed user';
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
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

  useRefetchOnFocus(refetch, true);

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

  const handleUserPress = (user: (typeof filteredUsers)[number]) => {
    if (updateRoleMutation.isPending) return;
    Alert.alert(
      `Edit role: ${formatFullName(user.firstName, user.lastName)}`,
      'Select a new role for this user.',
      [
        { text: 'Admin', onPress: () => { if (user.role !== 'admin') updateRoleMutation.mutate({ userId: user.id, role: 'admin' }); } },
        { text: 'Coordinator', onPress: () => { if (user.role !== 'coordinator') updateRoleMutation.mutate({ userId: user.id, role: 'coordinator' }); } },
        { text: 'Student', onPress: () => { if (user.role !== 'student') updateRoleMutation.mutate({ userId: user.id, role: 'student' }); } },
        { text: 'Independent', onPress: () => { if (user.role !== 'independent') updateRoleMutation.mutate({ userId: user.id, role: 'independent' }); } },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const name = formatFullName(user.firstName, user.lastName).toLowerCase();
      const matchesSearch = query.length === 0 || `${name} ${user.role} ${user.id}`.includes(query);
      let matchesFilter = true;
      if (activeFilter === 'active') matchesFilter = user.isActive;
      else if (activeFilter === 'inactive') matchesFilter = !user.isActive;
      else if (activeFilter !== 'all') matchesFilter = user.role === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, searchQuery, users]);

  const renderUser = ({ item }: { item: (typeof filteredUsers)[number] }) => {
    const Icon = roleIcons[item.role as keyof typeof roleIcons] ?? User;
    const color = roleColors[item.role as keyof typeof roleColors] ?? GOLD;
    const label = roleLabels[item.role as keyof typeof roleLabels] ?? item.role;

    return (
      <TouchableOpacity
        onPress={() => handleUserPress(item)}
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          marginBottom: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#E8DFD0',
        }}
        activeOpacity={0.85}
      >
        {/* Avatar */}
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: EMERALD,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: `${GOLD}60`,
        }}>
          <Text style={{ color: GOLD, fontWeight: '700', fontSize: 14 }}>
            {getInitials(item.firstName, item.lastName)}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: DARK, fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
            {formatFullName(item.firstName, item.lastName)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              backgroundColor: `${color}20`,
              borderWidth: 1,
              borderColor: `${color}40`,
            }}>
              <Text style={{ color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              backgroundColor: item.isActive ? '#dcfce7' : '#f1f5f9',
            }}>
              <Text style={{ color: item.isActive ? '#16a34a' : '#94a3b8', fontSize: 10, fontWeight: '600' }}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <Icon size={18} color="#D1C4A8" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
          Growers & Roles
        </Text>
        <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
          User Directory
        </Text>
      </View>

      {/* Search */}
      <View style={{
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#E8DFD0',
      }}>
        <Search size={18} color="#8B7355" />
        <TextInput
          style={{ flex: 1, marginLeft: 10, paddingVertical: 12, color: DARK, fontSize: 14 }}
          placeholder="Search users..."
          placeholderTextColor="#C4B89A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: activeFilter === f.key ? EMERALD : 'white',
              borderWidth: 1,
              borderColor: activeFilter === f.key ? EMERALD : '#E8DFD0',
            }}
            activeOpacity={0.85}
          >
            <Text style={{
              color: activeFilter === f.key ? GOLD : DARK,
              fontSize: 12,
              fontWeight: '600',
            }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <User size={48} color="#C9A84C" />
            <Text style={{ color: '#8B7355', marginTop: 16, fontSize: 15 }}>
              {isError ? 'Could not load users.' : 'No users found'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/admin/users-new')}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: EMERALD,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: GOLD,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Plus size={24} color={GOLD} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
