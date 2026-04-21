/**
 * @fileoverview Admin users management
 */

import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, Search, Shield, User, Users } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

const mockUsers = [
  { id: '1', name: 'John Smith', email: 'john@example.com', role: 'admin', active: true },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'coordinator', active: true },
  { id: '3', name: 'Mike Brown', email: 'mike@example.com', role: 'student', active: true },
  { id: '4', name: 'Emily Davis', email: 'emily@example.com', role: 'independent', active: false },
];

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

export default function AdminUsersScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserCard = ({ item }: { item: typeof mockUsers[0] }) => {
    const Icon = roleIcons[item.role as keyof typeof roleIcons];
    const color = roleColors[item.role as keyof typeof roleColors];

    return (
      <View className="bg-white rounded-2xl p-4 shadow-md mb-4">
        <View className="flex-row items-center">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={20} color={color} />
          </View>
          <View className="flex-1 ml-4">
            <Text className="font-bold text-earth-800">{item.name}</Text>
            <Text className="text-earth-500 text-sm">{item.email}</Text>
          </View>
          <View className="items-end">
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${color}15` }}
            >
              <Text style={{ color }} className="text-xs capitalize font-medium">
                {item.role}
              </Text>
            </View>
            <View className={`mt-2 px-2 py-1 rounded-full ${item.active ? 'bg-green-100' : 'bg-earth-100'}`}>
              <Text className={`text-xs ${item.active ? 'text-green-700' : 'text-earth-600'}`}>
                {item.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-white">Users</Text>
        <Text className="text-slate-400 mt-1">Manage platform users</Text>
      </View>

      <View className="px-5 mb-4">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <Search size={20} color="#78716c" />
          <TextInput
            className="flex-1 ml-3 text-earth-800"
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#a8a29e"
          />
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <User size={48} color="#d6d3d1" />
            <Text className="text-earth-500 mt-4">No users found</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}
