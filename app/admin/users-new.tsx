/**
 * @fileoverview Create new user — luxury emerald & gold theme
 */

import { createUserAsAdmin } from '@/services/authService';
import type { UserRole } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

const roleOptions: { label: string; value: UserRole; description: string }[] = [
  { label: 'Student', value: 'student', description: 'Learn through structured courses' },
  { label: 'Coordinator', value: 'coordinator', description: 'Lead classes and learners' },
  { label: 'Independent', value: 'independent', description: 'Cultivate at own pace' },
  { label: 'Admin', value: 'admin', description: 'Full platform access' },
];

export default function AdminUsersNewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');

  const resetForm = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setRole('student');
  };

  const goToUsersList = () => router.replace('/admin/users');

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const result = await createUserAsAdmin(email.trim(), password, firstName.trim(), lastName.trim(), role);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
      resetForm();
      Alert.alert('Registered', 'The new user account was added successfully.', [
        { text: 'Add another', style: 'cancel' },
        { text: 'Back to users list', onPress: goToUsersList },
      ]);
    },
    onError: (error) => {
      Alert.alert('Could not create user', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const handleCreateUser = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please complete all fields before creating the user.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters for the user password.');
      return;
    }
    createUserMutation.mutate();
  };

  const inputStyle = {
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: '#E8DFD0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: DARK,
  };

  const labelStyle = {
    color: '#8B7355',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
    marginBottom: 8,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
            <TouchableOpacity
              onPress={goToUsersList}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: '#E8DFD0', marginRight: 14,
              }}
              activeOpacity={0.85}
            >
              <ChevronLeft size={20} color={DARK} />
            </TouchableOpacity>
            <View>
              <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
                Growers & Roles
              </Text>
              <Text style={{ color: DARK, fontSize: 24, fontWeight: '300', fontFamily: 'serif' }}>
                Register New Account
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={{
            backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20,
            padding: 24, borderWidth: 1, borderColor: '#E8DFD0', marginBottom: 16,
          }}>
            {/* Card Header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              marginBottom: 24, paddingBottom: 16,
              borderBottomWidth: 1, borderBottomColor: '#F0EAE0',
            }}>
              <UserPlus size={16} color={GOLD} />
              <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' }}>
                Account Details
              </Text>
            </View>

            {/* First & Last Name row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. Lungile"
                  placeholderTextColor="#C4B89A"
                  style={inputStyle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="e.g. Cele"
                  placeholderTextColor="#C4B89A"
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 20 }}>
              <Text style={labelStyle}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. lungile@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#C4B89A"
                style={inputStyle}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={labelStyle}>Temporary Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry
                placeholderTextColor="#C4B89A"
                style={inputStyle}
              />
            </View>

            {/* Role Selection */}
            <View>
              <Text style={labelStyle}>Academy Credentials Role</Text>
              <View style={{ gap: 10 }}>
                {roleOptions.map((option) => {
                  const active = role === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setRole(option.value)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 14,
                        borderRadius: 12,
                        backgroundColor: active ? EMERALD : CREAM,
                        borderWidth: 1,
                        borderColor: active ? EMERALD : '#E8DFD0',
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={{
                        width: 20, height: 20, borderRadius: 10,
                        borderWidth: 2,
                        borderColor: active ? GOLD : '#C4B89A',
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        {active && (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD }} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: active ? GOLD : DARK, fontWeight: '600', fontSize: 14 }}>
                          {option.label}
                        </Text>
                        <Text style={{ color: active ? 'rgba(255,255,255,0.6)' : '#8B7355', fontSize: 12, marginTop: 2 }}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
            <TouchableOpacity
              onPress={handleCreateUser}
              disabled={createUserMutation.isPending}
              style={{
                backgroundColor: createUserMutation.isPending ? `${EMERALD}80` : EMERALD,
                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                borderWidth: 1, borderColor: `${GOLD}40`,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: GOLD, fontWeight: '700', fontSize: 15, letterSpacing: 0.5 }}>
                {createUserMutation.isPending ? 'Registering...' : 'Confirm Registration'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToUsersList}
              style={{
                borderRadius: 14, paddingVertical: 14, alignItems: 'center',
                borderWidth: 1, borderColor: '#E8DFD0', backgroundColor: 'white',
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#8B7355', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
