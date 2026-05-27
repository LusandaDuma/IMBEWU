/**
 * @fileoverview Create course — AI Syllabus Generator.
 * Performance: batch-inserts all 8 lessons in ONE Supabase call.
 * UI: luxury dark-green card, gold accents, animated progress modal.
 */

import { invalidateAllCourseCatalogQueries } from '@/lib/queryInvalidation';
import { generateCourseWithAI } from '@/services/lessonGenerationService';
import { createCourse, supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  Sparkles
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Crop categories ───────────────────────────────────────────────────────────

const CROP_CATEGORIES = [
  'Vegetables',
  'Fruits & Berries',
  'Grains & Cereals',
  'Legumes & Pulses',
  'Root Crops & Tubers',
  'Herbs & Medicinal Plants',
  'Oilseeds & Nuts',
  'Sugarcane & Fibres',
  'Fodder & Cover Crops',
  'Indigenous Crops',
];

// ── Types ─────────────────────────────────────────────────────────────────────

type SaveStep = 'idle' | 'generating' | 'saving' | 'done' | 'error';

// ── Sub-components ────────────────────────────────────────────────────────────

function CropPicker({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)', borderRadius: 14,
          paddingHorizontal: 16, paddingVertical: 14,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '300', flex: 1 }} numberOfLines={1}>
          {value}
        </Text>
        <ChevronDown size={16} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={{
            position: 'absolute', top: '22%', left: 28, right: 28,
            backgroundColor: '#0f2418', borderRadius: 20, overflow: 'hidden',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          }}>
            <Text style={{
              color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700',
              letterSpacing: 2, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
            }}>
              SELECT CROP CATEGORY
            </Text>
            <ScrollView bounces={false}>
              {CROP_CATEGORIES.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => { onSelect(opt); setOpen(false); }}
                  style={{
                    paddingVertical: 14, paddingHorizontal: 20,
                    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
                    backgroundColor: opt === value ? 'rgba(22,163,74,0.18)' : 'transparent',
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                  }}
                  activeOpacity={0.7}
                >
                  {opt === value && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
                  )}
                  <Text style={{
                    color: opt === value ? '#4ade80' : 'rgba(255,255,255,0.8)',
                    fontSize: 14, fontWeight: '300',
                  }}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function StepRow({
  label, status,
}: {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 }}>
      <View style={{
        width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor:
          status === 'done'  ? '#dcfce7' :
          status === 'active' ? '#f0fdf4' :
          status === 'error'  ? '#fef2f2' : '#f5f5f4',
      }}>
        {status === 'done'   && <CheckCircle size={15} color="#16a34a" strokeWidth={2} />}
        {status === 'active' && <ActivityIndicator size="small" color="#16a34a" />}
        {status === 'error'  && <Text style={{ color: '#ef4444', fontSize: 14 }}>✕</Text>}
        {status === 'pending' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1cdc8' }} />}
      </View>
      <Text style={{
        fontSize: 13, fontWeight: '300', flex: 1,
        color:
          status === 'done'   ? '#16a34a' :
          status === 'active' ? '#111' :
          status === 'error'  ? '#ef4444' : '#b0aba5',
      }}>
        {label}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CreateCourseScreen() {
  const router    = useRouter();
  const { user }  = useAuthStore();
  const queryClient = useQueryClient();

  const [cropCategory, setCropCategory] = useState(CROP_CATEGORIES[0]);
  const [focusTheme, setFocusTheme]     = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [saveStep, setSaveStep]         = useState<SaveStep>('idle');
  const [progressMsg, setProgressMsg]   = useState('');
  const [lessonTitles, setLessonTitles] = useState<string[]>([]);
  const isWorking = saveStep === 'generating' || saveStep === 'saving';

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;

  const animateTo = (v: number) =>
    Animated.timing(progressAnim, { toValue: v, duration: 500, useNativeDriver: false, easing: Easing.out(Easing.cubic) }).start();

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => { pulseAnim.stopAnimation(); pulseAnim.setValue(1); };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const stepStatus = (step: SaveStep): 'pending' | 'active' | 'done' | 'error' => {
    if (saveStep === 'error') return 'error';
    const order: SaveStep[] = ['idle', 'generating', 'saving', 'done'];
    const cur = order.indexOf(saveStep);
    const tar = order.indexOf(step);
    if (cur > tar) return 'done';
    if (cur === tar) return 'active';
    return 'pending';
  };

  const onGenerate = async () => {
    if (!user) { Alert.alert('Not authenticated', 'Please sign in again.'); return; }

    const topic = [cropCategory, focusTheme.trim()].filter(Boolean).join(' — ');

    setSaveStep('generating');
    setLessonTitles([]);
    setProgressMsg('');
    progressAnim.setValue(0);
    animateTo(8);
    startPulse();

    try {
      // ── Step 1: Generate with Gemini ──
      const result = await generateCourseWithAI({
        topic,
        onProgress: (msg) => setProgressMsg(msg),
      });

      if (!result.ok) {
        stopPulse();
        setSaveStep('error');
        setProgressMsg(result.error);
        return;
      }

      animateTo(45);
      setLessonTitles(result.course.lessons.map((l) => l.title));

      // ── Step 2: Save course ──
      setSaveStep('saving');
      setProgressMsg('Creating course record…');
      animateTo(55);

      const created = await createCourse({
        title: result.course.title,
        description: result.course.description,
        offline_url: null,
        created_by: user.id,
        is_published: false,
      });

      if (!created) {
        stopPulse();
        setSaveStep('error');
        setProgressMsg('Could not save course. Check your Supabase permissions.');
        return;
      }

      // ── Step 3: Batch-insert all lessons in ONE call ──
      setProgressMsg('Saving all lessons…');
      animateTo(75);

      const lessonRows = result.course.lessons.map((lesson, i) => ({
        course_id:    created.id,
        order_index:  i,
        title:        lesson.title,
        description:  lesson.summary  || null,
        content:      lesson.content  || null,
        video_url:    lesson.video_url ?? null,
        duration_mins: lesson.duration_mins,
      }));

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonRows);

      if (lessonsError) {
        stopPulse();
        setSaveStep('error');
        setProgressMsg(`Lessons error: ${lessonsError.message}`);
        return;
      }

      // ── Done ──
      animateTo(100);
      stopPulse();
      setSaveStep('done');
      setProgressMsg('');

      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-lessons', created.id] });
      invalidateAllCourseCatalogQueries(queryClient);

      setTimeout(() => {
        setModalVisible(false);
        setSaveStep('idle');
        router.replace(`/admin/courses/${created.id}`);
      }, 1600);

    } catch (e) {
      stopPulse();
      setSaveStep('error');
      setProgressMsg(e instanceof Error ? e.message : 'Unexpected error. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#d6d6d6', '#d6d6d6']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={20} color="#111" strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={{ marginLeft: 14 }}>
            <Text style={{ fontSize: 24, fontWeight: '300', color: '#0a0a0a', letterSpacing: -0.3 }}>Create course</Text>
            <Text style={{ color: '#78716c', fontSize: 13, fontWeight: '300' }}>AI Syllabus Generator</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>

          {/* ── AI Card ── */}
          <View style={{ backgroundColor: '#0f2418', borderRadius: 24, overflow: 'hidden' }}>

            {/* Watermark */}
            <View style={{ position: 'absolute', right: -8, top: 8, opacity: 0.04 }} pointerEvents="none">
              <Text style={{ fontSize: 120, fontWeight: '900', color: '#fff', letterSpacing: -6 }}>AI</Text>
            </View>

            <View style={{ padding: 24 }}>
              {/* Badge */}
              <View style={{
                alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 18,
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>
                  INTEGRATED AI SYLLABUS GENERATOR
                </Text>
              </View>

              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 35, marginBottom: 10, letterSpacing: -0.4 }}>
                Plant a New{'\n'}Interactive Syllabus
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '300', lineHeight: 20, marginBottom: 28 }}>
                Select a crop category and an optional focus. The AI engine draws on South African indigenous farming techniques to generate lectures, quizzes, and titles automatically.
              </Text>

              {/* Crop category */}
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>
                CROP CATEGORY
              </Text>
              <View style={{ marginBottom: 22 }}>
                <CropPicker value={cropCategory} onSelect={setCropCategory} />
              </View>

              {/* Focus input */}
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>
                SPECIFIC CROP OR FOCUS{' '}
                <Text style={{ color: 'rgba(255,255,255,0.28)', fontWeight: '300' }}>(optional)</Text>
              </Text>
              <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.18)', marginBottom: 30 }}>
                <TextInput
                  value={focusTheme}
                  onChangeText={setFocusTheme}
                  placeholder="e.g. Tomatoes, Butternut, Maize…"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={{ color: '#fff', fontSize: 15, fontWeight: '300', paddingVertical: 10 }}
                />
              </View>

              {/* Generate CTA */}
              <TouchableOpacity
                onPress={() => { setSaveStep('idle'); progressAnim.setValue(0); setModalVisible(true); }}
                activeOpacity={0.87}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#c8a84b', borderRadius: 14, paddingVertical: 15, gap: 8,
                }}
              >
                <Sparkles size={16} color="#0f2418" strokeWidth={2} />
                <Text style={{ color: '#0f2418', fontWeight: '700', fontSize: 15 }}>Generate with AI</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hint */}
          <Text style={{ color: '#78716c', fontSize: 12, fontWeight: '300', lineHeight: 18, textAlign: 'center', marginTop: 16 }}>
            AI generates a full course with 8 detailed lessons.{'\n'}Typically takes 20–40 seconds. You can edit everything after.
          </Text>
        </ScrollView>
      </SafeAreaView>

      {/* ══════════════════════════════════════════
          GENERATION MODAL — luxury dark design
      ══════════════════════════════════════════ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isWorking && setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#0f2418',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40,
          }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

            {/* Modal header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Animated.View style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: 'rgba(201,168,75,0.15)',
                borderWidth: 1, borderColor: 'rgba(201,168,75,0.3)',
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
                transform: [{ scale: pulseAnim }],
              }}>
                {saveStep === 'done'
                  ? <CheckCircle size={22} color="#4ade80" strokeWidth={2} />
                  : <Sparkles size={22} color="#c8a84b" strokeWidth={1.5} />}
              </Animated.View>
              <View>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 17 }}>
                  {saveStep === 'done' ? 'Course created!' : 'Generating course'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '300' }}>
                  {saveStep === 'done' ? 'Opening course now…' : 'Powered by Gemini AI'}
                </Text>
              </View>
            </View>

            {/* Confirmation (idle only) */}
            {saveStep === 'idle' && (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
                padding: 16, marginBottom: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
                  GENERATING FOR
                </Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '400' }}>{cropCategory}</Text>
                {focusTheme.trim() ? (
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '300', marginTop: 4, fontStyle: 'italic' }}>
                    "{focusTheme.trim()}"
                  </Text>
                ) : null}
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '300', marginTop: 10, lineHeight: 18 }}>
                  8 lessons will cover theory, soil, planting, water, nutrition, pests, harvest, and business.
                </Text>
              </View>
            )}

            {/* Steps */}
            {saveStep !== 'idle' && (
              <View style={{ marginBottom: 18 }}>
                <StepRow label="Generating course content with Gemini…" status={saveStep === 'generating' ? 'active' : saveStep === 'error' ? 'error' : 'done'} />
                <StepRow label="Saving course to database…"
                  status={saveStep === 'saving' ? 'active' : saveStep === 'done' ? 'done' : saveStep === 'error' ? 'error' : 'pending'} />
                <StepRow label="Saving all 8 lessons at once…"
                  status={saveStep === 'saving' ? 'active' : saveStep === 'done' ? 'done' : saveStep === 'error' ? 'error' : 'pending'} />
              </View>
            )}

            {/* Progress bar */}
            {saveStep !== 'idle' && (
              <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                <Animated.View style={{ height: '100%', backgroundColor: '#c8a84b', borderRadius: 2, width: progressWidth }} />
              </View>
            )}

            {/* Progress message */}
            {progressMsg && saveStep !== 'done' && (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '300', marginBottom: 16 }}>
                {progressMsg}
              </Text>
            )}

            {/* Lesson titles preview */}
            {lessonTitles.length > 0 && saveStep !== 'idle' && (
              <View style={{ marginBottom: 18, maxHeight: 160 }}>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
                  {lessonTitles.length} LESSONS GENERATED
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {lessonTitles.map((title, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(201,168,75,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                        <Text style={{ color: '#c8a84b', fontSize: 10, fontWeight: '600' }}>{i + 1}</Text>
                      </View>
                      <Text style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '300', lineHeight: 18 }}>{title}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* CTA buttons */}
            {saveStep === 'idle' && (
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => void onGenerate()}
                  activeOpacity={0.87}
                  style={{ backgroundColor: '#c8a84b', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Sparkles size={16} color="#0f2418" strokeWidth={2} />
                  <Text style={{ color: '#0f2418', fontWeight: '700', fontSize: 15 }}>Generate & save course</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '300' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error retry */}
            {saveStep === 'error' && (
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => void onGenerate()}
                  activeOpacity={0.87}
                  style={{ backgroundColor: '#c8a84b', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#0f2418', fontWeight: '700', fontSize: 15 }}>Try again</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setModalVisible(false); setSaveStep('idle'); }} style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {isWorking && (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '300', textAlign: 'center', marginTop: 8 }}>
                Please keep the app open — this usually takes 20–40 seconds
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
