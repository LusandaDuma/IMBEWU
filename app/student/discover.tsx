/**
 * @fileoverview Student discover/join class — luxury emerald & gold theme
 */

import { addStudentToClass, getClassByJoinCode } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Compass, KeyRound, Plus, Sparkles, Users, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

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
        const messages: Record<string, string> = {
          'invalid-code': 'Double-check the join code with your coordinator.',
          'already-enrolled': 'You are already enrolled in this course.',
          'already-in-class': 'You are already a member of this class.',
        };
        Alert.alert('Could not join', messages[result.reason] ?? 'Please try again in a moment.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
      Alert.alert('Welcome', 'You have joined the class. Head to My Courses to start learning.');
      setJoinCode('');
      setShowJoinInput(false);
    },
    onError: () => Alert.alert('Could not join class', 'Please try again in a moment.'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Enrolment
          </Text>
          <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
            Discover & Join
          </Text>
        </View>

        {/* Hero Banner */}
        <View style={{
          backgroundColor: EMERALD, marginHorizontal: 20, borderRadius: 20,
          padding: 24, marginBottom: 20, borderWidth: 1, borderColor: `${GOLD}40`,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color={GOLD} />
            <Text style={{ color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
              Class Enrolment
            </Text>
          </View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginBottom: 8 }}>
            Join a class to start learning.
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20 }}>
            Students join courses using a class code provided by their coordinator. Ask your coordinator for the code to get started.
          </Text>
        </View>

        {/* Join Class Section */}
        <View style={{ paddingHorizontal: 20 }}>
          {!showJoinInput ? (
            <TouchableOpacity
              onPress={() => setShowJoinInput(true)}
              style={{
                backgroundColor: 'white', borderRadius: 16, padding: 20,
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: '#E8DFD0',
              }}
              activeOpacity={0.85}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: EMERALD, alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: `${GOLD}60`,
              }}>
                <Users size={22} color={GOLD} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ color: DARK, fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
                  Join a class
                </Text>
                <Text style={{ color: '#8B7355', fontSize: 13 }}>
                  Use the code from your coordinator
                </Text>
              </View>
              <Plus size={22} color={GOLD} />
            </TouchableOpacity>
          ) : (
            <View style={{
              backgroundColor: 'white', borderRadius: 16, padding: 20,
              borderWidth: 1, borderColor: '#E8DFD0',
            }}>
              {/* Input Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <KeyRound size={18} color={GOLD} />
                  <Text style={{ color: DARK, fontWeight: '600', fontSize: 16 }}>Enter join code</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowJoinInput(false); setJoinCode(''); }}>
                  <X size={20} color="#8B7355" />
                </TouchableOpacity>
              </View>

              {/* Code Input */}
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="e.g. SOIL2024"
                placeholderTextColor="#C4B89A"
                autoCapitalize="characters"
                maxLength={10}
                style={{
                  backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
                  fontSize: 20, color: DARK, letterSpacing: 4, fontWeight: '700',
                  textAlign: 'center', marginBottom: 16,
                }}
              />

              {/* Join Button */}
              <TouchableOpacity
                onPress={() => { if (joinCode.trim() && user) joinClassMutation.mutate(joinCode); }}
                disabled={joinClassMutation.isPending || !joinCode.trim()}
                style={{
                  backgroundColor: !joinCode.trim() ? `${EMERALD}50` : EMERALD,
                  borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                  borderWidth: 1, borderColor: `${GOLD}40`,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: GOLD, fontWeight: '700', fontSize: 15 }}>
                  {joinClassMutation.isPending ? 'Joining...' : 'Join Class'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Card */}
          <View style={{
            backgroundColor: 'white', borderRadius: 16, padding: 20,
            marginTop: 16, borderWidth: 1, borderColor: '#E8DFD0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Compass size={18} color={GOLD} />
              <Text style={{ color: DARK, fontWeight: '600', fontSize: 15 }}>How it works</Text>
            </View>
            {[
              { step: '1', text: 'Get a class code from your coordinator or educator' },
              { step: '2', text: 'Tap "Join a class" and enter your code' },
              { step: '3', text: 'Start learning immediately from My Courses' },
            ].map((item) => (
              <View key={item.step} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: EMERALD, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: GOLD, fontSize: 11, fontWeight: '700' }}>{item.step}</Text>
                </View>
                <Text style={{ color: '#8B7355', fontSize: 13, flex: 1, lineHeight: 20 }}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
