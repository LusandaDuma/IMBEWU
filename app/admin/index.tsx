/**
 * @fileoverview Admin LMS control room — platform pulse and shortcuts.
 */

import { ScreenHeader } from '@/components/shared';
import { getAdminDashboardAnalytics } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, Plus, TrendingUp, Users } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diffMs = timestamp - Date.now();
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < hour) {
    return formatter.format(Math.round(diffMs / minute), 'minute');
  }
  if (absMs < day) {
    return formatter.format(Math.round(diffMs / hour), 'hour');
  }
  return formatter.format(Math.round(diffMs / day), 'day');
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard-analytics'],
    queryFn: getAdminDashboardAnalytics,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const stats = [
    {
      label: 'Total users',
      value: `${data?.stats.totalUsers ?? 0}`,
      change: 'Live',
      icon: Users,
      ring: 'bg-violet-500/12',
      iconColor: '#a78bfa',
    },
    {
      label: 'Courses',
      value: `${data?.stats.totalCourses ?? 0}`,
      change: 'Live',
      icon: BookOpen,
      ring: 'bg-primary-500/12',
      iconColor: '#4ade80',
    },
    {
      label: 'Active users',
      value: `${data?.stats.activeLearners ?? 0}`,
      change: 'Live',
      icon: Users,
      ring: 'bg-cyan-500/12',
      iconColor: '#22d3ee',
    },
    {
      label: 'Completion rate',
      value: `${data?.stats.completionRate ?? 0}%`,
      change: 'Live',
      icon: TrendingUp,
      ring: 'bg-accent-500/12',
      iconColor: '#fbbf24',
    },
  ];

  const recentActions = data?.recentActions ?? [];

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
                      <Text className="text-primary-300 text-xs font-bold">{isLoading ? 'Loading...' : stat.change}</Text>
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

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-slate-300 font-light text-base tracking-tight">Recent activity</Text>
            <TouchableOpacity onPress={() => router.push('/admin/activity')} activeOpacity={0.9}>
              <Text className="text-primary-300 text-sm font-medium">View all</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white/6 rounded-3xl p-2 mb-10">
            {isError ? (
              <View className="px-4 py-3.5 rounded-2xl">
                <Text className="text-rose-300 text-sm leading-5 font-light">
                  Unable to load analytics right now. Pull to refresh or try again in a moment.
                </Text>
              </View>
            ) : recentActions.length === 0 ? (
              <View className="px-4 py-3.5 rounded-2xl">
                <Text className="text-slate-300 text-sm leading-5 font-light">
                  {isLoading ? 'Loading recent activity...' : 'No recent activity yet.'}
                </Text>
              </View>
            ) : (
              recentActions.map((action) => (
                <View key={action.id} className="px-4 py-3.5 rounded-2xl mb-1 last:mb-0">
                  <Text className="text-white/95 text-sm leading-5 font-light">{action.text}</Text>
                  <Text className="text-slate-500 text-xs mt-2 font-light tracking-wide">
                    {formatRelativeTime(action.timestamp)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
