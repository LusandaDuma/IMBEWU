/**
 * @fileoverview Modern Login screen with enhanced UI/UX
 */

import { signInWithEmail } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { loginSchema } from '@/validators';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    try {
      setErrors({});
      const validated = loginSchema.parse({ email, password });
      setIsLoading(true);

      const { data, error } = await signInWithEmail(validated.email, validated.password);

      if (error) {
        Alert.alert('Login Failed', error.message);
        return;
      }

      if (data.user) {
        const { getProfile } = await import('@/services/supabase');
        const profile = await getProfile(data.user.id);
        setUser(profile);
        router.replace('/');
      }
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
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center mb-6 shadow-2xl">
              <Sprout size={40} color="white" strokeWidth={1.5} />
            </View>
            <Text className="text-4xl font-bold text-white mb-2">Welcome Back</Text>
            <Text className="text-slate-300 text-center text-base">Continue your learning journey</Text>
          </View>

          {/* Form Card */}
          <View className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
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

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`rounded-2xl py-4 items-center shadow-lg transition-all flex-row justify-center gap-2 ${
                isLoading 
                  ? 'bg-primary-400 shadow-primary-400/50' 
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-primary-600/50'
              }`}
            >
              <Text className="text-white font-bold text-lg">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
              {!isLoading && <ArrowRight size={20} color="white" />}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-400">Don't have an account? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-400 font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Footer Text */}
          <Text className="text-slate-500 text-center text-xs mt-8">
            Secure login with encryption
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
