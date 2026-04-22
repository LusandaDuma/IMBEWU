/**
 * @fileoverview Password reset request screen.
 */

import { AlertBanner, Button, FormField } from '@/components/shared';
import { requestPasswordReset } from '@/services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { ArrowLeft, Mail, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmailError(undefined);

    const validated = resetSchema.safeParse({ email });
    if (!validated.success) {
      setEmailError(validated.error.issues[0]?.message ?? 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    const { error } = await requestPasswordReset(validated.data.email);

    if (error) {
      setErrorMessage(error);
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Reset link sent. Please check your email inbox.');
    setIsLoading(false);
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
              <Text className="text-3xl font-light text-white mb-2 text-center tracking-tight">
                Reset your password
              </Text>
              <Text className="text-slate-400/95 text-center text-base leading-6 max-w-xs font-light">
                Enter your account email and we will send you a secure reset link.
              </Text>
            </View>

            <View className="rounded-[28px] p-8 bg-white/6">
              {errorMessage ? (
                <AlertBanner
                  message={errorMessage}
                  variant="error"
                  onDismiss={() => setErrorMessage(null)}
                />
              ) : null}

              {successMessage ? (
                <AlertBanner
                  message={successMessage}
                  variant="success"
                  onDismiss={() => setSuccessMessage(null)}
                />
              ) : null}

              <FormField
                appearance="dark"
                leftIcon={Mail}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                focused={focusedInput === 'email'}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />

              <Button
                label={isLoading ? 'Sending reset link…' : 'Send reset link'}
                onPress={handleReset}
                isLoading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="lg"
                fullWidth
              />

              <Link href="/auth/login" asChild>
                <TouchableOpacity className="flex-row items-center justify-center mt-8">
                  <ArrowLeft size={16} color="#94a3b8" />
                  <Text className="text-slate-400 text-sm ml-2">Back to sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
