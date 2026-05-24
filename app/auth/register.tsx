/**
 * @fileoverview Registration screen — luxury emerald & gold theme
 * Keeps all existing auth logic, replaces UI with premium design.
 */

import { AlertBanner } from '@/components/shared';
import { signUp } from '@/services/authService';
import { createProfile } from '@/services/profileService';
import { USER_ROLES } from '@/utils/constants';
import { registerSchema, type RegisterFormData } from '@/validators/authSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Briefcase, Eye, EyeOff, GraduationCap, Key, Leaf, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

const { width } = Dimensions.get('window');
const isWide = width >= 768;

type RegisterRole = RegisterFormData['role'];

const ROLE_OPTIONS: Array<{
  value: RegisterRole;
  label: string;
  description: string;
  icon: typeof Briefcase;
}> = [
  {
    value: USER_ROLES.INDEPENDENT,
    label: 'Self-learner',
    description: 'Learn at your own pace & study drylands science.',
    icon: Briefcase,
  },
  {
    value: USER_ROLES.STUDENT,
    label: 'Join a Class',
    description: 'Access educator curriculums with a shared code.',
    icon: GraduationCap,
  },
  {
    value: USER_ROLES.COORDINATOR,
    label: 'Coordinator',
    description: 'Lead classes, manage learners and track progress.',
    icon: Users,
  },
];

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);
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

    const { data: signUpResult, error } = await signUp(
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

    if (signUpResult?.session?.user) {
      const profileResult = await createProfile({
        id: signUpResult.session.user.id,
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

    setIsSubmitting(false);
// Always redirect to OTP verification
router.push({
  pathname: '/auth/verify-otp',
  params: { email: values.email },
});
  };

  const inputStyle = {
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: '#E8DFD0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: DARK,
    width: '100%' as const,
  };

  const labelStyle = {
    color: GOLD,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
    marginBottom: 6,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, flexDirection: 'row' }} edges={['top', 'bottom']}>

        {/* LEFT PANEL — wide screens only */}
        {isWide && (
          <View style={{
            width: '40%',
            backgroundColor: EMERALD,
            padding: 48,
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: 'white', fontFamily: 'serif', fontSize: 13, letterSpacing: 4, opacity: 0.9 }}>
              IMBEWU
            </Text>

            <View>
              <Leaf size={40} color={GOLD} />
              <Text style={{ color: 'white', fontFamily: 'serif', fontSize: 38, fontWeight: '300', lineHeight: 48, marginTop: 24 }}>
                Grow knowledge.
              </Text>
              <Text style={{ color: GOLD, fontFamily: 'serif', fontSize: 38, fontStyle: 'italic', fontWeight: '300', lineHeight: 48 }}>
                Cultivate mastery.
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 22, marginTop: 20 }}>
                Imbewu is an agriculture learning platform built for the modern grower — structured courses, hands-on field work, and an AI copilot trained on indigenous and regenerative practices.
              </Text>
              <Text style={{ color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 24, fontWeight: '600' }}>
                Established 2026 / Durban KZN
              </Text>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 3 }}>
              © 2026 IMBEWU
            </Text>
          </View>
        )}

        {/* RIGHT PANEL — form */}
        <ScrollView
          style={{ flex: 1, backgroundColor: 'white' }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 28,
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>

            {/* Heading */}
            <Text style={{ color: DARK, fontFamily: 'serif', fontSize: 32, fontWeight: '700', marginBottom: 4 }}>
              Create your account
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 28 }}>
              Access premium agrarian courses, modules, and progress tracking.
            </Text>

            {/* Banner */}
            {banner && (
              <AlertBanner
                message={banner.message}
                variant={banner.variant}
                onDismiss={() => setBanner(null)}
              />
            )}

            {/* First & Last Name row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>First name</Text>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Sipho"
                      placeholderTextColor="#C4B89A"
                      style={inputStyle}
                    />
                  )}
                />
                {errors.firstName && (
                  <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.firstName.message}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Last name</Text>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Dlamini"
                      placeholderTextColor="#C4B89A"
                      style={inputStyle}
                    />
                  )}
                />
                {errors.lastName && (
                  <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.lastName.message}</Text>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={labelStyle}>Email address</Text>
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
                    style={inputStyle}
                  />
                )}
              />
              {errors.email && (
                <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password */}
            <View style={{ marginBottom: 20 }}>
              <Text style={labelStyle}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor="#C4B89A"
                      secureTextEntry={!showPassword}
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
                    >
                      {showPassword
                        ? <EyeOff size={18} color="#C4B89A" />
                        : <Eye size={18} color="#C4B89A" />
                      }
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.password.message}</Text>
              )}
            </View>

            {/* Role Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={labelStyle}>I Want To</Text>
              <View style={{ gap: 10 }}>
                {ROLE_OPTIONS.map((option) => {
                  const selected = selectedRole === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setValue('role', option.value, { shouldValidate: true })}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: selected ? EMERALD : '#E8DFD0',
                        backgroundColor: selected ? `${EMERALD}08` : 'white',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: selected ? EMERALD : '#F3F4F6',
                      }}>
                        <option.icon size={16} color={selected ? GOLD : '#9CA3AF'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: selected ? DARK : '#374151', fontWeight: '700', fontSize: 13, marginBottom: 2 }}>
                          {option.label}
                        </Text>
                        <Text style={{ color: selected ? '#6B7280' : '#9CA3AF', fontSize: 11, lineHeight: 16 }}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.role && (
                <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.role.message}</Text>
              )}
            </View>

            {/* Class Code — shows when Join a Class is selected */}
            {selectedRole === USER_ROLES.STUDENT && (
              <View style={{
                backgroundColor: CREAM,
                borderWidth: 1,
                borderColor: '#E8DFD0',
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
              }}>
                <Text style={{ ...labelStyle, color: DARK }}>Enter Class Join Code</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Key size={14} color={GOLD} />
                  <TextInput
                    placeholder="e.g., KZN-SOIL-2026"
                    placeholderTextColor="#C4B89A"
                    autoCapitalize="characters"
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: DARK,
                      fontWeight: '600',
                      letterSpacing: 1,
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: '#E8DFD0',
                    }}
                  />
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? `${EMERALD}80` : EMERALD,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 20,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                {isSubmitting ? 'Creating account...' : 'Create Premium Account'}
              </Text>
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={{
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#E8DFD0',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Already registered? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity>
                    <Text style={{ color: DARK, fontWeight: '600', fontSize: 12 }}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={{ color: GOLD, fontWeight: '600', fontSize: 12 }}>Study as Guest</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
