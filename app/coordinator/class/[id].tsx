import { Button } from '@/components/shared';
import { fieldPlain } from '@/constants/theme';
import {
  addCourseToClass,
  addStudentToClass,
  getClassById,
  getClassMembers,
  getCourses,
  getCoursesByClass,
  getLessonsByCourse,
  removeCourseFromClass,
  removeStudentFromClass,
  searchStudentsByName,
  type StudentSearchResult,
  updateClass,
} from '@/services/supabase';
import type { ClassMember, Course, Lesson } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, ChevronRight, Copy, Plus, Trash2, Users } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD    = '#C9A84C';

export default function CoordinatorClassScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const classId = useMemo(() => (typeof id === 'string' ? id : ''), [id]);

  const [className, setClassName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [studentSearchText, setStudentSearchText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClassById(classId),
    enabled: !!classId,
  });

  const { data: linkedCourses = [] } = useQuery<Course[]>({
    queryKey: ['class-courses', classId],
    queryFn: () => getCoursesByClass(classId),
    enabled: !!classId,
  });

  const { data: allCourses = [] } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: getCourses,
    enabled: showCourseModal,
  });

  const { data: classMembers = [] } = useQuery<ClassMember[]>({
    queryKey: ['class-members', classId],
    queryFn: () => getClassMembers(classId),
    enabled: !!classId,
  });

  // Lessons for ALL linked courses combined
  const { data: allLessons = [] } = useQuery<Lesson[]>({
    queryKey: ['class-lessons-multi', linkedCourses.map((c) => c.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        linkedCourses.map((c) => getLessonsByCourse(c.id))
      );
      return results.flat();
    },
    enabled: linkedCourses.length > 0,
  });

  const { data: studentSearchResults = [], isFetching: searchingStudents } = useQuery<StudentSearchResult[]>({
    queryKey: ['student-search', studentSearchText],
    queryFn: () => searchStudentsByName(studentSearchText),
    enabled: studentSearchText.trim().length >= 2,
  });

  useFocusEffect(
    useCallback(() => {
      if (!classId) return;
      void queryClient.invalidateQueries({ queryKey: ['class', classId] });
      void queryClient.invalidateQueries({ queryKey: ['class-members', classId] });
      void queryClient.invalidateQueries({ queryKey: ['class-courses', classId] });
      void queryClient.invalidateQueries({ queryKey: ['class-lessons-multi'] });
    }, [classId, queryClient])
  );

  useEffect(() => {
    if (!classData) return;
    setClassName(classData.name);
    setIsActive(classData.is_active);
  }, [classData?.id, classData?.name, classData?.is_active]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateClassMutation = useMutation({
    mutationFn: async () => updateClass(classId, { name: className.trim(), is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-classes'] });
      Alert.alert('Saved', 'Class details updated.');
    },
    onError: () => Alert.alert('Could not save', 'Please try again.'),
  });

  const addCourseMutation = useMutation({
    mutationFn: async (courseId: string) => addCourseToClass(classId, courseId),
    onSuccess: (result, courseId) => {
      if (result === 'already-linked') {
        Alert.alert('Already linked', 'This course is already linked to this class.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['class-courses', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-lessons-multi'] });
      setShowCourseModal(false);
    },
    onError: () => Alert.alert('Could not add course', 'Please try again.'),
  });

  const removeCourseMutation = useMutation({
    mutationFn: async (courseId: string) => removeCourseFromClass(classId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-courses', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-lessons-multi'] });
    },
    onError: () => Alert.alert('Could not remove course', 'Please try again.'),
  });

  const addStudentMutation = useMutation({
    mutationFn: async () => addStudentToClass(classId, selectedStudent!.id),
    onSuccess: (result) => {
      if (result === 'already-enrolled') {
        Alert.alert('Already enrolled', 'This student is already enrolled in this course and cannot be added to another class for it.');
        return;
      }
      if (result === 'already-in-class') {
        Alert.alert('Already in class', 'This student is already in this class.');
        return;
      }
      if (result !== 'joined') {
        Alert.alert('Could not add student', 'Please try again.');
        return;
      }
      setStudentSearchText('');
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['class-members', classId] });
      Alert.alert('Student added', 'Student added to class and enrolled in the course.');
    },
    onError: () => Alert.alert('Could not add student', 'Please try again.'),
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => removeStudentFromClass(classId, studentId),
    onSuccess: (result) => {
      if (result === 'not-in-class') {
        Alert.alert('Student not in class', 'This student is no longer part of this class.');
        return;
      }
      if (result !== 'removed') {
        Alert.alert('Could not remove student', 'Please try again.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['class-members', classId] });
      Alert.alert('Student removed', 'Student has been removed from the class.');
    },
    onError: () => Alert.alert('Could not remove student', 'Please try again.'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onSaveClass = () => {
    if (!className.trim()) {
      Alert.alert('Class name required', 'Please provide a class name.');
      return;
    }
    updateClassMutation.mutate();
  };

  const onAddStudent = () => {
    if (!selectedStudent) {
      Alert.alert('Select a student', 'Search by name or surname and select a student.');
      return;
    }
    addStudentMutation.mutate();
  };

  const onRemoveStudent = (member: ClassMember) => {
    if (member.role !== 'student') return;
    const studentName = member.profile
      ? `${member.profile.first_name} ${member.profile.last_name}`.trim()
      : 'this student';
    Alert.alert('Remove student', `Remove ${studentName} from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeStudentMutation.mutate(member.user_id) },
    ]);
  };

  const onRemoveCourse = (course: Course) => {
    Alert.alert('Remove course', `Remove "${course.title}" from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCourseMutation.mutate(course.id) },
    ]);
  };

  // ── Loading / empty states ────────────────────────────────────────────────
  if (classLoading) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-earth-600">Loading class…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!classData) {
    return (
      <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Text className="text-earth-800 text-lg font-semibold mb-2">Class not found</Text>
          <Button label="Back to classes" onPress={() => router.back()} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const coordinatorCount = classMembers.filter((m) => m.role === 'coordinator').length;
  const studentCount = classMembers.filter((m) => m.role === 'student').length;

  // Courses not yet linked (for the picker modal)
  const unlinkedCourses = allCourses.filter(
    (c) => !linkedCourses.some((lc) => lc.id === c.id)
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>

        {/* Header */}
        <View className="px-5 py-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-earth-900/5 items-center justify-center"
          >
            <ChevronLeft size={22} color="#1c1917" strokeWidth={1.5} />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text className="text-black text-xl font-semibold">{classData.name}</Text>
            <Text className="text-earth-800 text-sm">Class management</Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Join code', classData.join_code)}
            className="px-0 py-1 border-b border-accent-600/40 flex-row items-center"
          >
            <Text className="text-accent-800 font-bold mr-2">{classData.join_code}</Text>
            <Copy size={14} color="#b45309" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>

          {/* ── Class details ── */}
          <View className="mb-4 pb-4 border-b border-earth-400/40">
            <Text className="text-earth-900 font-semibold mb-3">Class details</Text>
            <TextInput
              value={className}
              onChangeText={setClassName}
              placeholder="Class name"
              placeholderTextColor="#a8a29e"
              className={`${fieldPlain} mb-3`}
            />
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-earth-700">Active class</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
            <Button
              label={updateClassMutation.isPending ? 'Saving...' : 'Save class'}
              onPress={onSaveClass}
              disabled={updateClassMutation.isPending}
              fullWidth
            />
          </View>

          {/* ── Courses ── */}
          <View className="mb-4 pb-4 border-b border-earth-400/40">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <BookOpen size={18} color={EMERALD} />
                <Text className="text-earth-900 font-semibold ml-2">Courses</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCourseModal(true)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: EMERALD, borderRadius: 99,
                  paddingHorizontal: 12, paddingVertical: 6,
                }}
              >
                <Plus size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Add course</Text>
              </TouchableOpacity>
            </View>

            {linkedCourses.length === 0 ? (
              <Text className="text-earth-500 text-sm">No courses linked yet. Tap "Add course" to link one.</Text>
            ) : (
              linkedCourses.map((course, ci) => (
                <View
                  key={course.id}
                  style={{
                    backgroundColor: '#fff', borderRadius: 12,
                    padding: 12, marginBottom: 8,
                    borderWidth: 1, borderColor: '#E8DFD0',
                    flexDirection: 'row', alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: EMERALD, fontWeight: '500', fontSize: 14 }} numberOfLines={1}>
                      {course.title}
                    </Text>
                    {course.description ? (
                      <Text style={{ color: '#8B7355', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                        {course.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/coordinator/course/${course.id}`)}
                      style={{
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: `${GOLD}15`, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: `${GOLD}30`,
                      }}
                    >
                      <ChevronRight size={14} color={GOLD} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onRemoveCourse(course)}
                      style={{
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: '#fca5a5',
                      }}
                    >
                      <Trash2 size={13} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Lessons summary */}
            {allLessons.length > 0 && (
              <Text className="text-earth-500 text-xs mt-2">
                {allLessons.length} lesson{allLessons.length !== 1 ? 's' : ''} across all linked courses
              </Text>
            )}
          </View>

          {/* ── Students and roster ── */}
          <View className="mb-4 pb-4 border-b border-earth-400/40">
            <View className="flex-row items-center mb-2">
              <Users size={18} color="#166534" />
              <Text className="text-earth-900 font-semibold ml-2">Students and roster</Text>
            </View>
            <Text className="text-earth-600 text-sm mb-3">
              {studentCount} students · {coordinatorCount} coordinators
            </Text>
            <TextInput
              value={studentSearchText}
              onChangeText={(value) => {
                setStudentSearchText(value);
                setSelectedStudent(null);
              }}
              placeholder="Search by name or surname"
              placeholderTextColor="#a8a29e"
              className={`${fieldPlain} mb-3`}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {selectedStudent ? (
              <View className="mb-3 py-2 border-b border-primary-500/30">
                <Text className="text-primary-800 text-sm font-medium">
                  Selected: {selectedStudent.first_name} {selectedStudent.last_name}
                </Text>
              </View>
            ) : null}
            {studentSearchText.trim().length >= 2 ? (
              <View className="mb-3 overflow-hidden border-b border-earth-400/30">
                {studentSearchResults.map((student, si) => (
                  <TouchableOpacity
                    key={student.id}
                    onPress={() => {
                      setSelectedStudent(student);
                      setStudentSearchText(`${student.first_name} ${student.last_name}`);
                    }}
                    className={`px-0 py-3 ${si < studentSearchResults.length - 1 ? 'border-b border-earth-400/30' : ''}`}
                  >
                    <Text className="text-earth-900 font-medium">
                      {student.first_name} {student.last_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {searchingStudents ? (
                  <Text className="text-earth-500 text-sm px-4 py-3">Searching…</Text>
                ) : null}
                {!searchingStudents && studentSearchResults.length === 0 ? (
                  <Text className="text-earth-500 text-sm px-4 py-3">No students found.</Text>
                ) : null}
              </View>
            ) : null}
            <Button
              label={addStudentMutation.isPending ? 'Adding...' : 'Add student'}
              onPress={onAddStudent}
              disabled={addStudentMutation.isPending}
              fullWidth
            />
            <View className="mt-4">
              {classMembers.map((member, mi) => (
                <View
                  key={member.id}
                  className={`py-2 ${mi < classMembers.length - 1 ? 'border-b border-earth-100/80' : ''}`}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-earth-900 font-medium">
                        {member.profile
                          ? `${member.profile.first_name} ${member.profile.last_name}`
                          : member.user_id}
                      </Text>
                      <Text className="text-earth-500 text-xs">
                        {member.role} · joined {new Date(member.joined_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {member.role === 'student' ? (
                      <Button
                        label={removeStudentMutation.isPending ? 'Removing...' : 'Remove'}
                        variant="danger"
                        size="sm"
                        onPress={() => onRemoveStudent(member)}
                        disabled={removeStudentMutation.isPending}
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Lessons across all courses ── */}
          {allLessons.length > 0 && (
            <View className="pt-1">
              <View className="flex-row items-center mb-3">
                <BookOpen size={18} color="#166534" />
                <Text className="text-earth-900 font-semibold ml-2">All lessons</Text>
              </View>
              {linkedCourses.map((course) => {
                const courseLessons = allLessons.filter((l) => l.course_id === course.id);
                if (courseLessons.length === 0) return null;
                return (
                  <View key={course.id} className="mb-4">
                    <Text style={{ color: EMERALD, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                      {course.title}
                    </Text>
                    {courseLessons.map((lesson, li) => (
                      <View
                        key={lesson.id}
                        className={`py-2 ${li < courseLessons.length - 1 ? 'border-b border-earth-100/80' : ''}`}
                      >
                        <Text className="text-earth-900">{lesson.order_index}. {lesson.title}</Text>
                        <Text className="text-earth-500 text-xs">{lesson.duration_mins || 0} mins</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* ── Course picker modal ── */}
      <Modal
        visible={showCourseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingVertical: 16,
            borderBottomWidth: 1, borderBottomColor: '#E8DFD0',
          }}>
            <Text style={{ color: EMERALD, fontSize: 18, fontWeight: '600' }}>Add a course</Text>
            <TouchableOpacity onPress={() => setShowCourseModal(false)}>
              <Text style={{ color: '#8B7355', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {unlinkedCourses.length === 0 ? (
              <Text style={{ color: '#8B7355', textAlign: 'center', marginTop: 32 }}>
                All available courses are already linked to this class.
              </Text>
            ) : (
              unlinkedCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  onPress={() => addCourseMutation.mutate(course.id)}
                  disabled={addCourseMutation.isPending}
                  style={{
                    backgroundColor: '#fff', borderRadius: 14,
                    padding: 16, marginBottom: 10,
                    borderWidth: 1, borderColor: '#E8DFD0',
                    flexDirection: 'row', alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: EMERALD, fontWeight: '500', fontSize: 15 }}>{course.title}</Text>
                    {course.description ? (
                      <Text style={{ color: '#8B7355', fontSize: 12, marginTop: 3 }} numberOfLines={2}>
                        {course.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: `${EMERALD}10`, alignItems: 'center', justifyContent: 'center',
                    marginLeft: 12, borderWidth: 1, borderColor: `${EMERALD}20`,
                  }}>
                    <Plus size={16} color={EMERALD} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </LinearGradient>
  );
}
