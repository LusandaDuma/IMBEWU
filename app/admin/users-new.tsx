/**
 * @fileoverview Create new user screen for admins.
 */

import { createUserAsAdmin } from '@/services/authService';
import type { UserRole } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Coordinator', value: 'coordinator' },
  { label: 'Student', value: 'student' },
  { label: 'Independent', value: 'independent' },
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
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRole('student');
  };

  const goToUsersList = () => {
    router.replace('/admin/users');
  };

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
      Alert.alert('User created', 'The new user account was added successfully.', [
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

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="px-5 pb-5 flex-row items-center">
            <TouchableOpacity
              onPress={goToUsersList}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
              activeOpacity={0.9}
            >
              <ChevronLeft size={20} color="white" />
            </TouchableOpacity>
            <View className="ml-3">
              <Text className="text-2xl font-bold text-white">Add User</Text>
              <Text className="text-slate-400">Create a new account for the platform</Text>
            </View>
          </View>

          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            <View className="bg-white/95 rounded-2xl p-4">
              <Text className="text-earth-700 font-medium mb-2">First name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Naledi"
                placeholderTextColor="#a8a29e"
                className="bg-white rounded-xl border border-earth-200 px-4 py-3 text-earth-800"
              />

              <Text className="text-earth-700 font-medium mb-2 mt-4">Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Molefe"
                placeholderTextColor="#a8a29e"
                className="bg-white rounded-xl border border-earth-200 px-4 py-3 text-earth-800"
              />

              <Text className="text-earth-700 font-medium mb-2 mt-4">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#a8a29e"
                className="bg-white rounded-xl border border-earth-200 px-4 py-3 text-earth-800"
              />

              <Text className="text-earth-700 font-medium mb-2 mt-4">Temporary password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry
                placeholderTextColor="#a8a29e"
                className="bg-white rounded-xl border border-earth-200 px-4 py-3 text-earth-800"
              />

              <Text className="text-earth-700 font-medium mb-2 mt-4">Role</Text>
              <View className="flex-row flex-wrap -mx-1">
                {roleOptions.map((option) => {
                  const active = role === option.value;
                  return (
                    <View key={option.value} className="px-1 mb-2 w-1/2">
                      <TouchableOpacity
                        onPress={() => setRole(option.value)}
                        className={`rounded-full py-2.5 items-center border ${active ? 'bg-primary-600 border-primary-500' : 'bg-white border-earth-200'}`}
                        activeOpacity={0.9}
                      >
                        <Text className={active ? 'text-white font-semibold' : 'text-earth-700'}>{option.label}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View className="px-5 py-5">
            <TouchableOpacity
              onPress={handleCreateUser}
              disabled={createUserMutation.isPending}
              className={`rounded-xl py-4 items-center ${createUserMutation.isPending ? 'bg-primary-400' : 'bg-primary-600'}`}
              activeOpacity={0.9}
            >
              <View className="flex-row items-center">
                <Save size={18} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  {createUserMutation.isPending ? 'Creating user...' : 'Create User'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToUsersList}
              className="mt-3 rounded-xl py-3.5 items-center bg-white/10 border border-white/20"
              activeOpacity={0.9}
            >
              <Text className="text-slate-100 font-medium">Back to users list</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
