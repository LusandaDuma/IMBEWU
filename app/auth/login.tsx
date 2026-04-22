/**
 * @fileoverview LMS sign-in — shared form components, slate + primary palette.
 */

import { AlertBanner, Button, FormField } from '@/components/shared';
import { getProfile, signInWithEmail } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { loginSchema } from '@/validators';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    try {
      setErrors({});
      setBanner(null);
      const validated = loginSchema.parse({ email, password });
      setIsLoading(true);

      const { data, error } = await signInWithEmail(validated.email, validated.password);

      if (error) {
        setBanner('We could not sign you in. Check your email and password, then try again.');
        return;
      }

      if (data.user) {
        const profile = await getProfile(data.user.id);
        setUser(profile);
        router.replace('/');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const pathKey = issue.path[0]?.toString();
          if (pathKey) fieldErrors[pathKey] = issue.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 24,
              paddingVertical: 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center mb-10">
              <View className="w-24 h-24 rounded-[28px] bg-primary-600/95 items-center justify-center mb-7">
                <Sprout size={44} color="white" strokeWidth={1.25} />
              </View>
              <Text className="text-3xl font-light text-white mb-2 text-center tracking-tight">Welcome back</Text>
              <Text className="text-slate-400/95 text-center text-base leading-6 max-w-xs font-light">
                Sign in to continue courses, lessons, and progress on Imbewu.
              </Text>
            </View>

            <View className="rounded-[28px] p-8 bg-white/6">
              {banner ? (
                <AlertBanner
                  message={banner}
                  variant="error"
                  onDismiss={() => setBanner(null)}
                />
              ) : null}

              <FormField
                appearance="dark"
                leftIcon={Mail}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                focused={focusedInput === 'email'}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />

              <FormField
                appearance="dark"
                leftIcon={Lock}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry={!showPassword}
                focused={focusedInput === 'password'}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                endSlot={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                    {showPassword ? (
                      <EyeOff size={22} color="#94a3b8" />
                    ) : (
                      <Eye size={22} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                }
              />

              <Button
                label={isLoading ? 'Signing in…' : 'Sign in'}
                onPress={handleLogin}
                isLoading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={isLoading ? undefined : ArrowRight}
              />

              <View className="flex-row justify-center mt-8 flex-wrap">
                <Text className="text-slate-400 text-sm">No account yet? </Text>
                <Link href="/auth/signup" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary-400 font-semibold text-sm">Create one</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <Link href="/nolwazi" asChild>
                <TouchableOpacity className="mt-5 self-center px-4 py-2 rounded-full bg-white/8 active:bg-white/12">
                  <Text className="text-slate-300 text-sm font-light text-center">
                    Questions about the app? Chat with <Text className="text-primary-400 font-medium">Nolwazi</Text>
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <Text className="text-slate-600 text-center text-xs mt-8 leading-5 px-4">
              Encrypted session · Agricultural learning platform
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
