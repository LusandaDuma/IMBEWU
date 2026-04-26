/**
 * @fileoverview Admin LMS control room — platform pulse and shortcuts.
 */

import { DashboardStatsGrid, ScreenHeader } from '@/components/shared';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getAdminAdvancedStats, getAdminDashboardAnalytics } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Activity,
  Award,
  BookOpen,
  BookMarked,
  Building2,
  FileEdit,
  GraduationCap,
  Plus,
  Sprout,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diffMs = timestamp - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl) {
    try {
      const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      if (absMs < hour) {
        return formatter.format(Math.round(diffMs / minute), 'minute');
      }
      if (absMs < day) {
        return formatter.format(Math.round(diffMs / hour), 'hour');
      }
      return formatter.format(Math.round(diffMs / day), 'day');
    } catch {
      /* engine stub — fall through */
    }
  }

  if (absMs < minute) return 'just now';
  if (absMs < hour) {
    const n = Math.round(absMs / minute);
    return n === 1 ? '1 min ago' : `${n} min ago`;
  }
  if (absMs < day) {
    const n = Math.round(absMs / hour);
    return n === 1 ? '1 hour ago' : `${n} hours ago`;
  }
  const n = Math.round(absMs / day);
  return n === 1 ? '1 day ago' : `${n} days ago`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard-analytics'],
    queryFn: getAdminDashboardAnalytics,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: advanced,
    isLoading: advancedLoading,
    isError: advancedError,
    refetch: refetchAdvanced,
  } = useQuery({
    queryKey: ['admin-advanced-stats'],
    queryFn: getAdminAdvancedStats,
  });

  useRefetchOnFocus(
    () => {
      void refetch();
      void refetchAdvanced();
    },
    true
  );

  const stats = [
    {
      label: 'Total users',
      value: `${data?.stats.totalUsers ?? 0}`,
      change: 'Live',
      icon: Users,
      iconColor: '#a78bfa',
    },
    {
      label: 'Courses',
      value: `${data?.stats.totalCourses ?? 0}`,
      change: 'Live',
      icon: BookOpen,
      iconColor: '#4ade80',
    },
    {
      label: 'Active users',
      value: `${data?.stats.activeLearners ?? 0}`,
      change: 'Live',
      icon: Users,
      iconColor: '#22d3ee',
    },
    {
      label: 'Completion rate',
      value: `${data?.stats.completionRate ?? 0}%`,
      change: 'Live',
      icon: TrendingUp,
      iconColor: '#fbbf24',
    },
  ];

  const recentActions = data?.recentActions ?? [];

  const roleStatItems = useMemo(() => {
    const r = advanced?.usersByRole;
    return [
      { label: 'Admins', value: `${r?.admin ?? 0}`, change: 'Role', icon: UserCog, iconColor: '#7c3aed' },
      { label: 'Coordinators', value: `${r?.coordinator ?? 0}`, change: 'Role', icon: BookMarked, iconColor: '#16a34a' },
      { label: 'Students', value: `${r?.student ?? 0}`, change: 'Role', icon: GraduationCap, iconColor: '#0ea5e9' },
      { label: 'Independent', value: `${r?.independent ?? 0}`, change: 'Role', icon: Sprout, iconColor: '#ea580c' },
    ];
  }, [advanced?.usersByRole]);

  const contentStatItems = useMemo(
    () => [
      {
        label: 'Published courses',
        value: `${advanced?.publishedCourses ?? 0}`,
        change: 'Live',
        icon: BookOpen,
        iconColor: '#22c55e',
      },
      {
        label: 'Draft courses',
        value: `${advanced?.draftCourses ?? 0}`,
        change: 'Unlisted',
        icon: FileEdit,
        iconColor: '#ca8a04',
      },
      {
        label: 'Total enrolments',
        value: `${advanced?.totalEnrolments ?? 0}`,
        change: 'All time',
        icon: Users,
        iconColor: '#0891b2',
      },
      {
        label: 'Classes',
        value: `${advanced?.totalClasses ?? 0}`,
        change: 'Cohorts',
        icon: Building2,
        iconColor: '#8b5cf6',
      },
    ],
    [advanced]
  );

  const signalStatItems = useMemo(
    () => [
      {
        label: 'New enrolments (7d)',
        value: `${advanced?.newEnrolments7d ?? 0}`,
        change: 'Week',
        icon: TrendingUp,
        iconColor: '#10b981',
      },
      {
        label: 'Badges issued',
        value: `${advanced?.badgesAwarded ?? 0}`,
        change: 'All time',
        icon: Award,
        iconColor: '#d97706',
      },
      {
        label: 'Logins (7d)',
        value: `${advanced?.activeLogins7d ?? 0}`,
        change: 'Active',
        icon: Activity,
        iconColor: '#6366f1',
      },
    ],
    [advanced]
  );

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <ScreenHeader
              title="Administration"
              subtitle="Courses, users, and platform health."
              variant="light"
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
                  <View className="pt-1 pb-4 border-b border-earth-400/30">
                    <View className="flex-row items-start justify-between">
                      <View className="w-10 h-10 items-center justify-center">
                        <Icon size={20} color={stat.iconColor} />
                      </View>
                      <Text className="text-primary-800 text-xs font-bold">{isLoading ? 'Loading...' : stat.change}</Text>
                    </View>
                    <Text className="text-2xl font-light text-black mt-3 tracking-tight">{stat.value}</Text>
                    <Text className="text-earth-700 text-xs font-light mt-1 tracking-wide">{stat.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="mb-2">
            <Text className="text-black font-light text-base mb-1 tracking-tight">Platform detail</Text>
            <Text className="text-earth-600 text-xs font-light mb-3">
              Deeper metrics — user mix, content inventory, and recent momentum.
            </Text>
            {advancedError ? (
              <Text className="text-red-800 text-sm font-light mb-3">
                Could not load advanced stats. Try again later.
              </Text>
            ) : (
              <>
                <DashboardStatsGrid
                  title="Users by role"
                  items={roleStatItems}
                  isLoading={advancedLoading}
                />
                <DashboardStatsGrid
                  title="Content & enrolments"
                  items={contentStatItems}
                  isLoading={advancedLoading}
                />
                <DashboardStatsGrid
                  title="Signals (7 days)"
                  items={signalStatItems}
                  isLoading={advancedLoading}
                />
              </>
            )}
          </View>

          <View className="mb-6 pb-4 border-b border-earth-400/40">
            <Text className="text-black font-light text-base mb-5 tracking-tight">Quick actions</Text>
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
                    className="py-3 px-2 border-b border-earth-400/40 items-center"
                    activeOpacity={0.9}
                  >
                    <Text className="text-black text-sm font-light text-center tracking-wide">{action.label}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-black font-light text-base tracking-tight">Recent activity</Text>
            <TouchableOpacity onPress={() => router.push('/admin/activity')} activeOpacity={0.9}>
              <Text className="text-primary-800 text-sm font-medium">View all</Text>
            </TouchableOpacity>
          </View>
          <View className="mb-10 pb-1 border-b border-earth-400/40">
            {isError ? (
              <View className="px-4 py-3.5">
                <Text className="text-red-800 text-sm leading-5 font-light">
                  Unable to load analytics right now. Pull to refresh or try again in a moment.
                </Text>
              </View>
            ) : recentActions.length === 0 ? (
              <View className="px-4 py-3.5">
                <Text className="text-earth-700 text-sm leading-5 font-light">
                  {isLoading ? 'Loading recent activity...' : 'No recent activity yet.'}
                </Text>
              </View>
            ) : (
              recentActions.map((action, ri) => (
                <View
                  key={action.id}
                  className={`px-4 py-3.5 ${ri < recentActions.length - 1 ? 'border-b border-earth-400/35' : ''}`}
                >
                  <Text className="text-black text-sm leading-5 font-light">{action.text}</Text>
                  <Text className="text-earth-600 text-xs mt-2 font-light tracking-wide">
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
