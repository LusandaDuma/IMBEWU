/**
 * @fileoverview Coordinator — Available Courses — luxury emerald & gold theme.
 */

import { COURSE_LOGO_THUMB } from '@/constants/courseBranding';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getCourses } from '@/services/supabase';
import type { Course } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Layers, Sparkles } from 'lucide-react-native';
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD    = '#C9A84C';
const CREAM   = '#FAF7F2';

export default function CoordinatorCoursesScreen() {
  const router = useRouter();

  const { data: courses = [], isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: getCourses,
  });

  useRefetchOnFocus(refetch, true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={GOLD} />
        }

        ListHeaderComponent={
          <>
            {/* ── Hero banner ── */}
            <View style={{
              backgroundColor: EMERALD, margin: 16, borderRadius: 20,
              padding: 24, borderWidth: 1, borderColor: `${GOLD}40`,
            }}>
              <View style={{ position: 'absolute', right: 16, top: 16, opacity: 0.05 }} pointerEvents="none">
                <Text style={{ fontSize: 80, fontWeight: '900', color: '#fff', letterSpacing: -4 }}>CR</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Sparkles size={12} color={GOLD} />
                <Text style={{ color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
                  Course Catalogue
                </Text>
              </View>

              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300', marginBottom: 6, letterSpacing: -0.3 }}>
                Available Courses
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 }}>
                Browse all published courses and assign them to your classes.
              </Text>

              {/* Count pill */}
              {courses.length > 0 && (
                <View style={{
                  alignSelf: 'flex-start', marginTop: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                }}>
                  <Layers size={12} color={GOLD} />
                  <Text style={{ color: GOLD, fontSize: 11, fontWeight: '600' }}>
                    {courses.length} course{courses.length !== 1 ? 's' : ''} available
                  </Text>
                </View>
              )}
            </View>

            {/* Section label */}
            {courses.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
                  All Courses
                </Text>
              </View>
            )}
          </>
        }

        ListEmptyComponent={
          !isLoading ? (
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              <View style={{
                backgroundColor: '#fff', borderRadius: 20, padding: 32,
                alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD0',
              }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: `${EMERALD}10`, alignItems: 'center',
                  justifyContent: 'center', marginBottom: 16,
                }}>
                  <BookOpen size={28} color={EMERALD} strokeWidth={1.5} />
                </View>
                <Text style={{ color: EMERALD, fontSize: 18, fontWeight: '300', marginBottom: 8 }}>
                  No courses yet
                </Text>
                <Text style={{ color: '#8B7355', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  Ask your admin to publish courses so they appear here.
                </Text>
              </View>
            </View>
          ) : null
        }

        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/coordinator/course/${item.id}`)}
            activeOpacity={0.88}
            style={{
              marginHorizontal: 16, marginBottom: 12,
              backgroundColor: '#fff', borderRadius: 16,
              padding: 16, borderWidth: 1, borderColor: '#E8DFD0',
              flexDirection: 'row', alignItems: 'center',
            }}
          >
            {/* Thumbnail */}
            <View style={{
              width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
              backgroundColor: `${EMERALD}10`, alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Image
                source={COURSE_LOGO_THUMB}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            {/* Text */}
            <View style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
              <Text style={{ color: EMERALD, fontSize: 15, fontWeight: '500', letterSpacing: -0.2, marginBottom: 4 }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ color: '#8B7355', fontSize: 12, lineHeight: 18, fontWeight: '300' }} numberOfLines={2}>
                {item.description}
              </Text>

              {/* Published badge */}
              <View style={{
                alignSelf: 'flex-start', marginTop: 8,
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: `${EMERALD}08`, borderRadius: 99,
                paddingHorizontal: 8, paddingVertical: 3,
                borderWidth: 1, borderColor: `${EMERALD}20`,
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#22c55e' }} />
                <Text style={{ color: EMERALD, fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>
                  PUBLISHED
                </Text>
              </View>
            </View>

            {/* Arrow */}
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: `${GOLD}15`, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: `${GOLD}30`,
            }}>
              <ChevronRight size={16} color={GOLD} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
