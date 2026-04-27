/**
 * @fileoverview Student class join screen.
 */

import { Button, ScreenHeader } from '@/components/shared';
import {
  addStudentToClass,
  getClassByJoinCode,
} from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const joinClassMutation = useMutation({
    mutationFn: async (rawCode: string) => {
      if (!user) return { ok: false as const, reason: 'not-authenticated' };

      const classData = await getClassByJoinCode(rawCode.trim().toUpperCase());
      if (!classData) return { ok: false as const, reason: 'invalid-code' };

      const result = await addStudentToClass(classData.id, user.id);
      if (result !== 'joined') return { ok: false as const, reason: result };

      return { ok: true as const };
    },
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.reason === 'invalid-code') {
          Alert.alert('Code not found', 'Double-check the join code with your coordinator.');
          return;
        }

        if (result.reason === 'already-enrolled') {
          Alert.alert(
            'Already enrolled',
            'You are already enrolled in this course, so you cannot join another class for it.'
          );
          return;
        }

        if (result.reason === 'already-in-class') {
          Alert.alert('Already in class', 'You are already a member of this class.');
          return;
        }

        Alert.alert('Could not join class', 'Please try again in a moment.');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
      Alert.alert('Welcome', 'You have joined the class.');
      setJoinCode('');
      setShowJoinInput(false);
    },
    onError: () => {
      Alert.alert('Could not join class', 'Please try again in a moment.');
    },
  });

  const handleJoinClass = async () => {
    if (!joinCode.trim() || !user) return;
    joinClassMutation.mutate(joinCode);
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader
          title="Join class"
          subtitle="Students join courses using a class code from a coordinator."
          variant="light"
        />

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
          <Text className="text-earth-700 text-sm mb-4">
            Students cannot self-enrol into courses. Ask your coordinator for a class code to join.
          </Text>
          {!showJoinInput ? (
            <TouchableOpacity
              onPress={() => setShowJoinInput(true)}
              activeOpacity={0.92}
              className="flex-row items-center py-4 border-b border-earth-400/35"
            >
              <View className="w-12 h-12 items-center justify-center">
                <Users size={22} color="#d97706" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-medium text-earth-900 text-base tracking-tight">Join a class</Text>
                <Text className="text-earth-600 text-sm mt-0.5">Use the code from your coordinator</Text>
              </View>
              <Plus size={22} color="#b45309" />
            </TouchableOpacity>
          ) : (
            <View className="pb-4 border-b border-earth-400/35">
              <Text className="font-medium text-earth-900 mb-3 tracking-tight">Enter join code</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border-b border-earth-400/50 py-2 text-earth-900 uppercase tracking-widest font-medium"
                  placeholder="CODE"
                  placeholderTextColor="#a8a29e"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  maxLength={10}
                />
                <Button
                  label={joinClassMutation.isPending ? 'Joining…' : 'Join'}
                  onPress={handleJoinClass}
                  variant="accent"
                  size="md"
                  isLoading={joinClassMutation.isPending}
                  disabled={joinClassMutation.isPending}
                />
              </View>
              <TouchableOpacity onPress={() => setShowJoinInput(false)} className="mt-3 py-2">
                <Text className="text-earth-800 text-center text-sm font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
