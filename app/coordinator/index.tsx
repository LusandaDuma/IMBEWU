/**
 * @fileoverview Coordinator Dashboard — luxury emerald & gold theme.
 * One class → multiple courses → one join code.
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import {
  createClass, getClassesByCoordinator,
  getCoordinatorAnalytics, getCourses,
} from '@/services/supabase';
import type { Class, Course } from '@/types';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Award, BookOpen, Calendar, Check, ChevronRight,
  Copy, Plus, Sparkles, TrendingUp, Users,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert, FlatList, Modal, RefreshControl,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD    = '#C9A84C';
const CREAM   = '#FAF7F2';

export default function CoordinatorDashboard() {
  const { user, profile } = useAuthStore();
  const router      = useRouter();
  const queryClient = useQueryClient();
  const firstName   = profile?.first_name ?? 'Coordinator';

  const [showCreate, setShowCreate]           = useState(false);
  const [className, setClassName]             = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const { data: classes = [], isLoading, refetch } = useQuery<Class[]>({
    queryKey: ['coordinator-classes', user?.id],
    queryFn: () => (user ? getClassesByCoordinator(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const { data: courses = [], refetch: refetchCatalog } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: getCourses,
  });

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
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
    const s = analytics?.stats;
    return [
      { label: 'Students',     value: `${s?.totalStudents ?? 0}`,        sub: 'In your classes', icon: Users      },
      { label: 'Classes',      value: `${s?.activeClasses ?? 0}`,         sub: 'Active cohorts',  icon: BookOpen   },
      { label: 'Completion',   value: `${s?.averageCompletionPct ?? 0}%`, sub: 'Avg. progress',   icon: TrendingUp },
      { label: 'Certificates', value: `${s?.certificates ?? 0}`,          sub: 'Issued',          icon: Award      },
    ];
  }, [analytics?.stats]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const createClassMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!className.trim()) throw new Error('Class name required');
      if (selectedCourseIds.length === 0) throw new Error('Select at least one course');
      return createClass({
        created_by: user.id,
        course_ids: selectedCourseIds,
        name: className.trim(),
      });
    },
    onSuccess: (createdClass) => {
      if (!createdClass) { Alert.alert('Could not create class', 'Please try again.'); return; }
      queryClient.invalidateQueries({ queryKey: ['coordinator-classes', user?.id] });
      const courseNames = courses
        .filter(c => selectedCourseIds.includes(c.id))
        .map(c => c.title)
        .join(', ');
      setClassName('');
      setSelectedCourseIds([]);
      setShowCreate(false);
      Alert.alert(
        'Class created ✓',
        `Join code: ${createdClass.join_code}\n\nCourses: ${courseNames}`
      );
    },
    onError: (e) => Alert.alert('Could not create class', e instanceof Error ? e.message : 'Please try again.'),
  });

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
              backgroundColor: EMERALD, margin: 16, borderRadius: 20,
              padding: 24, borderWidth: 1, borderColor: `${GOLD}40`, overflow: 'hidden',
            }}>
              <View style={{ position: 'absolute', right: -8, top: 8, opacity: 0.05 }} pointerEvents="none">
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
                Create classes, assign multiple courses, share one join code, and track learner progress.
              </Text>
              <TouchableOpacity
                onPress={() => { setClassName(''); setSelectedCourseIds([]); setShowCreate(true); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD, borderRadius: 12, paddingVertical: 13, gap: 8 }}
                activeOpacity={0.87}
              >
                <Plus size={16} color={EMERALD} strokeWidth={2.5} />
                <Text style={{ color: EMERALD, fontWeight: '700', fontSize: 14 }}>Create New Class</Text>
              </TouchableOpacity>
            </View>

            {/* ── Stats ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12 }}>
                At a Glance
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {stats.map((stat) => (
                  <View key={stat.label} style={{ width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E8DFD0' }}>
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
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD0' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${EMERALD}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Users size={28} color={EMERALD} strokeWidth={1.5} />
              </View>
              <Text style={{ color: EMERALD, fontSize: 18, fontWeight: '300', marginBottom: 8 }}>No classes yet</Text>
              <Text style={{ color: '#8B7355', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                Create a class, assign multiple courses, and share one join code with your students.
              </Text>
              <TouchableOpacity
                onPress={() => { setClassName(''); setSelectedCourseIds([]); setShowCreate(true); }}
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
            style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E8DFD0' }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: EMERALD, fontSize: 16, fontWeight: '400', letterSpacing: -0.2 }} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Join Code', `Share this code:\n\n${item.join_code}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${GOLD}15`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: `${GOLD}40` }}
                activeOpacity={0.75}
              >
                <Text style={{ color: GOLD, fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>{item.join_code}</Text>
                <Copy size={12} color={GOLD} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EBE3' }}>
              <Calendar size={13} color="#b0a898" />
              <Text style={{ color: '#b0a898', fontSize: 12, marginLeft: 5, flex: 1 }}>
                {new Date(item.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={13} color="#b0a898" />
                <Text style={{ color: '#b0a898', fontSize: 12 }}>View class</Text>
                <ChevronRight size={16} color={GOLD} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ══════════════════════════════════════
          CREATE CLASS MODAL
      ══════════════════════════════════════ */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => !createClassMutation.isPending && setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40, maxHeight: '90%' }}>

            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#E8DFD0', borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: `${EMERALD}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Plus size={20} color={EMERALD} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ color: EMERALD, fontWeight: '600', fontSize: 17 }}>Create a class</Text>
                <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300' }}>One join code · multiple courses</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Class name */}
              <Text style={{ color: '#8B7355', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
                CLASS NAME
              </Text>
              <TextInput
                value={className}
                onChangeText={setClassName}
                placeholder="e.g. Grade 11 Agriculture"
                placeholderTextColor="#C4B89A"
                style={{ backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: EMERALD, marginBottom: 24 }}
              />

              {/* Course multi-select */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#8B7355', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
                  SELECT COURSES
                </Text>
                {selectedCourseIds.length > 0 && (
                  <View style={{ backgroundColor: `${EMERALD}12`, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${EMERALD}25` }}>
                    <Text style={{ color: EMERALD, fontSize: 10, fontWeight: '700' }}>
                      {selectedCourseIds.length} selected
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ color: '#b0a898', fontSize: 12, fontWeight: '300', marginBottom: 14 }}>
                Students joining with one code get access to all selected courses.
              </Text>

              {courses.length === 0 ? (
                <Text style={{ color: '#b0a898', fontSize: 13, marginBottom: 16 }}>
                  No published courses available yet.
                </Text>
              ) : (
                <View style={{ marginBottom: 24, gap: 8 }}>
                  {courses.map((course) => {
                    const selected = selectedCourseIds.includes(course.id);
                    return (
                      <TouchableOpacity
                        key={course.id}
                        onPress={() => toggleCourse(course.id)}
                        style={{
                          borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
                          borderWidth: 1.5,
                          borderColor: selected ? EMERALD : '#E8DFD0',
                          backgroundColor: selected ? `${EMERALD}08` : CREAM,
                          flexDirection: 'row', alignItems: 'center', gap: 12,
                        }}
                        activeOpacity={0.8}
                      >
                        {/* Checkbox */}
                        <View style={{
                          width: 22, height: 22, borderRadius: 7, borderWidth: 1.5,
                          borderColor: selected ? EMERALD : '#C4B89A',
                          backgroundColor: selected ? EMERALD : 'transparent',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {selected && <Check size={13} color="#fff" strokeWidth={2.5} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: selected ? EMERALD : '#57534e', fontSize: 14, fontWeight: selected ? '500' : '300' }} numberOfLines={1}>
                            {course.title}
                          </Text>
                          {course.description ? (
                            <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                              {course.description}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Buttons */}
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => createClassMutation.mutate()}
                  disabled={createClassMutation.isPending || selectedCourseIds.length === 0 || !className.trim()}
                  style={{
                    backgroundColor:
                      createClassMutation.isPending || selectedCourseIds.length === 0 || !className.trim()
                        ? `${EMERALD}50`
                        : EMERALD,
                    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                    flexDirection: 'row', justifyContent: 'center', gap: 8,
                  }}
                  activeOpacity={0.87}
                >
                  <Plus size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {createClassMutation.isPending
                      ? 'Creating…'
                      : selectedCourseIds.length > 0
                      ? `Create class · ${selectedCourseIds.length} course${selectedCourseIds.length > 1 ? 's' : ''}`
                      : 'Create class'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowCreate(false); setSelectedCourseIds([]); setClassName(''); }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: '#8B7355', fontSize: 14, fontWeight: '300' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
