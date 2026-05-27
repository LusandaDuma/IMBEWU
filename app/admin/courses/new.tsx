/**
 * @fileoverview Create new course — luxury UI with full AI generation
 * (course + 8 lessons saved directly to Supabase, no edge function).
 */

import { fieldPlain } from '@/constants/theme';
import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { generateCourseWithAI } from '@/services/lessonGenerationService';
import { createLesson } from '@/services/lessonService';
import { createCourse } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, CheckCircle, ChevronLeft, List, Save, Sparkles } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function LessonPreviewCard({ index, title }: { index: number; title: string }) {
  return (
    <View className="flex-row items-start py-3 border-b border-earth-400/20">
      <View className="w-7 h-7 rounded-full bg-primary-100 items-center justify-center mr-3 flex-shrink-0 mt-0.5">
        <Text className="text-primary-700 text-xs font-medium">{index + 1}</Text>
      </View>
      <Text className="flex-1 text-earth-800 text-sm font-light leading-5">{title}</Text>
    </View>
  );
}

function StepRow({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <View className="flex-row items-center py-2.5">
      <View
        className="w-6 h-6 rounded-full items-center justify-center mr-3 flex-shrink-0"
        style={{ backgroundColor: done ? '#dcfce7' : active ? '#f0fdf4' : '#f5f5f4' }}
      >
        {done
          ? <CheckCircle size={14} color="#16a34a" strokeWidth={2} />
          : active
          ? <ActivityIndicator size="small" color="#16a34a" />
          : <View className="w-2 h-2 rounded-full bg-earth-300" />}
      </View>
      <Text className={`text-sm font-light flex-1 ${done ? 'text-primary-700' : active ? 'text-earth-900' : 'text-earth-400'}`}>
        {label}
      </Text>
    </View>
  );
}

export default function CreateCourseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLessons, setGeneratedLessons] = useState<{ title: string; summary: string; content: string; duration_mins: number }[]>([]);
  const [progressMessage, setProgressMessage] = useState('');
  const [saveStep, setSaveStep] = useState<'idle' | 'generating' | 'saving-course' | 'saving-lessons' | 'done'>('idle');
  const [savedLessonCount, setSavedLessonCount] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (toValue: number) => {
    Animated.timing(progressAnim, { toValue, duration: 400, useNativeDriver: false }).start();
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const created = await createCourse({
        title: title.trim(),
        description: description.trim(),
        offline_url: null,
        created_by: user.id,
        is_published: false,
      });
      if (!created) throw new Error('Course could not be created. Check permissions and try again.');
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      invalidateAllCourseCatalogQueries(queryClient);
      Alert.alert('Course created', 'You can now add lessons from the course detail page.');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create course.');
    },
  });

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Please fill in both the title and description.');
      return;
    }
    createMutation.mutate();
  };

  const onGenerateAndSave = async () => {
    const topic = aiTopic.trim();
    if (!topic) { Alert.alert('Topic required', 'Enter a topic to generate a course.'); return; }
    if (!user) { Alert.alert('Not authenticated', 'Please sign in again.'); return; }

    setIsGenerating(true);
    setSaveStep('generating');
    setGeneratedLessons([]);
    setSavedLessonCount(0);
    animateProgress(10);

    try {
      const result = await generateCourseWithAI({
        topic,
        onProgress: (msg) => setProgressMessage(msg),
      });

      if (!result.ok) {
        Alert.alert('Generation failed', result.error);
        setSaveStep('idle');
        return;
      }

      animateProgress(40);
      setGeneratedLessons(result.course.lessons);

      setSaveStep('saving-course');
      setProgressMessage('Saving course to database…');
      animateProgress(50);

      const created = await createCourse({
        title: result.course.title,
        description: result.course.description,
        offline_url: null,
        created_by: user.id,
        is_published: false,
      });
      if (!created) throw new Error('Failed to save course. Check permissions.');

      setSaveStep('saving-lessons');
      const total = result.course.lessons.length;

      for (let i = 0; i < total; i++) {
        const lesson = result.course.lessons[i];
        setProgressMessage(`Saving lesson ${i + 1} of ${total}…`);
        animateProgress(50 + Math.round(((i + 1) / total) * 45));

        const res = await createLesson({
          course_id: created.id,
          order_index: i,
          title: lesson.title,
          description: lesson.summary || null,
          content: lesson.content || null,
          video_url: null,
          duration_mins: lesson.duration_mins,
        });
        if (res.error) throw new Error(`Lesson ${i + 1}: ${res.error}`);
        setSavedLessonCount(i + 1);
      }

      animateProgress(100);
      setSaveStep('done');
      setProgressMessage('');

      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-lessons', created.id] });
      invalidateAllCourseCatalogQueries(queryClient);

      setTimeout(() => {
        setAiModalVisible(false);
        setSaveStep('idle');
        router.replace(`/admin/courses/${created.id}`);
      }, 1800);

    } catch (e) {
      setSaveStep('idle');
      Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const isWorking = isGenerating || saveStep === 'done';
  const stepsDone = {
    generating: ['saving-course', 'saving-lessons', 'done'].includes(saveStep),
    savingCourse: ['saving-lessons', 'done'].includes(saveStep),
    savingLessons: saveStep === 'done',
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>

        <View className="px-5 pt-2 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-earth-900/5 items-center justify-center" activeOpacity={0.9}>
            <ChevronLeft size={20} color="#1c1917" strokeWidth={1.5} />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text className="text-2xl font-light text-black" style={{ letterSpacing: -0.3 }}>Create course</Text>
            <Text className="text-earth-500 font-light text-sm">Add a new course to the platform</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* AI generate card */}
          <TouchableOpacity onPress={() => setAiModalVisible(true)} className="bg-primary-600 rounded-3xl p-5 mb-6 flex-row items-center" activeOpacity={0.9}>
            <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center mr-4">
              <Sparkles size={22} color="white" strokeWidth={1.5} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium text-base">Generate with AI</Text>
              <Text className="text-white/70 text-xs font-light mt-0.5">Full course + 8 lessons, instantly</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-earth-400/30" />
            <Text className="text-earth-400 text-xs font-light mx-3">or create manually</Text>
            <View className="flex-1 h-px bg-earth-400/30" />
          </View>

          <Text className="text-earth-500 text-xs font-light uppercase tracking-widest mb-2">Course title</Text>
          <TextInput className={`${fieldPlain} mb-5`} placeholder="Enter course title" value={title} onChangeText={setTitle} placeholderTextColor="#a8a29e" />

          <Text className="text-earth-500 text-xs font-light uppercase tracking-widest mb-2">Description</Text>
          <TextInput className={fieldPlain} placeholder="Enter course description" value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 100 }} placeholderTextColor="#a8a29e" />

          <Text className="text-earth-400 text-xs font-light mt-4 leading-5">After creating, add lessons individually from the course detail page.</Text>

          <View className="mt-6 gap-y-3">
            <TouchableOpacity onPress={handleSave} disabled={createMutation.isPending} className={`rounded-2xl py-4 items-center ${createMutation.isPending ? 'bg-primary-400' : 'bg-primary-600'}`} activeOpacity={0.9}>
              <View className="flex-row items-center">
                <Save size={18} color="white" strokeWidth={1.5} />
                <Text className="text-white font-medium text-base ml-2">{createMutation.isPending ? 'Creating…' : 'Create course'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/admin/courses')} className="rounded-2xl py-4 items-center border border-earth-400/40" activeOpacity={0.9}>
              <View className="flex-row items-center">
                <List size={18} color="#44403c" strokeWidth={1.5} />
                <Text className="text-earth-700 font-light text-base ml-2">Manage courses</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* AI Modal */}
      <Modal visible={aiModalVisible} transparent animationType="slide" onRequestClose={() => !isWorking && setAiModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-5 pb-10">

            <View className="w-10 h-1 bg-earth-200 rounded-full self-center mb-5" />

            <View className="flex-row items-center mb-5">
              <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
                <Sparkles size={20} color="#16a34a" strokeWidth={1.5} />
              </View>
              <View>
                <Text className="text-earth-900 font-medium text-base">Generate full course</Text>
                <Text className="text-earth-400 text-xs font-light">Powered by Gemini AI</Text>
              </View>
            </View>

            {/* Topic input — only before generation */}
            {saveStep === 'idle' && (
              <>
                <Text className="text-earth-600 text-sm font-light mb-2">What crop or farming topic?</Text>
                <TextInput
                  value={aiTopic}
                  onChangeText={setAiTopic}
                  placeholder={`e.g. "Tomato farming", "Maize production", "Aquaponics"`}
                  placeholderTextColor="#a8a29e"
                  className="border-b border-earth-400/50 py-3 text-earth-900 font-light text-base mb-2"
                  autoFocus
                />
                <Text className="text-earth-400 text-xs font-light mb-6">
                  AI generates a title, description, and 8 lessons — theory, soil, planting, water, nutrition, pests, harvest, and business.
                </Text>
              </>
            )}

            {/* Progress steps */}
            {saveStep !== 'idle' && (
              <View className="mb-4">
                <StepRow label="Generating course content with Gemini…" done={stepsDone.generating} active={saveStep === 'generating'} />
                <StepRow label="Saving course to database…" done={stepsDone.savingCourse} active={saveStep === 'saving-course'} />
                <StepRow
                  label={`Saving lessons${savedLessonCount > 0 ? ` (${savedLessonCount} of ${generatedLessons.length})` : '…'}`}
                  done={stepsDone.savingLessons}
                  active={saveStep === 'saving-lessons'}
                />
                {saveStep === 'done' && <StepRow label="All done! Opening course…" done active={false} />}

                <View className="mt-4 h-1 bg-earth-100 rounded-full overflow-hidden">
                  <Animated.View className="h-full bg-primary-500 rounded-full" style={{ width: progressWidth }} />
                </View>
                {progressMessage ? <Text className="text-earth-400 text-xs font-light mt-2">{progressMessage}</Text> : null}
              </View>
            )}

            {/* Lesson preview */}
            {generatedLessons.length > 0 && saveStep !== 'idle' && (
              <View className="mb-5" style={{ maxHeight: 200 }}>
                <View className="flex-row items-center mb-2">
                  <BookOpen size={13} color="#16a34a" strokeWidth={1.5} />
                  <Text className="text-earth-500 text-xs font-light ml-1.5">{generatedLessons.length} lessons generated</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {generatedLessons.map((lesson, i) => (
                    <LessonPreviewCard key={i} index={i} title={lesson.title} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* CTA */}
            {saveStep === 'idle' && (
              <View className="gap-y-3">
                <TouchableOpacity onPress={() => void onGenerateAndSave()} className="bg-primary-600 rounded-2xl py-4 items-center" activeOpacity={0.9}>
                  <View className="flex-row items-center">
                    <Sparkles size={16} color="white" strokeWidth={1.5} />
                    <Text className="text-white font-medium ml-2">Generate & save course</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setAiModalVisible(false); setAiTopic(''); }} className="py-3 items-center" activeOpacity={0.8}>
                  <Text className="text-earth-500 font-light">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {isWorking && saveStep !== 'done' && (
              <Text className="text-earth-400 text-xs font-light text-center mt-2">Please wait — saving your course…</Text>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
