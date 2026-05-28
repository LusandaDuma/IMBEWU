/**
 * @fileoverview Independent learner profile — luxury emerald & gold theme.
 */

import { signOut } from '@/services/authService';
import { updateProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { Check, Globe, LogOut, Sprout, Type, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zu', label: 'Zulu' },
  { code: 'xh', label: 'Xhosa' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'st', label: 'Sotho' },
];

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
        color: '#8B7355', fontSize: 10, letterSpacing: 2.5,
        fontWeight: '600', marginBottom: 10, textTransform: 'uppercase',
      }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(3,47,32,0.15)', paddingBottom: 10 }}>
        <Icon size={15} color="#8B7355" strokeWidth={1.5} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#C4B89A"
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1, marginLeft: 12,
            color: DARK, fontSize: 16, fontWeight: '300', padding: 0,
          }}
        />
      </View>
    </View>
  );
}

export default function IndependentProfileScreen() {
  const { profile, logout, setProfile } = useAuthStore();
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [isSaving, setIsSaving] = useState(false);

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();

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
        onPress: async () => {
          await signOut().catch((err) => console.error('[independent.profile] signOut error:', err));
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 52 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Account
          </Text>
          <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
            My Profile
          </Text>
        </View>

        {/* Hero card */}
        <View style={{ margin: 16, borderRadius: 28, overflow: 'hidden' }}>
          <View style={{
            backgroundColor: EMERALD,
            paddingTop: 32, paddingBottom: 32,
            alignItems: 'center',
            borderWidth: 1, borderColor: `${GOLD}30`,
            borderRadius: 28,
          }}>
            {/* Watermark */}
            <Text style={{
              position: 'absolute', right: 10, top: 8,
              fontSize: 80, fontWeight: '800',
              color: `${GOLD}08`, letterSpacing: -4,
            }}>I</Text>

            {/* Avatar ring */}
            <View style={{
              width: 86, height: 86, borderRadius: 43,
              borderWidth: 1.5, borderColor: `${GOLD}50`,
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <View style={{
                width: 76, height: 76, borderRadius: 38,
                backgroundColor: `${GOLD}18`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: GOLD, fontSize: 26, fontWeight: '200', letterSpacing: 2 }}>
                  {initials}
                </Text>
              </View>
            </View>

            {/* Name */}
            <Text style={{
              color: '#f5f0e8', fontSize: 22, fontWeight: '200',
              letterSpacing: -0.3, marginBottom: 8,
            }}>
              {fullName || 'Your Name'}
            </Text>

            {/* Role badge */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              borderWidth: 1, borderColor: `${GOLD}40`,
              borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Sprout size={10} color={GOLD} />
              <Text style={{ color: GOLD, fontSize: 9, letterSpacing: 2.5, fontWeight: '400' }}>
                INDEPENDENT GROWER
              </Text>
            </View>
          </View>
        </View>

        {/* Edit form */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.80)',
            borderRadius: 24, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24,
            borderWidth: 1, borderColor: '#E8DFD0',
          }}>
            <Text style={{
              color: '#8B7355', fontSize: 10, letterSpacing: 2.5,
              fontWeight: '600', marginBottom: 24, textTransform: 'uppercase',
            }}>
              Personal Information
            </Text>

            <UnderlineField label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" icon={User} />
            <UnderlineField label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" icon={Type} />

            {/* Language pills */}
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <Globe size={14} color="#8B7355" strokeWidth={1.5} />
                <Text style={{ color: '#8B7355', fontSize: 10, letterSpacing: 2.5, fontWeight: '600', textTransform: 'uppercase' }}>
                  Language
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => setLanguage(lang.code)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: language === lang.code ? EMERALD : CREAM,
                      borderWidth: 1, borderColor: language === lang.code ? `${GOLD}60` : '#E8DFD0',
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: language === lang.code ? GOLD : '#8B7355', fontSize: 12, fontWeight: '500' }}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? `${EMERALD}70` : EMERALD,
                borderRadius: 16, paddingVertical: 16,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, marginTop: 4,
                borderWidth: 1, borderColor: `${GOLD}30`,
              }}
              activeOpacity={0.9}
            >
              {isSaving
                ? <Text style={{ color: GOLD, fontSize: 15, fontWeight: '400' }}>Saving…</Text>
                : (
                  <>
                    <Check size={16} color={GOLD} strokeWidth={2} />
                    <Text style={{ color: GOLD, fontSize: 15, fontWeight: '400' }}>Save changes</Text>
                  </>
                )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Account section */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.80)',
            borderRadius: 24, paddingHorizontal: 24, paddingVertical: 20,
            borderWidth: 1, borderColor: '#E8DFD0',
          }}>
            <Text style={{ color: '#8B7355', fontSize: 10, letterSpacing: 2.5, fontWeight: '600', marginBottom: 16, textTransform: 'uppercase' }}>
              Account
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
              <Text style={{ color: '#dc2626', fontSize: 15, fontWeight: '300', flex: 1 }}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Branding footer */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, fontWeight: '300', letterSpacing: 0.5 }}>
            Imbewu v1.0
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
