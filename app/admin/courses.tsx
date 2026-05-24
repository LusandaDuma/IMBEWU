/**
 * @fileoverview Admin courses — luxury emerald & gold theme
 */

import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { deleteCourse, getAllCourses, updateCourse } from '@/services/supabase';
import type { Course } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Edit2, Eye, EyeOff, Plus, Sprout, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';
const DARK = '#022418';

type CourseFilter = 'all' | 'published' | 'unpublished';

export default function AdminCoursesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<CourseFilter>('all');

  const { data: courses = [], isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: getAllCourses,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      updateCourse(id, { is_published: !isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: (ok) => {
      if (!ok) { Alert.alert('Error', 'Failed to delete course.'); return; }
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
    },
    onError: () => Alert.alert('Error', 'Failed to delete course.'),
  });

  const filteredCourses = useMemo(() => {
    if (activeFilter === 'published') return courses.filter((c) => c.is_published);
    if (activeFilter === 'unpublished') return courses.filter((c) => !c.is_published);
    return courses;
  }, [activeFilter, courses]);

  const confirmDelete = (course: Course) => {
    Alert.alert('Delete Course', `Delete "${course.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCourseMutation.mutate(course.id) },
    ]);
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <View style={{
      backgroundColor: EMERALD,
      borderRadius: 20,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: `${GOLD}40`,
    }}>
      {/* Course Header */}
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{
            backgroundColor: `${GOLD}20`,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: `${GOLD}40`,
          }}>
            <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
              {item.is_published ? 'Published' : 'Draft'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.is_published ? '#22c55e' : '#94a3b8' }} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
              {item.is_published ? 'Live' : 'Hidden'}
            </Text>
          </View>
        </View>

        <Text style={{ color: 'white', fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginBottom: 8, lineHeight: 28 }}>
          {item.title}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 }} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      {/* Course Actions */}
      <View style={{
        backgroundColor: DARK,
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: `${GOLD}20`,
      }}>
        <TouchableOpacity
          onPress={() => togglePublishMutation.mutate({ id: item.id, isPublished: item.is_published })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          activeOpacity={0.85}
        >
          {item.is_published
            ? <EyeOff size={16} color={GOLD} />
            : <Eye size={16} color={GOLD} />
          }
          <Text style={{ color: GOLD, fontSize: 12, fontWeight: '600' }}>
            {item.is_published ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity
            onPress={() => router.push(`/admin/courses/${item.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            activeOpacity={0.85}
          >
            <Edit2 size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => confirmDelete(item)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            activeOpacity={0.85}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
          Curriculum
        </Text>
        <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
          Course Management
        </Text>
      </View>

      {/* Filters */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
        {(['all', 'published', 'unpublished'] as CourseFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeFilter === f ? EMERALD : 'white',
              borderWidth: 1,
              borderColor: activeFilter === f ? EMERALD : '#E8DFD0',
            }}
            activeOpacity={0.85}
          >
            <Text style={{
              color: activeFilter === f ? GOLD : DARK,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'capitalize',
            }}>
              {f === 'all' ? 'All' : f === 'published' ? 'Published' : 'Drafts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourse}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={GOLD} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Sprout size={48} color="#C9A84C" />
            <Text style={{ color: '#8B7355', marginTop: 16, fontSize: 15 }}>No courses yet</Text>
          </View>
        }
      />

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
