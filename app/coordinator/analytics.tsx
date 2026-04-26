/**
 * @fileoverview Coordinator analytics dashboard
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, TrendingUp, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getCoordinatorAnalytics } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';

function formatRelativeTime(timestamp: string): string {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) {
    return 'Just now';
  }

  const diffMs = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'Just now';
  }
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} min ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffMs / day);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function CoordinatorAnalyticsScreen() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-analytics', user?.id],
    queryFn: () => (user?.id ? getCoordinatorAnalytics(user.id) : Promise.resolve(null)),
    enabled: !!user?.id,
  });

  const stats = useMemo(() => {
    const source = data?.stats;
    return [
      {
        label: 'Total Students',
        value: String(source?.totalStudents ?? 0),
        icon: Users,
        color: '#16a34a',
      },
      {
        label: 'Active Classes',
        value: String(source?.activeClasses ?? 0),
        icon: BookOpen,
        color: '#d97706',
      },
      {
        label: 'Avg. Completion',
        value: `${source?.averageCompletionPct ?? 0}%`,
        icon: TrendingUp,
        color: '#0891b2',
      },
      {
        label: 'Certificates',
        value: String(source?.certificates ?? 0),
        icon: Award,
        color: '#7c3aed',
      },
    ];
  }, [data?.stats]);

  const recentActivity = data?.recentActivity || [];

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-900">Analytics</Text>
        <Text className="text-earth-600">Track your students&apos; real progress</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="flex-row flex-wrap -mx-2">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} className="w-1/2 px-2 mb-4">
                <View className="pb-4 border-b border-earth-400/35">
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon size={20} color={stat.color} />
                  </View>
                  <Text className="text-2xl font-bold text-earth-800">{stat.value}</Text>
                  <Text className="text-earth-500 text-sm">{stat.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text className="text-lg font-bold text-earth-900 mt-4 mb-3">Recent activity</Text>
        <View className="border-t border-earth-400/30 overflow-hidden">
          {isLoading ? (
            <View className="px-4 py-5">
              <Text className="text-earth-500">Loading analytics...</Text>
            </View>
          ) : recentActivity.length === 0 ? (
            <View className="px-4 py-5">
              <Text className="text-earth-500">No recent activity yet.</Text>
            </View>
          ) : (
            recentActivity.map((activity, index) => (
              <View
                key={activity.id}
                className={`px-4 py-4 ${
                  index < recentActivity.length - 1 ? 'border-b border-earth-100' : ''
                }`}
              >
                <Text className="text-earth-800">{activity.text}</Text>
                <Text className="text-earth-400 text-sm mt-1">{formatRelativeTime(activity.timestamp)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}