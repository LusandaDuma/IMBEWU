/**
 * @fileoverview Coordinator — Course Detail (read-only view).
 * Coordinators can view course info and lessons but cannot edit anything.
 */

import { asSingleParam } from '@/lib/expoParams';
import { getCourseById, getLessonsByCourse } from '@/services/supabase';
import type { Lesson } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen, ChevronLeft, ChevronRight,
  Clock, Eye, Layers, Sparkles,
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator, FlatList, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD    = '#C9A84C';
const CREAM   = '#FAF7F2';

export default function CoordinatorCourseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const courseId = useMemo(() => asSingleParam(id), [id]);

  const { data: course, isLoading } = useQuery({
    queryKey: ['coordinator-course', courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !!courseId,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['coordinator-course-lessons', courseId],
    queryFn: () => getLessonsByCourse(courseId),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={EMERALD} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <BookOpen size={40} color={EMERALD} strokeWidth={1.5} />
        <Text style={{ color: EMERALD, fontSize: 18, fontWeight: '300', marginTop: 16, marginBottom: 8 }}>Course not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: EMERALD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalMins = lessons.reduce((sum, l) => sum + (l.duration_mins ?? 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}

        ListHeaderComponent={
          <>
            {/* ── Header row ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={20} color={EMERALD} strokeWidth={1.5} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: EMERALD, fontSize: 20, fontWeight: '300', letterSpacing: -0.3 }} numberOfLines={1}>
                  Course Detail
                </Text>
                <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300' }}>View only</Text>
              </View>

              {/* View-only badge */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: `${GOLD}18`, borderRadius: 99,
                paddingHorizontal: 10, paddingVertical: 5,
                borderWidth: 1, borderColor: `${GOLD}35`,
              }}>
                <Eye size={12} color={GOLD} strokeWidth={2} />
                <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>VIEW ONLY</Text>
              </View>
            </View>

            {/* ── Hero card ── */}
            <View style={{
              backgroundColor: EMERALD, marginHorizontal: 16, marginBottom: 16,
              borderRadius: 20, padding: 24, borderWidth: 1, borderColor: `${GOLD}40`,
              overflow: 'hidden',
            }}>
              {/* Watermark */}
              <View style={{ position: 'absolute', right: -8, top: 8, opacity: 0.05 }} pointerEvents="none">
                <Text style={{ fontSize: 90, fontWeight: '900', color: '#fff', letterSpacing: -4 }}>CO</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Sparkles size={12} color={GOLD} />
                <Text style={{ color: GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>
                  PUBLISHED COURSE
                </Text>
              </View>

              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '400', lineHeight: 28, marginBottom: 10, letterSpacing: -0.3 }}>
                {course.title}
              </Text>

              {course.description ? (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '300', lineHeight: 20, marginBottom: 20 }}>
                  {course.description}
                </Text>
              ) : null}

              {/* Stats pills */}
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                }}>
                  <Layers size={12} color={GOLD} />
                  <Text style={{ color: GOLD, fontSize: 11, fontWeight: '600' }}>
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {totalMins > 0 && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99,
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                  }}>
                    <Clock size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '300' }}>
                      {totalMins} min total
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Lessons heading ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
              <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 }}>
                Lessons
              </Text>
              <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300' }}>
                Tap a lesson to preview its content.
              </Text>
            </View>

            {/* Loading state */}
            {lessonsLoading && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={EMERALD} />
              </View>
            )}
          </>
        }

        ListEmptyComponent={
          !lessonsLoading ? (
            <View style={{
              marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16,
              padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD0',
            }}>
              <BookOpen size={28} color="#E8DFD0" strokeWidth={1.5} />
              <Text style={{ color: '#8B7355', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
                No lessons have been added to this course yet.
              </Text>
            </View>
          ) : null
        }

        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => router.push(`/coordinator/course/${courseId}/lesson/${item.id}`)}
            activeOpacity={0.88}
            style={{
              marginHorizontal: 16, marginBottom: 10,
              backgroundColor: '#fff', borderRadius: 16,
              padding: 16, borderWidth: 1, borderColor: '#E8DFD0',
              flexDirection: 'row', alignItems: 'center',
            }}
          >
            {/* Number badge */}
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: `${EMERALD}10`, alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginRight: 14,
              borderWidth: 1, borderColor: `${EMERALD}20`,
            }}>
              <Text style={{ color: EMERALD, fontSize: 13, fontWeight: '600' }}>
                {(item.order_index ?? index) + 1}
              </Text>
            </View>

            {/* Content */}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: EMERALD, fontSize: 14, fontWeight: '400', lineHeight: 20 }} numberOfLines={2}>
                {item.title}
              </Text>
              {item.duration_mins != null && item.duration_mins > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Clock size={11} color="#b0a898" />
                  <Text style={{ color: '#b0a898', fontSize: 11 }}>{item.duration_mins} min</Text>
                </View>
              )}
            </View>

            {/* Arrow */}
            <View style={{
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: `${GOLD}15`, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: `${GOLD}30`,
            }}>
              <ChevronRight size={15} color={GOLD} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
