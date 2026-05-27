/**
 * @fileoverview Coordinator analytics — full luxury visual treatment.
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getCoordinatorAnalytics } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, TrendingUp, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return 'Just now';
  const diffMs = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) { const m = Math.floor(diffMs / minute); return `${m} min ago`; }
  if (diffMs < day) { const h = Math.floor(diffMs / hour); return `${h} hr${h === 1 ? '' : 's'} ago`; }
  const d = Math.floor(diffMs / day); return `${d} day${d === 1 ? '' : 's'} ago`;
}

// ── Completion ring ───────────────────────────────────────────────────────────

function CompletionRing({ pct }: { pct: number }) {
  const SIZE = 110;
  const STROKE = 7;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const filled = CIRC * (Math.min(pct, 100) / 100);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke="rgba(255,255,255,0.12)" strokeWidth={STROKE} fill="none"
        />
        {/* Fill */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke="#d4af37"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${filled} ${CIRC - filled}`}
          strokeDashoffset={CIRC / 4}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#f5f0e8', fontSize: 24, fontWeight: '200', letterSpacing: -1 }}>{pct}%</Text>
        <Text style={{ color: 'rgba(245,240,232,0.45)', fontSize: 9, letterSpacing: 2, fontWeight: '400', marginTop: 2 }}>COMPLETION</Text>
      </View>
    </View>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: string; icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 16 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon size={16} color={color} strokeWidth={1.5} />
      </View>
      <Text style={{ color: '#f5f0e8', fontSize: 26, fontWeight: '200', letterSpacing: -1 }}>{value}</Text>
      <Text style={{ color: 'rgba(245,240,232,0.4)', fontSize: 10, fontWeight: '400', marginTop: 3, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({ text, timestamp, isLast }: { text: string; timestamp: string; isLast: boolean }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 14 }}>
      {/* Timeline dot + line */}
      <View style={{ width: 20, alignItems: 'center', marginRight: 12 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a', marginTop: 4 }} />
        {!isLast && <View style={{ width: 1, flex: 1, backgroundColor: 'rgba(22,163,74,0.15)', marginTop: 4 }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#1c1917', fontSize: 13, fontWeight: '300', lineHeight: 19 }}>{text}</Text>
        <Text style={{ color: '#a8a29e', fontSize: 11, fontWeight: '300', marginTop: 3 }}>{formatRelativeTime(timestamp)}</Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CoordinatorAnalyticsScreen() {
  const { user, profile } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['coordinator-analytics', user?.id],
    queryFn: () => (user?.id ? getCoordinatorAnalytics(user.id) : Promise.resolve(null)),
    enabled: !!user?.id,
  });

  useRefetchOnFocus(refetch, !!user?.id);

  const source = data?.stats;
  const completionPct = source?.averageCompletionPct ?? 0;
  const totalStudents = source?.totalStudents ?? 0;
  const activeClasses = source?.activeClasses ?? 0;
  const certificates = source?.certificates ?? 0;
  const recentActivity = data?.recentActivity ?? [];

  const firstName = profile?.first_name ?? 'Coordinator';

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >

          {/* ── Hero card — dark forest green ───────────────────────────── */}
          <View style={{ margin: 16, borderRadius: 28, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#0a2416', '#0d3020', '#071a0f']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{ padding: 24, paddingBottom: 28 }}
            >
              {/* Watermark */}
              <Text style={{ position: 'absolute', right: 12, top: 8, fontSize: 72, fontWeight: '800', color: 'rgba(212,175,55,0.05)', letterSpacing: -4 }}>A</Text>

              {/* Label */}
              <View style={{ borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 16 }}>
                <Text style={{ color: '#d4af37', fontSize: 9, letterSpacing: 2.5, fontWeight: '400' }}>COORDINATOR ANALYTICS</Text>
              </View>

              {/* Greeting + ring row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={{ color: 'rgba(245,240,232,0.45)', fontSize: 12, fontWeight: '300', marginBottom: 4 }}>
                    Welcome back,
                  </Text>
                  <Text style={{ color: '#f5f0e8', fontSize: 26, fontWeight: '200', letterSpacing: -0.5, lineHeight: 30 }}>
                    {firstName}
                  </Text>
                  <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: 'rgba(22,163,74,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#4ade80', fontSize: 18, fontWeight: '200' }}>{totalStudents}</Text>
                      <Text style={{ color: 'rgba(74,222,128,0.6)', fontSize: 9, letterSpacing: 1.5, fontWeight: '400' }}>STUDENTS</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(217,119,6,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#fbbf24', fontSize: 18, fontWeight: '200' }}>{activeClasses}</Text>
                      <Text style={{ color: 'rgba(251,191,36,0.6)', fontSize: 9, letterSpacing: 1.5, fontWeight: '400' }}>CLASSES</Text>
                    </View>
                  </View>
                </View>

                <CompletionRing pct={completionPct} />
              </View>

              {/* Gold progress bar */}
              <View style={{ marginTop: 20, height: 2, backgroundColor: 'rgba(212,175,55,0.12)', borderRadius: 1 }}>
                <View style={{ height: '100%', backgroundColor: '#d4af37', borderRadius: 1, width: `${completionPct}%` }} />
              </View>
              <Text style={{ color: 'rgba(245,240,232,0.3)', fontSize: 10, fontWeight: '300', letterSpacing: 1.5, marginTop: 6 }}>
                AVG COURSE COMPLETION ACROSS ALL CLASSES
              </Text>
            </LinearGradient>
          </View>

          {/* ── Stat cards row ──────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ backgroundColor: '#1c1917', borderRadius: 24, padding: 16, flexDirection: 'row', gap: 10 }}>
              <StatCard label="Total Students" value={String(totalStudents)} icon={Users} color="#4ade80" />
              <StatCard label="Active Classes" value={String(activeClasses)} icon={BookOpen} color="#fbbf24" />
              <StatCard label="Certificates" value={String(certificates)} icon={Award} color="#c084fc" />
            </View>
          </View>

          {/* ── Recent activity ─────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>

              {/* Section header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#1c1917', fontSize: 15, fontWeight: '300', letterSpacing: -0.2 }}>Recent activity</Text>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' }} />
              </View>

              {isLoading ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#a8a29e', fontSize: 13, fontWeight: '300' }}>Loading activity…</Text>
                </View>
              ) : recentActivity.length === 0 ? (
                <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(22,163,74,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <TrendingUp size={20} color="#a8a29e" strokeWidth={1.5} />
                  </View>
                  <Text style={{ color: '#a8a29e', fontSize: 13, fontWeight: '300' }}>No recent activity yet.</Text>
                  <Text style={{ color: '#d4d4d0', fontSize: 11, fontWeight: '300', marginTop: 4 }}>Activity appears here as students progress.</Text>
                </View>
              ) : (
                recentActivity.map((activity, index) => (
                  <ActivityRow
                    key={activity.id}
                    text={activity.text}
                    timestamp={activity.timestamp}
                    isLast={index === recentActivity.length - 1}
                  />
                ))
              )}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
