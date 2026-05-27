/**
 * @fileoverview Crop Analysis — Camera + Nolwazi AI vision analysis
 * Available at end of each course for students and independent growers
 */

import { useAuthStore } from '@/store/auth';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, Image as ImageIcon, Leaf, RefreshCw, Sparkles, Upload } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';
const GEMINI_API_KEY = 'AIzaSyAJEp156yYj1MyEj-GxihTwvuFtoFAZYqs';

interface CropAnalysis {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  healthScore: number;
  isSellable: boolean;
  summary: string;
  issues: string[];
  recommendations: string[];
  harvestReadiness: string;
}

export default function CropAnalysisScreen() {
  const router = useRouter();
  const { courseTitle } = useLocalSearchParams<{ courseTitle?: string }>();
  const { profile } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CropAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take crop photos.');
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setAnalysis(null);
      setError(null);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setAnalysis(null);
      setError(null);
    }
  };

  const analyzeWithNolwazi = async () => {
    if (!imageBase64) {
      Alert.alert('No image', 'Please take or upload a photo of your crop first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const prompt = `You are Nolwazi, an expert South African agriculture AI assistant. 
    
Analyze this crop photo carefully and provide a detailed assessment. ${courseTitle ? `This crop is from the course: "${courseTitle}".` : ''}

Respond ONLY with valid JSON in this exact format:
{
  "overallHealth": "excellent" | "good" | "fair" | "poor",
  "healthScore": <number 0-100>,
  "isSellable": <true|false>,
  "summary": "2-3 sentence overall assessment of the crop",
  "issues": ["issue 1", "issue 2", "issue 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "harvestReadiness": "Ready to harvest" | "Not yet ready" | "Overdue for harvest" | "Cannot determine"
}

Be specific and practical. If the crop looks healthy with no issues, return an empty issues array.
Focus on: color, leaf condition, signs of disease/pests, growth stage, and market readiness.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
          }),
        }
      );

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed: CropAnalysis = JSON.parse(cleaned);
      setAnalysis(parsed);
    } catch (err) {
      setError('Could not analyze the image. Please try again with a clearer photo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getHealthColor = (health: string) => {
    if (health === 'excellent') return '#22c55e';
    if (health === 'good') return '#84cc16';
    if (health === 'fair') return '#f59e0b';
    return '#ef4444';
  };

  const getHealthEmoji = (health: string) => {
    if (health === 'excellent') return '🌿';
    if (health === 'good') return '✅';
    if (health === 'fair') return '⚠️';
    return '❌';
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.85}>
            <ChevronLeft size={20} color={DARK} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerLabel}>Nolwazi AI Vision</Text>
            <Text style={s.headerTitle}>Crop Analysis</Text>
          </View>
        </View>

        {/* Hero Banner */}
        <View style={s.heroBanner}>
          <View style={s.heroBadge}>
            <Sparkles size={12} color={GOLD} />
            <Text style={s.heroBadgeText}>AI POWERED</Text>
          </View>
          <Text style={s.heroTitle}>
            How is your crop growing, {profile?.first_name ?? 'Grower'}?
          </Text>
          <Text style={s.heroSubtitle}>
            Take a photo of your crop and Nolwazi will assess its health, identify any issues, and give you expert recommendations.
          </Text>
        </View>

        {/* Image Section */}
        <View style={s.imageSection}>
          {imageUri ? (
            <View style={s.imageWrap}>
              <Image source={{ uri: imageUri }} style={s.cropImage} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => { setImageUri(null); setImageBase64(null); setAnalysis(null); }}
                style={s.retakeBtn}
                activeOpacity={0.85}
              >
                <RefreshCw size={16} color={GOLD} />
                <Text style={s.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.imagePlaceholder}>
              <ImageIcon size={48} color="#C4B89A" />
              <Text style={s.placeholderText}>No photo yet</Text>
              <Text style={s.placeholderSubtext}>Take a clear photo of your crop for best results</Text>
            </View>
          )}
        </View>

        {/* Camera/Gallery Buttons */}
        <View style={s.captureRow}>
          <TouchableOpacity onPress={takePicture} style={s.captureBtn} activeOpacity={0.85}>
            <Camera size={20} color={GOLD} />
            <Text style={s.captureBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromGallery} style={s.galleryBtn} activeOpacity={0.85}>
            <Upload size={20} color={DARK} />
            <Text style={s.galleryBtnText}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Analyze Button */}
        {imageUri && !analysis && (
          <TouchableOpacity
            onPress={analyzeWithNolwazi}
            disabled={isAnalyzing}
            style={[s.analyzeBtn, isAnalyzing && { opacity: 0.7 }]}
            activeOpacity={0.85}
          >
            {isAnalyzing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color={GOLD} />
                <Text style={s.analyzeBtnText}>Nolwazi is analysing...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color={GOLD} />
                <Text style={s.analyzeBtnText}>Analyse with Nolwazi</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Analysis Results */}
        {analysis && (
          <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>

            {/* Health Score Card */}
            <View style={s.healthCard}>
              <View style={s.healthCardTop}>
                <View>
                  <Text style={s.healthLabel}>CROP HEALTH</Text>
                  <Text style={[s.healthStatus, { color: getHealthColor(analysis.overallHealth) }]}>
                    {getHealthEmoji(analysis.overallHealth)} {analysis.overallHealth.charAt(0).toUpperCase() + analysis.overallHealth.slice(1)}
                  </Text>
                </View>
                <View style={s.scoreCircle}>
                  <Text style={s.scoreNumber}>{analysis.healthScore}</Text>
                  <Text style={s.scoreLabel}>/100</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${analysis.healthScore}%`,
                  backgroundColor: getHealthColor(analysis.overallHealth),
                }]} />
              </View>

              {/* Sellable Badge */}
              <View style={s.metaRow}>
                <View style={[s.metaBadge, { backgroundColor: analysis.isSellable ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={[s.metaBadgeText, { color: analysis.isSellable ? '#16a34a' : '#ef4444' }]}>
                    {analysis.isSellable ? '✓ Market Ready' : '✗ Not Market Ready'}
                  </Text>
                </View>
                <View style={s.metaBadge}>
                  <Text style={s.metaBadgeText}>{analysis.harvestReadiness}</Text>
                </View>
              </View>
            </View>

            {/* Summary */}
            <View style={s.resultCard}>
              <View style={s.resultCardHeader}>
                <Leaf size={16} color={GOLD} />
                <Text style={s.resultCardTitle}>Nolwazi's Assessment</Text>
              </View>
              <Text style={s.summaryText}>{analysis.summary}</Text>
            </View>

            {/* Issues */}
            {analysis.issues.length > 0 && (
              <View style={s.resultCard}>
                <View style={s.resultCardHeader}>
                  <Text style={s.issuesTitle}>⚠️ Issues Detected</Text>
                </View>
                {analysis.issues.map((issue, i) => (
                  <View key={i} style={s.listRow}>
                    <View style={[s.listDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={s.listText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            <View style={s.resultCard}>
              <View style={s.resultCardHeader}>
                <Text style={s.recsTitle}>🌱 Recommendations</Text>
              </View>
              {analysis.recommendations.map((rec, i) => (
                <View key={i} style={s.listRow}>
                  <View style={[s.listDot, { backgroundColor: GOLD }]} />
                  <Text style={s.listText}>{rec}</Text>
                </View>
              ))}
            </View>

            {/* Re-analyze Button */}
            <TouchableOpacity
              onPress={analyzeWithNolwazi}
              style={s.reanalyzeBtn}
              activeOpacity={0.85}
            >
              <RefreshCw size={16} color="#8B7355" />
              <Text style={s.reanalyzeBtnText}>Analyse Again</Text>
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8DFD0',
  },
  headerLabel: { color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  headerTitle: { color: DARK, fontSize: 24, fontWeight: '300', fontFamily: 'serif' },
  heroBanner: {
    backgroundColor: EMERALD, marginHorizontal: 20, borderRadius: 20,
    padding: 24, marginBottom: 20, borderWidth: 1, borderColor: `${GOLD}40`,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${GOLD}20`, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: `${GOLD}40`, marginBottom: 12,
  },
  heroBadgeText: { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: 'white', fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginBottom: 8 },
  heroSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20 },
  imageSection: { marginHorizontal: 20, marginBottom: 16 },
  imageWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  cropImage: { width: '100%', height: 260, borderRadius: 16 },
  retakeBtn: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: EMERALD, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: `${GOLD}40`,
  },
  retakeBtnText: { color: GOLD, fontSize: 12, fontWeight: '600' },
  imagePlaceholder: {
    backgroundColor: 'white', borderRadius: 16, height: 200,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E8DFD0', borderStyle: 'dashed',
    gap: 8,
  },
  placeholderText: { color: '#8B7355', fontSize: 15, fontWeight: '600' },
  placeholderSubtext: { color: '#C4B89A', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  captureRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  captureBtn: {
    flex: 1, backgroundColor: EMERALD, borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: `${GOLD}40`,
  },
  captureBtnText: { color: GOLD, fontWeight: '700', fontSize: 14 },
  galleryBtn: {
    flex: 1, backgroundColor: 'white', borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E8DFD0',
  },
  galleryBtnText: { color: DARK, fontWeight: '600', fontSize: 14 },
  analyzeBtn: {
    backgroundColor: EMERALD, marginHorizontal: 20, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: `${GOLD}40`,
  },
  analyzeBtnText: { color: GOLD, fontWeight: '700', fontSize: 15 },
  errorBox: {
    backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3',
    borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 13 },
  healthCard: {
    backgroundColor: EMERALD, borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: `${GOLD}40`,
  },
  healthCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  healthLabel: { color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
  healthStatus: { fontSize: 22, fontWeight: '700', fontFamily: 'serif' },
  scoreCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: `${GOLD}20`, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: `${GOLD}60`,
  },
  scoreNumber: { color: GOLD, fontSize: 18, fontWeight: '700' },
  scoreLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  metaBadgeText: { color: 'white', fontSize: 11, fontWeight: '600' },
  resultCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E8DFD0',
  },
  resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultCardTitle: { color: DARK, fontSize: 15, fontWeight: '600', fontFamily: 'serif' },
  issuesTitle: { color: DARK, fontSize: 15, fontWeight: '600' },
  recsTitle: { color: DARK, fontSize: 15, fontWeight: '600' },
  summaryText: { color: '#8B7355', fontSize: 14, lineHeight: 22 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  listDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  listText: { color: DARK, fontSize: 13, lineHeight: 20, flex: 1 },
  reanalyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E8DFD0', borderRadius: 12,
    paddingVertical: 14, backgroundColor: 'white',
  },
  reanalyzeBtnText: { color: '#8B7355', fontWeight: '600', fontSize: 14 },
});
