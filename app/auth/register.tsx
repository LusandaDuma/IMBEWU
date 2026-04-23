/**
 * @fileoverview Registration screen with react-hook-form + zod validation.
 */

import { AlertBanner, Button, FormField } from '@/components/shared';
import { signUp } from '@/services/authService';
import { createProfile } from '@/services/profileService';
import { registerSchema, type RegisterFormData } from '@/validators/authSchemas';
import { USER_ROLES } from '@/utils/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Sprout, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RegisterRole = RegisterFormData['role'];

const ROLE_OPTIONS: Array<{ value: RegisterRole; label: string; description: string }> = [
  {
    value: USER_ROLES.INDEPENDENT,
    label: 'Self-learner',
    description: 'Learn at your own pace',
  },
  {
    value: USER_ROLES.STUDENT,
    label: 'Join a class',
    description: 'Use a class join code',
  },
];

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: USER_ROLES.INDEPENDENT,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormData) => {
    setBanner(null);
    setIsSubmitting(true);

    const { data: session, error } = await signUp(
      values.email,
      values.password,
      values.firstName,
      values.lastName,
      values.role
    );

    if (error) {
      setBanner({ message: error, variant: 'error' });
      setIsSubmitting(false);
      return;
    }

    if (session?.user) {
      const profileResult = await createProfile({
        id: session.user.id,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
      });

      if (profileResult.error) {
        setBanner({ message: profileResult.error, variant: 'error' });
        setIsSubmitting(false);
        return;
      }
    }

    setBanner({ message: 'Account created. You can sign in now.', variant: 'success' });
    setIsSubmitting(false);
    router.replace('/auth/login');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 28, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center mb-8">
              <View className="w-24 h-24 rounded-[28px] bg-primary-600/95 items-center justify-center mb-6">
                <Sprout size={44} color="white" strokeWidth={1.25} />
              </View>
              <Text className="text-3xl font-light text-white mb-2 text-center tracking-tight">Create your account</Text>
              <Text className="text-slate-400/95 text-center text-base leading-6 max-w-sm font-light">
                Join Imbewu to access courses, lessons, and progress tracking.
              </Text>
            </View>

            <View className="rounded-[28px] p-8 bg-white/6">
              {banner ? (
                <AlertBanner message={banner.message} variant={banner.variant} onDismiss={() => setBanner(null)} />
              ) : null}

              <View className="flex-row gap-3 mb-1">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormField
                        appearance="dark"
                        leftIcon={User}
                        placeholder="First name"
                        value={value}
                        onChangeText={onChange}
                        error={errors.firstName?.message}
                        focused={focusedInput === 'firstName'}
                        onFocus={() => setFocusedInput('firstName')}
                        onBlur={() => {
                          setFocusedInput(null);
                          onBlur();
                        }}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormField
                        appearance="dark"
                        leftIcon={User}
                        placeholder="Last name"
                        value={value}
                        onChangeText={onChange}
                        error={errors.lastName?.message}
                        focused={focusedInput === 'lastName'}
                        onFocus={() => setFocusedInput('lastName')}
                        onBlur={() => {
                          setFocusedInput(null);
                          onBlur();
                        }}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    appearance="dark"
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
                    appearance="dark"
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
                        {showPassword ? <EyeOff size={22} color="#94a3b8" /> : <Eye size={22} color="#94a3b8" />}
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <View className="mt-2 mb-6">
                <Text className="text-slate-300 font-semibold text-sm mb-3 tracking-wide uppercase">I want to</Text>
                <View className="gap-3">
                  {ROLE_OPTIONS.map((option) => {
                    const selected = selectedRole === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setValue('role', option.value, { shouldValidate: true })}
                        activeOpacity={0.88}
                        className={`rounded-3xl p-4 ${selected ? 'bg-primary-600/35' : 'bg-white/5'}`}
                      >
                        <Text className={`font-semibold text-base ${selected ? 'text-white' : 'text-slate-100'}`}>{option.label}</Text>
                        <Text className={`text-sm mt-1 leading-5 ${selected ? 'text-primary-100' : 'text-slate-400'}`}>
                          {option.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.role ? <Text className="text-red-400 text-sm mt-2 font-medium">{errors.role.message}</Text> : null}
              </View>

              <Button
                label={isSubmitting ? 'Creating account…' : 'Create account'}
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                disabled={isSubmitting}
                variant="primary"
                size="lg"
                fullWidth
              />

              <View className="flex-row justify-center mt-8 flex-wrap">
                <Text className="text-slate-400 text-sm">Already have an account? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary-400 font-semibold text-sm">Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
