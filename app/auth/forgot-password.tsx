/**
 * @fileoverview Forgot password — luxury emerald & gold theme
 */

import { AlertBanner } from '@/components/shared';
import { requestPasswordReset } from '@/services/authService';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Leaf, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const schema = z.object({ email: z.string().email('Please enter a valid email address') });

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setError(null);
    const validated = schema.safeParse({ email });
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    setIsLoading(true);
    const { error: resetError } = await requestPasswordReset(validated.data.email);
    setIsLoading(false);
    if (resetError) { setError(resetError); return; }
    setSent(true);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <Leaf size={32} color="#C9A84C" />
            <Text style={s.logo}>IMBEWU</Text>
          </View>

          <View style={s.card}>
            {!sent ? (
              <>
                <Text style={s.title}>Reset password.</Text>
                <Text style={s.subtitle}>
                  Enter your account email and we'll send you a secure reset link.
                </Text>

                {error && (
                  <View style={{ marginBottom: 20 }}>
                    <AlertBanner message={error} variant="error" onDismiss={() => setError(null)} />
                  </View>
                )}

                <View style={s.fieldGroup}>
                  <Text style={s.label}>EMAIL ADDRESS</Text>
                  <View style={s.inputWrap}>
                    <Mail size={18} color="#C4B89A" style={{ marginRight: 10 }} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="sipho@imbewu.academy"
                      placeholderTextColor="#C4B89A"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={s.input}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleReset}
                  disabled={isLoading}
                  style={[s.btn, isLoading && { opacity: 0.7 }]}
                  activeOpacity={0.85}
                >
                  <Text style={s.btnText}>
                    {isLoading ? 'Sending reset link…' : 'Send reset link →'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Success State */
              <View style={s.successWrap}>
                <View style={s.successIcon}>
                  <CheckCircle size={48} color="#C9A84C" />
                </View>
                <Text style={s.title}>Check your inbox.</Text>
                <Text style={s.subtitle}>
                  We sent a password reset link to{'\n'}
                  <Text style={s.emailHighlight}>{email}</Text>
                </Text>
                <Text style={s.hint}>
                  Didn't receive it? Check your spam folder or try again.
                </Text>
                <TouchableOpacity
                  onPress={() => setSent(false)}
                  style={s.retryBtn}
                  activeOpacity={0.85}
                >
                  <Text style={s.retryBtnText}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Back to sign in */}
            <Link href="/auth/login" asChild>
              <TouchableOpacity style={s.backBtn} activeOpacity={0.75}>
                <ArrowLeft size={16} color="#8B7355" />
                <Text style={s.backText}>Back to sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 },
  logo: { color: '#032f20', fontSize: 16, letterSpacing: 5, fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: '#E8DFD0' },
  title: { color: '#022418', fontSize: 32, fontFamily: 'serif', fontWeight: '400', marginBottom: 8 },
  subtitle: { color: '#8B7355', fontSize: 14, lineHeight: 22, marginBottom: 28 },
  emailHighlight: { color: '#032f20', fontWeight: '700' },
  hint: { color: '#C4B89A', fontSize: 12, lineHeight: 18, marginBottom: 20, textAlign: 'center' },
  fieldGroup: { marginBottom: 24 },
  label: { color: '#8B7355', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    backgroundColor: '#FAF7F2', borderWidth: 1, borderColor: '#E5DDD0',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  input: { flex: 1, fontSize: 14, color: '#022418' },
  btn: {
    backgroundColor: '#032f20', borderRadius: 10, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#C9A84C40',
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  successWrap: { alignItems: 'center', paddingVertical: 16 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#032f2015', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#C9A84C40', marginBottom: 20,
  },
  retryBtn: {
    borderWidth: 1, borderColor: '#E8DFD0', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 24, marginBottom: 24,
  },
  retryBtnText: { color: '#8B7355', fontWeight: '600', fontSize: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  backText: { color: '#8B7355', fontSize: 13 },
});
