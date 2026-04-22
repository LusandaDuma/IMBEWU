/**
 * @fileoverview Admin LMS control room — platform pulse and shortcuts.
 */

import { ScreenHeader } from '@/components/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, GraduationCap, Plus, TrendingUp, Users } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const stats = [
  { label: 'Total users', value: '156', change: '+12%', icon: Users, ring: 'bg-violet-500/12', iconColor: '#a78bfa' },
  { label: 'Courses', value: '24', change: '+3', icon: BookOpen, ring: 'bg-primary-500/12', iconColor: '#4ade80' },
  { label: 'Active learners', value: '89', change: '+8%', icon: GraduationCap, ring: 'bg-cyan-500/12', iconColor: '#22d3ee' },
  { label: 'Completion rate', value: '72%', change: '+5%', icon: TrendingUp, ring: 'bg-accent-500/12', iconColor: '#fbbf24' },
];

const recentActions = [
  { id: '1', text: 'New course “Advanced Irrigation” published', time: '10 min ago' },
  { id: '2', text: '5 new learners registered', time: '1 hour ago' },
  { id: '3', text: 'Course “Soil Science” updated', time: '3 hours ago' },
  { id: '4', text: 'Coordinator account approved', time: '5 hours ago' },
];

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <ScreenHeader
              title="Administration"
              subtitle="Courses, users, and platform health."
              variant="dark"
            />
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/courses/new')}
            className="mt-2 w-12 h-12 rounded-full bg-primary-600/95 items-center justify-center"
            style={{ elevation: 4 }}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap -mx-2 mt-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <View key={stat.label} className="w-1/2 px-2 mb-4">
                  <View className={`rounded-3xl p-4 ${stat.ring}`}>
                    <View className="flex-row items-start justify-between">
                      <View className="w-10 h-10 rounded-2xl items-center justify-center bg-white/6">
                        <Icon size={20} color={stat.iconColor} />
                      </View>
                      <Text className="text-primary-300 text-xs font-bold">{stat.change}</Text>
                    </View>
                    <Text className="text-2xl font-light text-white mt-3 tracking-tight">{stat.value}</Text>
                    <Text className="text-slate-400 text-xs font-light mt-1 tracking-wide">{stat.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="bg-white/6 rounded-3xl p-6 mb-6">
            <Text className="text-white font-light text-base mb-5 tracking-tight">Quick actions</Text>
            <View className="flex-row flex-wrap -mx-2">
              {[
                { label: 'Add course', onPress: () => router.push('/admin/courses/new') },
                { label: 'Manage users', onPress: () => router.push('/admin/users') },
                { label: 'Course library', onPress: () => router.push('/admin/courses') },
                { label: 'Settings', onPress: () => router.push('/admin/settings') },
              ].map((action) => (
                <View key={action.label} className="w-1/2 px-2 mb-3">
                  <TouchableOpacity
                    onPress={action.onPress}
                    className="rounded-full py-3 px-2 bg-white/10 items-center"
                    activeOpacity={0.9}
                  >
                    <Text className="text-white text-sm font-light text-center tracking-wide">{action.label}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <Text className="text-slate-300 font-light text-base mb-3 tracking-tight">Recent activity</Text>
          <View className="bg-white/6 rounded-3xl p-2 mb-10">
            {recentActions.map((action) => (
              <View key={action.id} className="px-4 py-3.5 rounded-2xl mb-1 last:mb-0">
                <Text className="text-white/95 text-sm leading-5 font-light">{action.text}</Text>
                <Text className="text-slate-500 text-xs mt-2 font-light tracking-wide">{action.time}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
