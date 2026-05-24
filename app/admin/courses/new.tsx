/**
 * @fileoverview Create new course — luxury emerald & gold theme
 */

import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { createCourse } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

const INSTRUCTORS = ['Dr. N. Mabaso', 'Elder Joseph K.', 'Marta Alvarez', 'Prof. S. Dlamini'];
const CATEGORIES = ['Soil Science', 'Water Systems', 'Agroforestry', 'Indigenous Harvesting', 'Soil Health', 'Regenerative Farming'];
const LESSON_COUNTS = ['6', '8', '10', '12', '15', '20'];

export default function CreateCourseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState(INSTRUCTORS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [lessonCount, setLessonCount] = useState('10');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const createdCourse = await createCourse({
        title: title.trim(),
        description: description.trim(),
        offline_url: null,
        created_by: user.id,
        is_published: false,
      });
      if (!createdCourse) throw new Error('Course could not be created. Check permissions and try again.');
      return createdCourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
      Alert.alert('Published', 'Course has been added to the catalog!');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create course.');
    },
  });

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Fields', 'Please fill in the course title and description.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 20,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E8DFD0',
              marginRight: 14,
            }}
            activeOpacity={0.85}
          >
            <ChevronLeft size={20} color={DARK} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
              Curriculum
            </Text>
            <Text style={{ color: DARK, fontSize: 24, fontWeight: '300', fontFamily: 'serif' }}>
              Design New Course
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 20,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: '#E8DFD0',
          marginBottom: 16,
        }}>
          {/* Header accent */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F0EAE0',
          }}>
            <Sparkles size={16} color={GOLD} />
            <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' }}>
              Course Details
            </Text>
          </View>

          {/* Course Title */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>
              Course Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Companion Planting Dynamics & Yield Optimizers"
              placeholderTextColor="#C4B89A"
              style={{
                backgroundColor: CREAM,
                borderWidth: 1,
                borderColor: '#E8DFD0',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: DARK,
              }}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what learners will discover and cultivate..."
              placeholderTextColor="#C4B89A"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: CREAM,
                borderWidth: 1,
                borderColor: '#E8DFD0',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: DARK,
                minHeight: 100,
              }}
            />
          </View>

          {/* Instructor */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>
              Academy Instructor
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                {INSTRUCTORS.map((i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setInstructor(i)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: instructor === i ? EMERALD : CREAM,
                      borderWidth: 1,
                      borderColor: instructor === i ? EMERALD : '#E8DFD0',
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: instructor === i ? GOLD : '#8B7355', fontSize: 12, fontWeight: '600' }}>
                      {i}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Category */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>
              Agro-Subject Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: category === c ? EMERALD : CREAM,
                    borderWidth: 1,
                    borderColor: category === c ? EMERALD : '#E8DFD0',
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: category === c ? GOLD : '#8B7355', fontSize: 12, fontWeight: '600' }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Lesson Count */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>
              Lessons Count
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LESSON_COUNTS.map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setLessonCount(n)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: lessonCount === n ? EMERALD : CREAM,
                    borderWidth: 1,
                    borderColor: lessonCount === n ? EMERALD : '#E8DFD0',
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: lessonCount === n ? GOLD : '#8B7355', fontSize: 13, fontWeight: '700' }}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Info note */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 12, lineHeight: 18 }}>
            After publishing, you can add lessons and quizzes from the course detail page.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createMutation.isPending}
            style={{
              backgroundColor: createMutation.isPending ? `${EMERALD}80` : EMERALD,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: `${GOLD}40`,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: GOLD, fontWeight: '700', fontSize: 15, letterSpacing: 0.5 }}>
              {createMutation.isPending ? 'Publishing...' : 'Publish to Catalog'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E8DFD0',
              backgroundColor: 'white',
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#8B7355', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
