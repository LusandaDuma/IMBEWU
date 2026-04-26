/**
 * @fileoverview LMS sign-in — shared form components, slate + primary palette.
 */

import { AlertBanner, Button, FormField } from '@/components/shared';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { signIn } from '@/services/authService';
import { getProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { loginSchema, type LoginFormData } from '@/validators/authSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    setBanner(null);
    setIsLoading(true);

    const { data: session, error } = await signIn(values.email, values.password);

    if (error) {
      setBanner(error);
      setIsLoading(false);
      return;
    }

    if (session?.user) {
      const { data: profile } = await getProfile(session.user.id);
      if (!profile) {
        setBanner('Your account profile could not be loaded. Please try again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setAuth({ user: session.user, profile, session });
      router.replace('/');
      return;
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]}
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
              <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: 224, height: 80, marginBottom: 28 }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-light text-black mb-2 text-center tracking-tight">Welcome back</Text>
              <Text className="text-earth-700 text-center text-base leading-6 max-w-xs font-light">
                Sign in to continue your courses, lessons, and progress.
              </Text>
            </View>

            <View>
              {banner ? (
                <AlertBanner
                  message={banner}
                  variant="error"
                  onDismiss={() => setBanner(null)}
                />
              ) : null}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    appearance="blend"
                    leftIcon={Mail}
                    placeholder="Email address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    focused={focusedInput === 'email'}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => {
                      setFocusedInput(null);
                      onBlur();
                    }}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    appearance="blend"
                    leftIcon={Lock}
                    placeholder="Password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    secureTextEntry={!showPassword}
                    focused={focusedInput === 'password'}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => {
                      setFocusedInput(null);
                      onBlur();
                    }}
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
                )}
              />

              <Button
                label={isLoading ? 'Signing in…' : 'Sign in'}
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={isLoading ? undefined : ArrowRight}
              />

              <Link href="/auth/forgot-password" asChild>
                <TouchableOpacity className="self-center mt-4 px-3 py-1.5">
                  <Text className="text-black text-sm">Forgot password?</Text>
                </TouchableOpacity>
              </Link>

              <View className="flex-row justify-center mt-8 flex-wrap">
                <Text className="text-earth-700 text-sm">No account yet? </Text>
                <Link href="/auth/register" asChild>
                  <TouchableOpacity>
                    <Text className="text-black font-semibold text-sm">Create one</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <Link href="/nolwazi" asChild>
                <TouchableOpacity className="mt-5 self-center py-2 border-b border-primary-500/30 active:opacity-80">
                  <Text className="text-earth-800 text-sm font-light text-center">
                    Questions about the app? Chat with <Text className="text-black font-medium">Nolwazi</Text>
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <Text className="text-earth-700 text-center text-xs mt-8 leading-5 px-4">
              Encrypted session · Agricultural learning platform
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
