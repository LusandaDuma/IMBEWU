/**
 * @fileoverview Admin dashboard
 */

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Users, BookOpen, GraduationCap, TrendingUp, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const stats = [
  { label: 'Total Users', value: '156', change: '+12%', icon: Users, color: '#7c3aed' },
  { label: 'Courses', value: '24', change: '+3', icon: BookOpen, color: '#16a34a' },
  { label: 'Active Students', value: '89', change: '+8%', icon: GraduationCap, color: '#0891b2' },
  { label: 'Completion Rate', value: '72%', change: '+5%', icon: TrendingUp, color: '#ea580c' },
];

const recentActions = [
  { id: '1', text: 'New course "Advanced Irrigation" published', time: '10 min ago' },
  { id: '2', text: '5 new students registered', time: '1 hour ago' },
  { id: '3', text: 'Course "Soil Science" updated', time: '3 hours ago' },
  { id: '4', text: 'New coordinator account approved', time: '5 hours ago' },
];

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white">Admin Dashboard</Text>
            <Text className="text-slate-400">Platform overview</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/courses/new')}
            className="w-12 h-12 rounded-full bg-primary-600 items-center justify-center shadow-md"
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="flex-row flex-wrap -mx-2">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <Icon size={20} color={stat.color} />
                    </View>
                    <Text className="text-green-600 text-sm font-medium">{stat.change}</Text>
                  </View>
                  <Text className="text-2xl font-bold text-white mt-3">{stat.value}</Text>
                  <Text className="text-slate-400 text-sm">{stat.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-lg font-bold text-white mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap -mx-2">
            {[
              { label: 'Add Course', color: '#7c3aed', onPress: () => router.push('/admin/courses/new') },
              { label: 'Manage Users', color: '#16a34a', onPress: () => router.push('/admin/users') },
              { label: 'View Reports', color: '#0891b2', onPress: () => {} },
              { label: 'Settings', color: '#78716c', onPress: () => router.push('/admin/settings') },
            ].map((action) => (
              <View key={action.label} className="w-1/2 px-2 mb-3">
                <TouchableOpacity
                  onPress={action.onPress}
                  className="rounded-xl p-4 items-center"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Text style={{ color: action.color }} className="font-semibold">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-lg font-bold text-white mt-2 mb-3">Recent Activity</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {recentActions.map((action, index) => (
            <View
              key={action.id}
              className={`px-4 py-4 ${
                index < recentActions.length - 1 ? 'border-b border-earth-100' : ''
              }`}
            >
              <Text className="text-white">{action.text}</Text>
              <Text className="text-earth-400 text-sm mt-1">{action.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
