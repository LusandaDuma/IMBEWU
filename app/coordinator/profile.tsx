/**
 * @fileoverview Coordinator profile screen — full luxury visual treatment.
 */

import { signOut } from '@/services/authService';
import { updateProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, Globe, LogOut, Type, User } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLE_LABEL: Record<string, string> = {
  coordinator: 'Coordinator',
  admin: 'Administrator',
  student: 'Student',
  independent: 'Independent Learner',
};

function UnderlineField({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  autoCapitalize = 'words',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
}) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{
        color: '#a8a29e', fontSize: 10, letterSpacing: 2.5,
        fontWeight: '400', marginBottom: 10, textTransform: 'uppercase',
      }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(28,25,23,0.15)', paddingBottom: 10 }}>
        <Icon size={15} color="#a8a29e" strokeWidth={1.5} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#d4d4d0"
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            marginLeft: 12,
            color: '#1c1917',
            fontSize: 16,
            fontWeight: '300',
            padding: 0,
          }}
        />
      </View>
    </View>
  );
}

export default function CoordinatorProfileScreen() {
  const { profile, logout, setProfile } = useAuthStore();
  const router = useRouter();

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [isSaving, setIsSaving] = useState(false);

  const initials = `${profile?.first_name?.charAt(0) ?? ''}${profile?.last_name?.charAt(0) ?? ''}`.toUpperCase() || '?';
  const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();
  const roleLabel = ROLE_LABEL[profile?.role ?? ''] ?? profile?.role ?? '';

  const handleSave = async () => {
    if (!profile?.id) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing information', 'First name and last name are required.');
      return;
    }
    setIsSaving(true);
    const result = await updateProfile({
      id: profile.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      language: language.trim() || 'en',
    });
    setIsSaving(false);
    if (result.error || !result.data) {
      Alert.alert('Update failed', result.error ?? 'Unable to update your profile.');
      return;
    }
    setProfile(result.data);
    Alert.alert('Saved', 'Your information was updated.');
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
          signOut().catch((err) => console.error('[coordinator.profile] signOut error:', err));
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 52 }}
        >

          {/* ── Hero card ─────────────────────────────────────────────── */}
          <View style={{ margin: 16, borderRadius: 28, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#0a2416', '#0d3020', '#071a0f']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{ paddingTop: 32, paddingBottom: 32, alignItems: 'center' }}
            >
              {/* Watermark */}
              <Text style={{
                position: 'absolute', right: 10, top: 8,
                fontSize: 80, fontWeight: '800',
                color: 'rgba(212,175,55,0.05)', letterSpacing: -4,
              }}>P</Text>

              {/* Avatar ring */}
              <View style={{
                width: 86, height: 86, borderRadius: 43,
                borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <View style={{
                  width: 76, height: 76, borderRadius: 38,
                  backgroundColor: 'rgba(212,175,55,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#d4af37', fontSize: 26, fontWeight: '200', letterSpacing: 2 }}>
                    {initials}
                  </Text>
                </View>
              </View>

              {/* Name */}
              <Text style={{
                color: '#f5f0e8', fontSize: 22, fontWeight: '200',
                letterSpacing: -0.3, marginBottom: 4,
              }}>
                {fullName || 'Your Name'}
              </Text>

              {/* Role badge */}
              <View style={{
                borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
                borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3,
              }}>
                <Text style={{ color: '#d4af37', fontSize: 9, letterSpacing: 2.5, fontWeight: '400' }}>
                  {roleLabel.toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── Edit form ─────────────────────────────────────────────── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.65)',
              borderRadius: 24, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24,
            }}>
              <Text style={{
                color: '#a8a29e', fontSize: 10, letterSpacing: 2.5,
                fontWeight: '400', marginBottom: 24,
              }}>
                PERSONAL INFORMATION
              </Text>

              <UnderlineField
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                icon={User}
              />
              <UnderlineField
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                icon={Type}
              />
              <UnderlineField
                label="Language"
                value={language}
                onChangeText={setLanguage}
                placeholder="en"
                icon={Globe}
                autoCapitalize="none"
              />

              {/* Save button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  backgroundColor: isSaving ? '#86efac' : '#16a34a',
                  borderRadius: 16, paddingVertical: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  marginTop: 4,
                }}
                activeOpacity={0.9}
              >
                {isSaving
                  ? <Text style={{ color: 'white', fontSize: 15, fontWeight: '400' }}>Saving…</Text>
                  : (
                    <>
                      <Check size={16} color="white" strokeWidth={2} />
                      <Text style={{ color: 'white', fontSize: 15, fontWeight: '400', marginLeft: 8 }}>
                        Save changes
                      </Text>
                    </>
                  )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Account section ───────────────────────────────────────── */}
          <View style={{ marginHorizontal: 16 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.65)',
              borderRadius: 24, paddingHorizontal: 24, paddingVertical: 20,
            }}>
              <Text style={{
                color: '#a8a29e', fontSize: 10, letterSpacing: 2.5,
                fontWeight: '400', marginBottom: 16,
              }}>
                ACCOUNT
              </Text>

              <TouchableOpacity
                onPress={handleLogout}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(220,38,38,0.08)',
                  alignItems: 'center', justifyContent: 'center', marginRight: 14,
                }}>
                  <LogOut size={16} color="#dc2626" strokeWidth={1.5} />
                </View>
                <Text style={{ color: '#dc2626', fontSize: 15, fontWeight: '300', flex: 1 }}>
                  Sign out
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Branding footer ───────────────────────────────────────── */}
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ color: '#a8a29e', fontSize: 11, fontWeight: '300', letterSpacing: 0.5 }}>
              Imbewu v1.0
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
