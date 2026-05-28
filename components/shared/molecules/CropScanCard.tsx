/**
 * @fileoverview CropScanCard — camera/upload + Gemini Vision AI crop analysis.
 *
 * Fixed:
 * - Model changed to gemini-1.5-flash (stable multimodal REST support)
 * - maxOutputTokens raised to 1500 so full JSON is never truncated
 * - Proper error surfacing when API returns non-ok or empty response
 * - Added console.error logging so failures are visible in dev tools
 */

import { getGeminiApiKey } from '@/services/gemini';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle, Image as ImageIcon, Scan, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────

type ScanStatus = 'idle' | 'scanning' | 'done' | 'error';

interface ScanResult {
  healthStatus: 'healthy' | 'warning' | 'critical' | 'harvest';
  headline: string;
  details: string;
  recommendations: string[];
  confidence: string;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert South African agronomist and crop health specialist.
A farmer or student has photographed their crop and wants your professional assessment.

Analyse the image carefully. Respond ONLY with valid JSON — no markdown, no explanation outside the JSON:

{
  "healthStatus": "healthy",
  "headline": "Short one-line assessment (max 8 words)",
  "details": "2-3 sentence detailed analysis of what you observe — growth stage, leaf colour, stem condition, signs of stress, pests, disease, or nutrient deficiency.",
  "recommendations": ["Action item 1", "Action item 2", "Action item 3"],
  "confidence": "High"
}

healthStatus must be exactly one of: healthy, warning, critical, harvest
confidence must be exactly one of: High, Medium, Low

healthStatus guide:
- healthy: crop looks good and on track
- warning: early signs of stress, pest, or disease — action recommended soon
- critical: significant disease, pest damage, or deficiency — urgent action needed
- harvest: crop appears ready or near-ready to harvest

Be specific to South African agricultural conditions.`;

// ── Gemini Vision call ────────────────────────────────────────────────────────

const VISION_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
];

async function analyseCropImage(base64: string, mimeType: string): Promise<ScanResult> {
  const key = getGeminiApiKey();
  if (!key?.trim()) {
    throw new Error('Missing Gemini API key. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
  }

  // Strip data URI prefix if present (ImagePicker sometimes includes it)
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');

  let lastError = 'Unknown error';

  for (const model of VISION_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: 'Analyse this crop image and respond with JSON only.',
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        error?: { message?: string; code?: number };
        candidates?: {
          content?: { parts?: { text?: string }[] };
          finishReason?: string;
        }[];
      };

      if (!res.ok) {
        lastError = json.error?.message ?? `HTTP ${res.status}`;
        console.error(`[CropScan] ${model} failed:`, lastError);
        // 404 = model not found, try next; 400/403 = key issue, stop
        if (res.status === 404 || res.status === 429 || res.status === 503) continue;
        throw new Error(lastError);
      }

      const raw = json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('') ?? '';

      if (!raw.trim()) {
        const reason = json.candidates?.[0]?.finishReason ?? 'empty response';
        lastError = `Model returned no content (${reason})`;
        console.error(`[CropScan] ${model} empty:`, lastError);
        continue;
      }

      // Strip markdown fences if model adds them
      const clean = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      console.log(`[CropScan] ${model} raw response:`, clean.slice(0, 200));

      try {
        const parsed = JSON.parse(clean) as Partial<ScanResult>;

        // Validate required fields
        if (!parsed.healthStatus || !parsed.headline || !parsed.details) {
          lastError = 'Response missing required fields';
          continue;
        }

        return {
          healthStatus: parsed.healthStatus,
          headline: parsed.headline,
          details: parsed.details,
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations
            : ['Monitor your crop closely and consult a local agronomist if symptoms worsen.'],
          confidence: parsed.confidence ?? 'Medium',
        };
      } catch {
        // Model returned valid text but not JSON — use it as details
        return {
          healthStatus: 'warning',
          headline: 'Analysis complete',
          details: clean.slice(0, 400),
          recommendations: [
            'Review the analysis above carefully.',
            'Consult a local agronomist for a hands-on assessment.',
          ],
          confidence: 'Low',
        };
      }
    } catch (e) {
      if (e instanceof Error && e.message !== lastError) {
        lastError = e.message;
      }
      console.error(`[CropScan] ${model} threw:`, lastError);
    }
  }

  throw new Error(`Crop scan failed: ${lastError}`);
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  healthy:  { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.25)',   label: 'Healthy' },
  warning:  { color: '#d97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.25)',   label: 'Needs Attention' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.25)',   label: 'Critical' },
  harvest:  { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  border: 'rgba(124,58,237,0.25)',  label: 'Ready to Harvest' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface CropScanCardProps {
  courseTitle?: string;
}

export function CropScanCard({ courseTitle }: CropScanCardProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = () => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();
  };

  const stopPulse = () => {
    pulseRef.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        Alert.alert(
          useCamera ? 'Camera access needed' : 'Photo library access needed',
          'Please allow access in your device settings.'
        );
        return;
      }

      const picked = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.75,
            base64: true,
            allowsEditing: true,
            aspect: [4, 3],
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.75,
            base64: true,
            allowsEditing: true,
            aspect: [4, 3],
          });

      if (picked.canceled || !picked.assets?.[0]) return;

      const asset = picked.assets[0];

      if (!asset.base64) {
        Alert.alert('Image error', 'Could not read image data. Please try a different photo.');
        return;
      }

      setImageUri(asset.uri);
      setImageBase64(asset.base64);
      setImageMime(asset.mimeType ?? 'image/jpeg');
      setStatus('idle');
      setResult(null);
      setErrorMessage(null);
    } catch (e) {
      Alert.alert('Could not open picker', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleScan = async () => {
    if (!imageBase64) {
      Alert.alert('No image', 'Please take or upload a photo first.');
      return;
    }

    setStatus('scanning');
    setResult(null);
    setErrorMessage(null);
    startPulse();

    try {
      const scanResult = await analyseCropImage(imageBase64, imageMime);
      setResult(scanResult);
      setStatus('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not analyse image. Please try again.';
      setErrorMessage(msg);
      setStatus('error');
    } finally {
      stopPulse();
    }
  };

  const reset = () => {
    setImageUri(null);
    setImageBase64(null);
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  const statusConfig = result ? (STATUS_CONFIG[result.healthStatus] ?? STATUS_CONFIG.warning) : null;

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 24, overflow: 'hidden' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#0a2416', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{
          borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
          borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
          alignSelf: 'flex-start', marginBottom: 12,
        }}>
          <Text style={{ color: '#d4af37', fontSize: 9, letterSpacing: 2.5, fontWeight: '400' }}>
            AI CROP SCANNER
          </Text>
        </View>
        <Text style={{ color: '#f5f0e8', fontSize: 18, fontWeight: '200', letterSpacing: -0.3, marginBottom: 4 }}>
          Scan Your Crop
        </Text>
        <Text style={{ color: 'rgba(245,240,232,0.4)', fontSize: 12, fontWeight: '300', lineHeight: 18 }}>
          {courseTitle
            ? `Get AI feedback on your ${courseTitle} crop`
            : 'Photograph your crop for instant AI health analysis'}
        </Text>
      </View>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: 'rgba(255,255,255,0.75)', padding: 16 }}>

        {/* Image preview or pick buttons */}
        {imageUri ? (
          <View style={{ position: 'relative', marginBottom: 12 }}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], borderRadius: 16, overflow: 'hidden' }}>
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: 200, borderRadius: 16 }}
                resizeMode="cover"
              />
            </Animated.View>
            <TouchableOpacity
              onPress={reset}
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: 'rgba(0,0,0,0.55)',
                alignItems: 'center', justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <X size={14} color="white" strokeWidth={2} />
            </TouchableOpacity>
            {/* Re-pick buttons below the image */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => void pickImage(true)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)', borderRadius: 10,
                  paddingVertical: 8, gap: 6,
                }}
                activeOpacity={0.8}
              >
                <Camera size={13} color="#16a34a" strokeWidth={1.5} />
                <Text style={{ color: '#166534', fontSize: 11, fontWeight: '500' }}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void pickImage(false)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)', borderRadius: 10,
                  paddingVertical: 8, gap: 6,
                }}
                activeOpacity={0.8}
              >
                <ImageIcon size={13} color="#16a34a" strokeWidth={1.5} />
                <Text style={{ color: '#166534', fontSize: 11, fontWeight: '500' }}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => void pickImage(true)}
              activeOpacity={0.85}
              style={{
                flex: 1, borderWidth: 1.5, borderColor: 'rgba(22,163,74,0.3)',
                borderStyle: 'dashed', borderRadius: 16, paddingVertical: 24,
                alignItems: 'center',
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: 'rgba(22,163,74,0.1)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                <Camera size={22} color="#16a34a" strokeWidth={1.5} />
              </View>
              <Text style={{ color: '#166534', fontSize: 12, fontWeight: '500' }}>Take Photo</Text>
              <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '300', marginTop: 2 }}>Use camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void pickImage(false)}
              activeOpacity={0.85}
              style={{
                flex: 1, borderWidth: 1.5, borderColor: 'rgba(22,163,74,0.3)',
                borderStyle: 'dashed', borderRadius: 16, paddingVertical: 24,
                alignItems: 'center',
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: 'rgba(22,163,74,0.1)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                <ImageIcon size={22} color="#16a34a" strokeWidth={1.5} />
              </View>
              <Text style={{ color: '#166534', fontSize: 12, fontWeight: '500' }}>Upload Photo</Text>
              <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '300', marginTop: 2 }}>From gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── AI Scan button ──────────────────────────────────────────── */}
        {imageUri && status !== 'done' && (
          <TouchableOpacity
            onPress={() => void handleScan()}
            disabled={status === 'scanning'}
            activeOpacity={0.9}
            style={{
              backgroundColor: status === 'scanning' ? 'rgba(212,175,55,0.5)' : '#d4af37',
              borderRadius: 14, paddingVertical: 15, marginBottom: 4,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {status === 'scanning' ? (
              <>
                <ActivityIndicator size="small" color="#0a2416" />
                <Text style={{ color: '#0a2416', fontSize: 14, fontWeight: '600', marginLeft: 10 }}>
                  Analysing crop…
                </Text>
              </>
            ) : (
              <>
                <Scan size={16} color="#0a2416" strokeWidth={2} />
                <Text style={{ color: '#0a2416', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                  AI Scan
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ── Error state ──────────────────────────────────────────────── */}
        {status === 'error' && errorMessage && (
          <View style={{
            backgroundColor: 'rgba(220,38,38,0.08)',
            borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
            borderRadius: 14, padding: 14, marginTop: 4, marginBottom: 4,
          }}>
            <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '500', marginBottom: 4 }}>
              Scan failed
            </Text>
            <Text style={{ color: '#78716c', fontSize: 12, fontWeight: '300', lineHeight: 18 }}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => void handleScan()}
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '500' }}>Try again →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Scan result ─────────────────────────────────────────────── */}
        {status === 'done' && result && statusConfig && (
          <View style={{ marginTop: 4 }}>
            {/* Status banner */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: statusConfig.bg,
              borderWidth: 1, borderColor: statusConfig.border,
              borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
              marginBottom: 14,
            }}>
              <CheckCircle size={18} color={statusConfig.color} strokeWidth={1.5} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: statusConfig.color, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 }}>
                  {statusConfig.label.toUpperCase()}
                </Text>
                <Text style={{ color: '#1c1917', fontSize: 14, fontWeight: '400', marginTop: 2 }}>
                  {result.headline}
                </Text>
              </View>
              <View style={{
                backgroundColor: statusConfig.bg, borderRadius: 8,
                paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ color: statusConfig.color, fontSize: 9, fontWeight: '500' }}>
                  {result.confidence}
                </Text>
              </View>
            </View>

            {/* Details */}
            <View style={{
              backgroundColor: 'rgba(28,25,23,0.04)',
              borderRadius: 14, padding: 14, marginBottom: 14,
            }}>
              <Text style={{ color: '#a8a29e', fontSize: 9, letterSpacing: 2.5, fontWeight: '500', marginBottom: 6 }}>
                ANALYSIS
              </Text>
              <Text style={{ color: '#292524', fontSize: 13, fontWeight: '300', lineHeight: 21 }}>
                {result.details}
              </Text>
            </View>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: '#a8a29e', fontSize: 9, letterSpacing: 2.5, fontWeight: '500', marginBottom: 10 }}>
                  RECOMMENDATIONS
                </Text>
                {result.recommendations.map((rec, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: 'rgba(22,163,74,0.1)',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 10, marginTop: 1, flexShrink: 0,
                    }}>
                      <Text style={{ color: '#16a34a', fontSize: 9, fontWeight: '700' }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, color: '#292524', fontSize: 13, fontWeight: '300', lineHeight: 20 }}>
                      {rec}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Scan again */}
            <TouchableOpacity
              onPress={() => { setStatus('idle'); setResult(null); }}
              style={{
                borderWidth: 1, borderColor: 'rgba(22,163,74,0.25)',
                borderRadius: 12, paddingVertical: 12, alignItems: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '400' }}>Scan again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
