/**
 * @fileoverview Modern Signup screen with enhanced UI/UX
 */

import { signUpWithEmail } from '@/services/supabase';
import { signupSchema } from '@/validators';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { BookOpen, Briefcase, Eye, EyeOff, Lock, Mail, Sprout, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

interface RoleOption {
  id: 'student' | 'independent_grower' | 'program_coordinator';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    label: 'Student',
    description: 'Learning in a program',
    icon: <BookOpen size={24} color="white" />,
  },
  {
    id: 'independent_grower',
    label: 'Independent Grower',
    description: 'Self-directed learning',
    icon: <Sprout size={24} color="white" />,
  },
  {
    id: 'program_coordinator',
    label: 'Coordinator',
    description: 'Program admin',
    icon: <Briefcase size={24} color="white" />,
  },
];

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'independent_grower' | 'program_coordinator'>('student');
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
        Alert.alert('Signup Failed', error.message);
        return;
      }

      Alert.alert(
        'Account Created',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const pathKey = issue.path[0]?.toString();
          if (pathKey) {
            fieldErrors[pathKey] = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ 
    icon: Icon, 
    placeholder, 
    value, 
    onChangeText, 
    error,
    fieldName,
    secureTextEntry = false,
    rightIcon: RightIcon = null,
    onRightIconPress = null,
    keyboardType = 'default',
  }: any) => (
    <View className="mb-4">
      <View 
        className={`flex-row items-center rounded-2xl px-5 py-4 transition-all ${
          focusedInput === fieldName
            ? 'bg-primary-50 border-2 border-primary-600'
            : 'bg-slate-50 border-2 border-transparent'
        }`}
      >
        <Icon size={22} color={focusedInput === fieldName ? '#16a34a' : '#94a3b8'} />
        <TextInput
          className="flex-1 ml-4 text-slate-800 text-base"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedInput(fieldName)}
          onBlur={() => setFocusedInput(null)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          placeholderTextColor="#cbd5e1"
        />
        {RightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <RightIcon size={22} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-2 ml-1 font-medium">{error}</Text>
      )}
    </View>
  );

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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center mb-6 shadow-2xl">
              <Sprout size={40} color="white" strokeWidth={1.5} />
            </View>
            <Text className="text-4xl font-bold text-white mb-2">Join Imbewu</Text>
            <Text className="text-slate-300 text-center text-base">Transform your learning journey</Text>
          </View>

          {/* Form Card */}
          <View className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
            {/* Name Fields */}
            <View className="flex-row gap-3 mb-2">
              <View className="flex-1">
                <InputField
                  icon={User}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={errors.firstName}
                  fieldName="firstName"
                />
              </View>
              <View className="flex-1">
                <InputField
                  icon={User}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  error={errors.lastName}
                  fieldName="lastName"
                />
              </View>
            </View>

            {/* Email Field */}
            <InputField
              icon={Mail}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              fieldName="email"
              keyboardType="email-address"
            />

            {/* Password Field */}
            <InputField
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              fieldName="password"
              secureTextEntry={!showPassword}
              RightIcon={showPassword ? EyeOff : Eye}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Role Selection */}
            <View className="mt-8 mb-8">
              <Text className="text-white font-semibold text-lg mb-4">I am a:</Text>
              <View className="gap-3">
                {ROLE_OPTIONS.map((roleOption) => (
                  <TouchableOpacity
                    key={roleOption.id}
                    onPress={() => setRole(roleOption.id)}
                    className={`flex-row items-center rounded-2xl p-4 border-2 transition-all ${
                      role === roleOption.id
                        ? 'bg-primary-600 border-primary-500 shadow-lg shadow-primary-500/50'
                        : 'bg-slate-700 border-slate-600'
                    }`}
                  >
                    <View 
                      className={`w-12 h-12 rounded-xl items-center justify-center ${
                        role === roleOption.id ? 'bg-primary-700' : 'bg-slate-600'
                      }`}
                    >
                      {roleOption.icon}
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className={`font-semibold text-base ${
                        role === roleOption.id ? 'text-white' : 'text-slate-100'
                      }`}>
                        {roleOption.label}
                      </Text>
                      <Text className={`text-sm mt-1 ${
                        role === roleOption.id ? 'text-primary-100' : 'text-slate-400'
                      }`}>
                        {roleOption.description}
                      </Text>
                    </View>
                    {role === roleOption.id && (
                      <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                        <View className="w-3 h-3 rounded-full bg-primary-600" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              className={`rounded-2xl py-4 items-center shadow-lg transition-all ${
                isLoading 
                  ? 'bg-primary-400 shadow-primary-400/50' 
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-primary-600/50'
              }`}
            >
              <Text className="text-white font-bold text-lg">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-400">Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-400 font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Footer Text */}
          <Text className="text-slate-500 text-center text-xs mt-8">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
