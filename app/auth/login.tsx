/**
 * @fileoverview Imbewu sign-in — luxury two-panel design, perfectly centered.
 */

import { AlertBanner } from '@/components/shared';
import { signIn } from '@/services/authService';
import { getProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { loginSchema, type LoginFormData } from '@/validators/authSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff, Leaf } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWide = width >= 768;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormData) => {
    setBanner(null);
    setIsLoading(true);
    const { data: session, error } = await signIn(values.email, values.password);
    if (error) { setBanner(error); setIsLoading(false); return; }
    if (session?.user) {
      const { data: profile } = await getProfile(session.user.id);
      if (!profile) { setBanner('Your profile could not be loaded. Please try again.'); setIsLoading(false); return; }
      setIsLoading(false);
      setAuth({ user: session.user, profile, session });
      router.replace('/');
      return;
    }
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, flexDirection: 'row' }} edges={['top', 'bottom']}>

        {/* LEFT PANEL */}
        {isWide && (
          <View style={s.leftPanel}>
            <Text style={s.logoText}>IMBEWU</Text>
            <View style={s.leftCenter}>
              <Leaf size={44} color="#C9A84C" />
              <Text style={s.heroLine1}>The seed is planted.</Text>
              <Text style={s.heroLine2}>Now grow.</Text>
              <Text style={s.heroBody}>
                Join thousands of learners cultivating their craft on Imbewu —
                South Africa's refined agriculture academy.
              </Text>
            </View>
            <Text style={s.copyright}>© 2026 IMBEWU</Text>
          </View>
        )}

        {/* RIGHT PANEL */}
        <ScrollView
          style={{ flex: 1, backgroundColor: '#FAF7F2' }}
          contentContainerStyle={s.rightScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.formCard}>

            <Text style={s.heading}>Welcome back.</Text>
            <Text style={s.subheading}>Continue cultivating your craft.</Text>

            {banner && (
              <View style={{ marginBottom: 20 }}>
                <AlertBanner message={banner} variant="error" onDismiss={() => setBanner(null)} />
              </View>
            )}

            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>EMAIL</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="sipho@imbewu.academy"
                    placeholderTextColor="#C4B89A"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={s.input}
                  />
                )}
              />
              {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <View style={s.passwordLabelRow}>
                <Text style={s.label}>PASSWORD</Text>
                <Link href="/auth/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={s.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Your secure passphrase"
                      placeholderTextColor="#C4B89A"
                      secureTextEntry={!showPassword}
                      style={[s.input, { paddingRight: 48 }]}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(v => !v)}
                      style={s.eyeBtn}
                      hitSlop={10}
                    >
                      {showPassword
                        ? <EyeOff size={20} color="#C4B89A" />
                        : <Eye size={20} color="#C4B89A" />
                      }
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
            </View>

            {/* Sign in button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={[s.signInBtn, isLoading && { opacity: 0.7 }]}
              activeOpacity={0.85}
            >
              <Text style={s.signInBtnText}>
                {isLoading ? 'Signing in…' : 'Sign in  →'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider} />

            {/* Footer */}
            <View style={s.footerRow}>
              <Text style={s.footerText}>New to Imbewu? </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text style={s.footerLink}>Create an account</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <Link href="/nolwazi" asChild>
              <TouchableOpacity style={{ alignSelf: 'center', marginTop: 14 }}>
                <Text style={s.nolwaziText}>
                  Questions? Chat with <Text style={s.nolwaziName}>Nolwazi</Text>
                </Text>
              </TouchableOpacity>
            </Link>

            <Text style={s.encryptedText}>
              Encrypted session · Agricultural learning platform
            </Text>

          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  leftPanel: {
    width: '40%',
    backgroundColor: '#032f20',
    paddingHorizontal: 48,
    paddingVertical: 52,
    justifyContent: 'space-between',
  },
  logoText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    letterSpacing: 5,
    fontWeight: '600',
  },
  leftCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  heroLine1: {
    color: '#FFFFFF',
    fontSize: 40,
    fontFamily: 'serif',
    fontWeight: '300',
    lineHeight: 50,
    marginTop: 28,
  },
  heroLine2: {
    color: '#C9A84C',
    fontSize: 40,
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 50,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 24,
  },
  copyright: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  rightScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 52,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
  },
  heading: {
    color: '#022418',
    fontSize: 36,
    fontFamily: 'serif',
    fontWeight: '400',
    marginBottom: 6,
  },
  subheading: {
    color: '#8B7355',
    fontSize: 14,
    marginBottom: 36,
    lineHeight: 22,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#8B7355',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#022418',
    width: '100%',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '600',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 5,
  },
  signInBtn: {
    backgroundColor: '#032f20',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5DDD0',
    marginBottom: 24,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#8B7355',
    fontSize: 13,
  },
  footerLink: {
    color: '#C9A84C',
    fontSize: 13,
    fontWeight: '700',
  },
  nolwaziText: {
    color: '#8B7355',
    fontSize: 12,
    textAlign: 'center',
  },
  nolwaziName: {
    color: '#022418',
    fontWeight: '700',
  },
  encryptedText: {
    color: '#C4B89A',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.5,
  },
});
