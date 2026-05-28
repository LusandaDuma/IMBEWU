/**
 * @fileoverview Coordinator — Class Detail
 * - Luxury emerald & gold UI
 * - Add student button removed (students join via join code)
 * - Remove student kept (coordinator privilege)
 * - Edit course removed (read-only)
 */

import {
  getClassById, getClassMembers, getCourseById,
  getCoursesForClass, getLessonsByCourse,
  removeCourseFromClass, removeStudentFromClass,
  updateClass, type ClassMember,
} from '@/services/supabase';
import type { Course, Lesson } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen, ChevronLeft, ChevronRight,
  Clock, Copy, Layers, Sparkles, UserMinus, Users,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD    = '#C9A84C';
const CREAM   = '#FAF7F2';
const RED     = '#dc2626';

export default function CoordinatorClassScreen() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const { id }      = useLocalSearchParams<{ id: string }>();
  const classId     = useMemo(() => (typeof id === 'string' ? id : ''), [id]);

  const [className, setClassName] = useState('');
  const [isActive, setIsActive]   = useState(true);

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClassById(classId),
    enabled: !!classId,
  });

  const { data: courseData } = useQuery({
    queryKey: ['class-course', classData?.course_id],
    queryFn: () => getCourseById(classData!.course_id),
    enabled: !!classData?.course_id,
  });

  const { data: classMembers = [] } = useQuery<ClassMember[]>({
    queryKey: ['class-members', classId],
    queryFn: () => getClassMembers(classId),
    enabled: !!classId,
  });

  const { data: linkedCourses = [], refetch: refetchCourses } = useQuery<Course[]>({
    queryKey: ['class-courses', classId],
    queryFn: () => getCoursesForClass(classId),
    enabled: !!classId,
  });

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['class-lessons', classData?.course_id],
    queryFn: () => getLessonsByCourse(classData!.course_id),
    enabled: !!classData?.course_id,
  });

  useFocusEffect(useCallback(() => {
    if (!classId) return;
    void queryClient.invalidateQueries({ queryKey: ['class', classId] });
    void queryClient.invalidateQueries({ queryKey: ['class-members', classId] });
    void queryClient.invalidateQueries({ queryKey: ['class-lessons'] });
    void queryClient.invalidateQueries({ queryKey: ['class-courses', classId] });
    void queryClient.invalidateQueries({ queryKey: ['class-course'] });
  }, [classId, queryClient]));

  useEffect(() => {
    if (!classData) return;
    setClassName(classData.name);
    setIsActive(classData.is_active);
  }, [classData?.id, classData?.name, classData?.is_active]);

  const updateClassMutation = useMutation({
    mutationFn: () => updateClass(classId, { name: className.trim(), is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-classes'] });
      Alert.alert('Saved ✓', 'Class details updated.');
    },
    onError: () => Alert.alert('Could not save', 'Please try again.'),
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => removeStudentFromClass(classId, studentId),
    onSuccess: (result) => {
      if (result === 'not-in-class') { Alert.alert('Not in class', 'Student is no longer in this class.'); return; }
      if (result !== 'removed') { Alert.alert('Could not remove', 'Please try again.'); return; }
      queryClient.invalidateQueries({ queryKey: ['class-members', classId] });
    },
    onError: () => Alert.alert('Could not remove student', 'Please try again.'),
  });

  const removeCourseMutation = useMutation({
    mutationFn: (courseId: string) => removeCourseFromClass(classId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-courses', classId] });
    },
    onError: () => Alert.alert('Could not remove course', 'Please try again.'),
  });

  const onRemoveCourse = (course: Course) => {
    if (linkedCourses.length <= 1) {
      Alert.alert('Cannot remove', 'A class must have at least one course.');
      return;
    }
    Alert.alert('Remove course', `Remove "${course.title}" from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCourseMutation.mutate(course.id) },
    ]);
  };

  const onRemoveStudent = (member: ClassMember) => {
    if (member.role !== 'student') return;
    const name = member.profile
      ? `${member.profile.first_name} ${member.profile.last_name}`.trim()
      : 'this student';
    Alert.alert('Remove student', `Remove ${name} from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeStudentMutation.mutate(member.user_id) },
    ]);
  };

  if (classLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={EMERALD} />
      </SafeAreaView>
    );
  }

  if (!classData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: EMERALD, fontSize: 18, fontWeight: '300', marginBottom: 16 }}>Class not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: EMERALD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const coordinatorCount = classMembers.filter(m => m.role === 'coordinator').length;
  const studentCount     = classMembers.filter(m => m.role === 'student').length;
  const totalMins        = lessons.reduce((s, l) => s + (l.duration_mins ?? 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={20} color={EMERALD} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: EMERALD, fontSize: 20, fontWeight: '300', letterSpacing: -0.3 }} numberOfLines={1}>
              {classData.name}
            </Text>
            <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300' }}>Class management</Text>
          </View>
          {/* Join code pill */}
          <TouchableOpacity
            onPress={() => Alert.alert('Join Code', `Share this code with students:\n\n${classData.join_code}`)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: `${GOLD}18`, borderRadius: 99,
              paddingHorizontal: 12, paddingVertical: 7,
              borderWidth: 1, borderColor: `${GOLD}40`,
            }}
            activeOpacity={0.75}
          >
            <Text style={{ color: GOLD, fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
              {classData.join_code}
            </Text>
            <Copy size={13} color={GOLD} />
          </TouchableOpacity>
        </View>

        {/* ── Hero card ── */}
        <View style={{
          backgroundColor: EMERALD, marginHorizontal: 16, marginBottom: 20,
          borderRadius: 20, padding: 24, borderWidth: 1, borderColor: `${GOLD}40`, overflow: 'hidden',
        }}>
          <View style={{ position: 'absolute', right: -8, top: 8, opacity: 0.05 }} pointerEvents="none">
            <Text style={{ fontSize: 90, fontWeight: '900', color: '#fff', letterSpacing: -4 }}>CL</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Sparkles size={12} color={GOLD} />
            <Text style={{ color: GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>
              {classData.is_active ? 'ACTIVE CLASS' : 'INACTIVE CLASS'}
            </Text>
          </View>

          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '400', marginBottom: 18, letterSpacing: -0.3 }}>
            {classData.name}
          </Text>

          {/* Stats pills */}
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
              <Users size={12} color={GOLD} />
              <Text style={{ color: GOLD, fontSize: 11, fontWeight: '600' }}>{studentCount} student{studentCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
              <BookOpen size={12} color="rgba(255,255,255,0.6)" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '300' }}>{lessons.length} lessons</Text>
            </View>
            {totalMins > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                <Clock size={12} color="rgba(255,255,255,0.6)" />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '300' }}>{totalMins} min total</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Class settings ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Class Settings
          </Text>
          <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300', marginBottom: 14 }}>
            Rename the class or toggle its active status.
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8DFD0', gap: 14 }}>
            <View>
              <Text style={{ color: '#8B7355', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>CLASS NAME</Text>
              <TextInput
                value={className}
                onChangeText={setClassName}
                placeholder="Class name"
                placeholderTextColor="#C4B89A"
                style={{ backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: EMERALD }}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: EMERALD, fontSize: 14, fontWeight: '400' }}>Active class</Text>
                <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300' }}>Students can join and learn</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#E8DFD0', true: `${EMERALD}80` }}
                thumbColor={isActive ? EMERALD : '#C4B89A'}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!className.trim()) { Alert.alert('Name required', 'Please enter a class name.'); return; }
                updateClassMutation.mutate();
              }}
              disabled={updateClassMutation.isPending}
              style={{ backgroundColor: updateClassMutation.isPending ? `${EMERALD}60` : EMERALD, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              activeOpacity={0.87}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {updateClassMutation.isPending ? 'Saving…' : 'Save changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Roster ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Students & Roster
          </Text>
          <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300', marginBottom: 14 }}>
            {studentCount} student{studentCount !== 1 ? 's' : ''} · {coordinatorCount} coordinator{coordinatorCount !== 1 ? 's' : ''} · Students join using the class code
          </Text>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E8DFD0', overflow: 'hidden' }}>
            {classMembers.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Users size={28} color="#E8DFD0" />
                <Text style={{ color: '#8B7355', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
                  No members yet. Share the join code{'\n'}
                  <Text style={{ color: GOLD, fontWeight: '700' }}>{classData.join_code}</Text>
                  {' '}with your students.
                </Text>
              </View>
            ) : (
              classMembers.map((member, i) => {
                const name = member.profile
                  ? `${member.profile.first_name} ${member.profile.last_name}`.trim()
                  : member.user_id;
                return (
                  <View key={member.id} style={{
                    flexDirection: 'row', alignItems: 'center', padding: 14,
                    borderBottomWidth: i < classMembers.length - 1 ? 1 : 0,
                    borderBottomColor: '#F0EBE3',
                  }}>
                    {/* Avatar */}
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: member.role === 'coordinator' ? `${EMERALD}15` : `${GOLD}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color: member.role === 'coordinator' ? EMERALD : GOLD, fontSize: 14, fontWeight: '600' }}>
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: EMERALD, fontSize: 14, fontWeight: '400' }}>{name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: member.role === 'coordinator' ? EMERALD : GOLD }} />
                        <Text style={{ color: '#8B7355', fontSize: 11 }}>
                          {member.role} · joined {new Date(member.joined_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>

                    {/* Remove student only */}
                    {member.role === 'student' && (
                      <TouchableOpacity
                        onPress={() => onRemoveStudent(member)}
                        disabled={removeStudentMutation.isPending}
                        style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecaca' }}
                        activeOpacity={0.8}
                      >
                        <UserMinus size={15} color={RED} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* ── Linked Courses ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: EMERALD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Linked Courses
          </Text>
          <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300', marginBottom: 14 }}>
            {linkedCourses.length} course{linkedCourses.length !== 1 ? 's' : ''} · all accessible with one join code
          </Text>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E8DFD0', overflow: 'hidden' }}>
            {linkedCourses.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <BookOpen size={28} color="#E8DFD0" />
                <Text style={{ color: '#8B7355', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
                  No courses linked yet.
                </Text>
              </View>
            ) : (
              linkedCourses.map((course, ci) => (
                <TouchableOpacity
                  key={course.id}
                  onPress={() => router.push(`/coordinator/course/${course.id}`)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 16,
                    borderBottomWidth: ci < linkedCourses.length - 1 ? 1 : 0,
                    borderBottomColor: '#F0EBE3',
                  }}
                >
                  {/* Number badge */}
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${EMERALD}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: `${EMERALD}20` }}>
                    <Text style={{ color: EMERALD, fontSize: 13, fontWeight: '600' }}>{ci + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: EMERALD, fontSize: 14, fontWeight: '400' }} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={{ color: '#8B7355', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                      {course.description ?? 'Tap to preview lessons'}
                    </Text>
                  </View>
                  {/* Remove course button (only if more than 1) */}
                  {linkedCourses.length > 1 && (
                    <TouchableOpacity
                      onPress={() => onRemoveCourse(course)}
                      style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecaca', marginRight: 6 }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '700' }}>−</Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${GOLD}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${GOLD}30` }}>
                    <ChevronRight size={14} color={GOLD} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
