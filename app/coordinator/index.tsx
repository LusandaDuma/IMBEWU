/**
 * @fileoverview Coordinator Dashboard — luxury emerald & gold theme.
 */

import { DashboardStatsGrid, EmptyState } from '@/components/shared';
import { createClass, getClassesByCoordinator, getCoordinatorAnalytics, getCourses } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { Class, Course } from '@/types';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Award, BookOpen, Calendar, ChevronRight,
  Copy, Plus, Sparkles, TrendingUp, Users,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert, FlatList, Modal, RefreshControl, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Theme ─────────────────────────────────────────────────────────────────────
const EMERALD = '#032f20';
const EMERALD2 = '#0a3d28';
const GOLD    = '#C9A84C';
const CREAM   = '#FAF7F2';
const CARD_BG = '#ffffff';

export default function CoordinatorDashboard() {
  const { user, profile } = useAuthStore();
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate]       = useState(false);
  const [className, setClassName]         = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: classes = [], isLoading, refetch } = useQuery<Class[]>({
    queryKey: ['coordinator-classes', user?.id],
    queryFn: () => (user ? getClassesByCoordinator(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const { data: courses = [], refetch: refetchCatalog } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: getCourses,
  });

  const { data: coAnalytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['coordinator-analytics', user?.id],
    queryFn: () => (user?.id ? getCoordinatorAnalytics(user.id) : Promise.resolve(null)),
    enabled: !!user?.id,
  });

  useRefetchOnFocus(() => {
    void refetch();
    void refetchCatalog();
    void refetchAnalytics();
  }, !!user);

  const stats = useMemo(() => {
    const s = coAnalytics?.stats;
    return [
      { label: 'Students',    value: `${s?.totalStudents ?? 0}`,          sub: 'In your classes', icon: Users,     color: GOLD },
      { label: 'Classes',     value: `${s?.activeClasses ?? 0}`,           sub: 'Active cohorts',  icon: BookOpen,  color: GOLD },
      { label: 'Completion',  value: `${s?.averageCompletionPct ?? 0}%`,   sub: 'Avg. progress',   icon: TrendingUp,color: GOLD },
      { label: 'Certificates',value: `${s?.certificates ?? 0}`,            sub: 'Issued',          icon: Award,     color: GOLD },
    ];
  }, [coAnalytics?.stats]);

  const createClassMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedCourseId) throw new Error('Missing class details');
      return createClass({ created_by: user.id, course_id: selectedCourseId, name: className.trim() });
    },
    onSuccess: (createdClass) => {
      if (!createdClass) { Alert.alert('Could not create class', 'Please try again.'); return; }
      queryClient.invalidateQueries({ queryKey: ['coordinator-classes', user?.id] });
      setClassName(''); setSelectedCourseId(null); setShowCreate(false);
      Alert.alert('Class created ✓', `Join code: ${createdClass.join_code}`);
    },
    onError: () => Alert.alert('Could not create class', 'Please check your details and try again.'),
  });

  const handleCopyCode = (code: string) => Alert.alert('Join code', code);

  const openCreate = () => {
    setShowCreate(true);
    if (!selectedCourseId && courses.length > 0) setSelectedCourseId(courses[0].id);
  };

  const handleCreate = () => {
    if (!className.trim())   { Alert.alert('Class name required', 'Enter a class name.'); return; }
    if (!selectedCourseId)   { Alert.alert('Course required', 'Select a course.'); return; }
    createClassMutation.mutate();
  };

  const firstName = profile?.first_name ?? 'Coordinator';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => { void refetch(); void refetchAnalytics(); }}
            tintColor={GOLD}
          />
        }

        ListHeaderComponent={
          <>
            {/* ── Hero banner ── */}
            <View style={{
              backgroundColor: EMERALD, margin: 16, borderRadius: 20, padding: 24,
              borderWidth: 1, borderColor: `${GOLD}40`,
            }}>
              {/* Watermark */}
              <View style={{ position: 'absolute', right: 16, top: 16, opacity: 0.05 }} pointerEvents="none">
                <Text style={{ fontSize: 80, fontWeight: '900', color: '#fff', letterSpacing: -4 }}>CO</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Sparkles size={12} color={GOLD} />
                <Text style={{ color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
                  Coordinator Portal
                </Text>
              </View>

              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300', marginBottom: 6, letterSpacing: -0.3 }}>
                Welcome back, {firstName}.
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20, marginBottom: 22 }}>
                Manage your cohorts, share join codes, and track learner progress across all your classes.
              </Text>

              {/* CTA */}
              <TouchableOpacity
                onPress={openCreate}
                activeOpacity={0.87}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: GOLD, borderRadius: 12, paddingVertical: 13, gap: 8,
                }}
              >
                <Plus size={16} color={EMERALD} strokeWidth={2.5} />
                <Text style={{ color: EMERALD, fontWeight: '700', fontSize: 14 }}>Create New Class</Text>
              </TouchableOpacity>
            </View>

            {/* ── Stats grid ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
                At a Glance
              </Text>
              <Text style={{ color: '#8B7355', fontSize: 13, marginBottom: 14 }}>
                Your coordination overview.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {stats.map((stat) => (
                  <View key={stat.label} style={{
                    width: '47%', backgroundColor: CARD_BG, borderRadius: 16,
                    padding: 18, borderWidth: 1, borderColor: '#E8DFD0',
                  }}>
                    <stat.icon size={18} color={GOLD} />
                    <Text style={{ color: EMERALD, fontSize: 28, fontWeight: '700', marginTop: 10 }}>
                      {analyticsLoading ? '—' : stat.value}
                    </Text>
                    <Text style={{ color: '#8B7355', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 3 }}>
                      {stat.label}
                    </Text>
                    <Text style={{ color: '#b0a898', fontSize: 11, marginTop: 2 }}>{stat.sub}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Classes heading ── */}
            {classes.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 4 }}>
                <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
                  Your Classes
                </Text>
              </View>
            )}
          </>
        }

        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <View style={{
              backgroundColor: CARD_BG, borderRadius: 20, padding: 32,
              alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD0',
            }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: `${EMERALD}10`, alignItems: 'center',
                justifyContent: 'center', marginBottom: 16,
              }}>
                <Users size={28} color={EMERALD} strokeWidth={1.5} />
              </View>
              <Text style={{ color: EMERALD, fontSize: 18, fontWeight: '300', marginBottom: 8 }}>
                No classes yet
              </Text>
              <Text style={{ color: '#8B7355', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                Create a class to link learners to a published course and track their journey.
              </Text>
              <TouchableOpacity
                onPress={openCreate}
                style={{ backgroundColor: EMERALD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 }}
                activeOpacity={0.87}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Create First Class</Text>
              </TouchableOpacity>
            </View>
          </View>
        }

        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/coordinator/class/${item.id}`)}
            activeOpacity={0.88}
            style={{
              marginHorizontal: 16, marginBottom: 12,
              backgroundColor: CARD_BG, borderRadius: 16,
              padding: 18, borderWidth: 1, borderColor: '#E8DFD0',
            }}
          >
            {/* Class name row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: EMERALD, fontSize: 16, fontWeight: '400', letterSpacing: -0.2 }} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={{ color: '#8B7355', fontSize: 11, marginTop: 3 }}>
                  Course · {item.course_id.slice(0, 8)}…
                </Text>
              </View>
              {/* Join code pill */}
              <TouchableOpacity
                onPress={() => handleCopyCode(item.join_code)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  backgroundColor: `${GOLD}15`, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 6,
                  borderWidth: 1, borderColor: `${GOLD}40`,
                }}
                activeOpacity={0.75}
              >
                <Text style={{ color: GOLD, fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>
                  {item.join_code}
                </Text>
                <Copy size={12} color={GOLD} />
              </TouchableOpacity>
            </View>

            {/* Footer row */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EBE3',
            }}>
              <Calendar size={13} color="#b0a898" />
              <Text style={{ color: '#b0a898', fontSize: 12, marginLeft: 5, flex: 1 }}>
                {new Date(item.start_date ?? item.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={13} color="#b0a898" />
                <Text style={{ color: '#b0a898', fontSize: 12 }}>View roster</Text>
                <ChevronRight size={16} color={GOLD} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ── Create Class Modal ── */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: CARD_BG, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40,
          }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#E8DFD0', borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: `${EMERALD}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Plus size={20} color={EMERALD} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ color: EMERALD, fontWeight: '600', fontSize: 17 }}>Create class</Text>
                <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300' }}>Name it and choose a course</Text>
              </View>
            </View>

            {/* Class name */}
            <Text style={{ color: '#8B7355', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
              CLASS NAME
            </Text>
            <TextInput
              value={className}
              onChangeText={setClassName}
              placeholder="e.g. Grade 11 Agriculture"
              placeholderTextColor="#C4B89A"
              style={{
                backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0',
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
                fontSize: 14, color: EMERALD, marginBottom: 20,
              }}
            />

            {/* Course picker */}
            <Text style={{ color: '#8B7355', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>
              SELECT COURSE
            </Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {courses.length === 0 ? (
                <Text style={{ color: '#b0a898', fontSize: 13 }}>No published courses available yet.</Text>
              ) : (
                courses.map((course) => {
                  const selected = selectedCourseId === course.id;
                  return (
                    <TouchableOpacity
                      key={course.id}
                      onPress={() => setSelectedCourseId(course.id)}
                      style={{
                        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
                        marginBottom: 8, borderWidth: 1.5,
                        borderColor: selected ? EMERALD : '#E8DFD0',
                        backgroundColor: selected ? `${EMERALD}08` : CREAM,
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                      }}
                      activeOpacity={0.8}
                    >
                      {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: EMERALD }} />}
                      <Text style={{ color: selected ? EMERALD : '#8B7355', fontSize: 14, fontWeight: selected ? '600' : '300', flex: 1 }}>
                        {course.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Buttons */}
            <View style={{ gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={createClassMutation.isPending || courses.length === 0}
                style={{
                  backgroundColor: createClassMutation.isPending ? `${EMERALD}60` : EMERALD,
                  borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                }}
                activeOpacity={0.87}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  {createClassMutation.isPending ? 'Creating…' : 'Create Class'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#8B7355', fontSize: 14, fontWeight: '300' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
