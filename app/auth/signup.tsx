/**
 * @fileoverview LMS registration — role-aware signup (student | independent | coordinator).
 */

import { Button, FormField } from '@/components/shared';
import { signUpWithEmail } from '@/services/supabase';
import { signupSchema } from '@/validators';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { BookOpen, Briefcase, Eye, EyeOff, Lock, Mail, Sprout, User } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

type SignupRole = 'student' | 'independent' | 'coordinator';

interface RoleOption {
  id: SignupRole;
  label: string;
  description: string;
  icon: ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    label: 'Student',
    description: 'Join a class with a join code',
    icon: <BookOpen size={22} color="white" />,
  },
  {
    id: 'independent',
    label: 'Independent learner',
    description: 'Self-paced courses, no class required',
    icon: <Sprout size={22} color="white" />,
  },
  {
    id: 'coordinator',
    label: 'Coordinator',
    description: 'Run classes and track learner progress',
    icon: <Briefcase size={22} color="white" />,
  },
];

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async () => {
    try {
      setErrors({});
      const validated = signupSchema.parse({
        firstName,
        lastName,
        email,
        password,
        role,
      });
      setIsLoading(true);

      const { data, error } = await signUpWithEmail(
        validated.email,
        validated.password,
        {
          first_name: validated.firstName,
          last_name: validated.lastName,
          role: validated.role,
        }
      );

      if (error) {
        Alert.alert('Signup failed', error.message);
        return;
      }

      Alert.alert('Account created', 'Check your email to verify your account.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingVertical: 28,
              paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center mb-8">
              <View className="w-24 h-24 rounded-[28px] bg-primary-600/95 items-center justify-center mb-6">
                <Sprout size={44} color="white" strokeWidth={1.25} />
              </View>
              <Text className="text-3xl font-light text-white mb-2 text-center tracking-tight">Create your account</Text>
              <Text className="text-slate-400/95 text-center text-base leading-6 max-w-sm font-light">
                Join Imbewu to access courses, lessons, quizzes, and certificates of progress.
              </Text>
            </View>

            <View className="rounded-[28px] p-8 bg-white/6">
              <View className="flex-row gap-3 mb-1">
                <View className="flex-1">
                  <FormField
                    appearance="dark"
                    leftIcon={User}
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    error={errors.firstName}
                    focused={focusedInput === 'firstName'}
                    onFocus={() => setFocusedInput('firstName')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    appearance="dark"
                    leftIcon={User}
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    error={errors.lastName}
                    focused={focusedInput === 'lastName'}
                    onFocus={() => setFocusedInput('lastName')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

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
                    {showPassword ? <EyeOff size={22} color="#94a3b8" /> : <Eye size={22} color="#94a3b8" />}
                  </TouchableOpacity>
                }
              />

              <View className="mt-2 mb-6">
                <Text className="text-slate-300 font-semibold text-sm mb-3 tracking-wide uppercase">
                  I am a
                </Text>
                <View className="gap-3">
                  {ROLE_OPTIONS.map((roleOption) => {
                    const selected = role === roleOption.id;
                    return (
                      <TouchableOpacity
                        key={roleOption.id}
                        onPress={() => setRole(roleOption.id)}
                        activeOpacity={0.88}
                        className={`flex-row items-center rounded-3xl p-4 ${
                          selected ? 'bg-primary-600/35' : 'bg-white/5'
                        }`}
                      >
                        <View
                          className={`w-12 h-12 rounded-2xl items-center justify-center ${
                            selected ? 'bg-primary-600/50' : 'bg-white/8'
                          }`}
                        >
                          {roleOption.icon}
                        </View>
                        <View className="ml-4 flex-1 min-w-0">
                          <Text
                            className={`font-semibold text-base ${selected ? 'text-white' : 'text-slate-100'}`}
                          >
                            {roleOption.label}
                          </Text>
                          <Text
                            className={`text-sm mt-1 leading-5 ${selected ? 'text-primary-100' : 'text-slate-400'}`}
                          >
                            {roleOption.description}
                          </Text>
                        </View>
                        {selected ? (
                          <View className="w-6 h-6 rounded-full bg-white items-center justify-center ml-2">
                            <View className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.role ? (
                  <Text className="text-red-400 text-sm mt-2 font-medium">{errors.role}</Text>
                ) : null}
              </View>

              <Button
                label={isLoading ? 'Creating account…' : 'Create account'}
                onPress={handleSignup}
                isLoading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="lg"
                fullWidth
              />

              <View className="flex-row justify-center mt-8 flex-wrap">
                <Text className="text-slate-400 text-sm">Already learning here? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary-400 font-semibold text-sm">Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            <Text className="text-slate-600 text-center text-xs mt-8 leading-5 px-2">
              By continuing you agree to the platform terms and privacy practices.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
