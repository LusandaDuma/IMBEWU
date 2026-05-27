/**
 * @fileoverview Admin LMS control room — luxury emerald & gold theme.
 */

import { DashboardStatsGrid } from '@/components/shared';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getAdminAdvancedStats, getAdminDashboardAnalytics } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Activity,
  Award,
  BookMarked,
  BookOpen,
  Building2,
  FileEdit,
  GraduationCap,
  Plus,
  Settings,
  Sparkles,
  Sprout,
  TrendingUp,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';
const DARK = '#022418';

function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';
  const diffMs = timestamp - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (absMs < minute) return 'just now';
  if (absMs < hour) { const n = Math.round(absMs / minute); return n === 1 ? '1 min ago' : `${n} min ago`; }
  if (absMs < day) { const n = Math.round(absMs / hour); return n === 1 ? '1 hour ago' : `${n} hours ago`; }
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
  });

  const { data: advanced, isLoading: advancedLoading, isError: advancedError, refetch: refetchAdvanced } = useQuery({
    queryKey: ['admin-advanced-stats'],
    queryFn: getAdminAdvancedStats,
  });

  useRefetchOnFocus(() => { void refetch(); void refetchAdvanced(); }, true);

  const recentActions = data?.recentActions ?? [];

  const roleStatItems = useMemo(() => {
    const r = advanced?.usersByRole;
    return [
      { label: 'Admins', value: `${r?.admin ?? 0}`, change: 'Role', icon: UserCog, iconColor: GOLD },
      { label: 'Coordinators', value: `${r?.coordinator ?? 0}`, change: 'Role', icon: BookMarked, iconColor: GOLD },
      { label: 'Students', value: `${r?.student ?? 0}`, change: 'Role', icon: GraduationCap, iconColor: GOLD },
      { label: 'Independent', value: `${r?.independent ?? 0}`, change: 'Role', icon: Sprout, iconColor: GOLD },
    ];
  }, [advanced?.usersByRole]);

  const contentStatItems = useMemo(() => [
    { label: 'Published courses', value: `${advanced?.publishedCourses ?? 0}`, change: 'Live', icon: BookOpen, iconColor: GOLD },
    { label: 'Draft courses', value: `${advanced?.draftCourses ?? 0}`, change: 'Unlisted', icon: FileEdit, iconColor: GOLD },
    { label: 'Total enrolments', value: `${advanced?.totalEnrolments ?? 0}`, change: 'All time', icon: Users, iconColor: GOLD },
    { label: 'Classes', value: `${advanced?.totalClasses ?? 0}`, change: 'Cohorts', icon: Building2, iconColor: GOLD },
  ], [advanced]);

  const signalStatItems = useMemo(() => [
    { label: 'New enrolments (7d)', value: `${advanced?.newEnrolments7d ?? 0}`, change: 'Week', icon: TrendingUp, iconColor: GOLD },
    { label: 'Badges issued', value: `${advanced?.badgesAwarded ?? 0}`, change: 'All time', icon: Award, iconColor: GOLD },
    { label: 'Logins (7d)', value: `${advanced?.activeLogins7d ?? 0}`, change: 'Active', icon: Activity, iconColor: GOLD },
  ], [advanced]);

  const quickActions = [
    { label: 'Add Course', icon: Plus, onPress: () => router.push('/admin/courses/new') },
    { label: 'Manage Users', icon: Users, onPress: () => router.push('/admin/users') },
    { label: 'Course Library', icon: BookOpen, onPress: () => router.push('/admin/courses') },
    { label: 'Settings', icon: Settings, onPress: () => router.push('/admin/settings') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* HERO BANNER */}
        <View style={{
          backgroundColor: EMERALD,
          margin: 16,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: `${GOLD}50`,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color={GOLD} />
            <Text style={{ color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
              System Active
            </Text>
          </View>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '300', fontFamily: 'serif', marginBottom: 8 }}>
            Courses, users, and platform health.
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
            Monitor course completion, manage coordinators, and query our indigenous knowledge database using the Copilot helper.
          </Text>

          {/* ── CTA row: Add Course + Add Learner ── */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/admin/courses/new')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: GOLD,
                paddingVertical: 12,
                borderRadius: 12,
              }}
              activeOpacity={0.85}
            >
              <Plus size={15} color={DARK} strokeWidth={2.5} />
              <Text style={{ color: DARK, fontSize: 13, fontWeight: '700' }}>Add Course</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/admin/users-new')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
                paddingVertical: 12,
                borderRadius: 12,
              }}
              activeOpacity={0.85}
            >
              <UserPlus size={15} color="white" strokeWidth={2} />
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>Add Learner</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS GRID */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            {[
              { label: 'Total Users', value: data?.stats.totalUsers ?? 0, icon: Users },
              { label: 'Courses', value: data?.stats.totalCourses ?? 0, icon: BookOpen },
              { label: 'Active Users', value: data?.stats.activeLearners ?? 0, icon: Activity },
              { label: 'Completion', value: `${data?.stats.completionRate ?? 0}%`, icon: TrendingUp },
            ].map((stat) => (
              <View key={stat.label} style={{
                width: '47%',
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: '#E8DFD0',
              }}>
                <stat.icon size={18} color={GOLD} />
                <Text style={{
                  color: DARK,
                  fontSize: 28,
                  fontWeight: '700',
                  fontFamily: 'serif',
                  marginTop: 12,
                }}>
                  {isLoading ? '—' : stat.value}
                </Text>
                <Text style={{
                  color: '#8B7355',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginTop: 4,
                }}>
                  {stat.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                  <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '600' }}>Live</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={{ color: DARK, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Quick Actions
          </Text>
          <Text style={{ color: '#8B7355', fontSize: 13, marginBottom: 12 }}>
            Navigate to key platform areas.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress}
                style={{
                  width: '47%',
                  backgroundColor: EMERALD,
                  borderRadius: 14,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: `${GOLD}40`,
                }}
                activeOpacity={0.85}
              >
                <action.icon size={16} color={GOLD} />
                <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* PLATFORM DETAIL */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={{ color: DARK, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Platform Detail
          </Text>
          <Text style={{ color: '#8B7355', fontSize: 13, marginBottom: 16 }}>
            Deeper metrics — user mix, content inventory, and recent momentum.
          </Text>
          {advancedError ? (
            <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>
              Could not load advanced stats. Try again later.
            </Text>
          ) : (
            <>
              <DashboardStatsGrid title="Users by role" items={roleStatItems} isLoading={advancedLoading} />
              <DashboardStatsGrid title="Content & enrolments" items={contentStatItems} isLoading={advancedLoading} />
              <DashboardStatsGrid title="Signals (7 days)" items={signalStatItems} isLoading={advancedLoading} />
            </>
          )}
        </View>

        {/* RECENT ACTIVITY */}
        <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: DARK, fontSize: 16, fontWeight: '300', fontFamily: 'serif' }}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push('/admin/activity')}>
              <Text style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E8DFD0',
            overflow: 'hidden',
          }}>
            {isError ? (
              <View style={{ padding: 20 }}>
                <Text style={{ color: '#ef4444', fontSize: 13 }}>Unable to load analytics right now.</Text>
              </View>
            ) : recentActions.length === 0 ? (
              <View style={{ padding: 20 }}>
                <Text style={{ color: '#8B7355', fontSize: 13 }}>
                  {isLoading ? 'Loading recent activity...' : 'No recent activity yet.'}
                </Text>
              </View>
            ) : (
              recentActions.map((action, ri) => (
                <View
                  key={action.id}
                  style={{
                    padding: 16,
                    borderBottomWidth: ri < recentActions.length - 1 ? 1 : 0,
                    borderBottomColor: '#E8DFD0',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, marginTop: 5 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: DARK, fontSize: 13, lineHeight: 20 }}>{action.text}</Text>
                    <Text style={{ color: '#8B7355', fontSize: 11, marginTop: 4 }}>
                      {formatRelativeTime(action.timestamp)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/admin/courses/new')}
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
